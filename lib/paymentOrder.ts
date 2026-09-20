// lib/paymentOrder.ts
//
// Enforces in-order term payments within a session: a term cannot be paid
// while an earlier *available* term is still unpaid.
//
//   school_fees  -> a term is available when a fee structure with a compulsory
//                   amount exists for the student's class in that session/term
//   report_card  -> a term is available when the student has an APPROVED
//                   report card for that term
//
// "Paid" means a PaymentRecord with status PAID for that
// student / session / term / type. PARTIAL and UNPAID both count as unpaid.
//
// To change what "available" means, edit getAvailableTermIds() only.

import FeeStructureModel from "@/models/FeeStructure";
import PaymentRecordModel from "@/models/PaymentRecord";
import ReportCardModel from "@/models/ReportCard";
import StudentModel from "@/models/Student";
import { TermModel } from "@/models/Session";
import { PaymentStatus, ReportStatus, TermName } from "@/types/enums";

export type PaymentType = "school_fees" | "report_card";

const TERM_RANK: Record<TermName, number> = {
  [TermName.FIRST]: 1,
  [TermName.SECOND]: 2,
  [TermName.THIRD]: 3,
};

export const termLabel = (t: string) =>
  `${t.charAt(0).toUpperCase()}${t.slice(1)} term`;

const PAYMENT_NOUN: Record<PaymentType, string> = {
  school_fees: "school fees",
  report_card: "report card fee",
};

interface SessionTerm {
  id: string;
  name: TermName;
}

export interface TermPaymentState {
  termId: string;
  termName: TermName;
  isPaid: boolean;
  /** Earliest unpaid term that must be paid before this one, or null */
  blockedBy: TermName | null;
}

async function loadTerms(sessionId: string): Promise<SessionTerm[]> {
  const terms = await TermModel.find({ session: sessionId })
    .select("name")
    .lean();
  return terms.map((t) => ({ id: String(t._id), name: t.name }));
}

/** Which of this session's terms are payable for this payment type. */
async function getAvailableTermIds(
  studentId: string,
  sessionId: string,
  type: PaymentType,
  termIds: string[],
): Promise<Set<string>> {
  if (type === "report_card") {
    const reports = await ReportCardModel.find({
      student: studentId,
      session: sessionId,
      term: { $in: termIds },
      status: ReportStatus.APPROVED,
    })
      .select("term")
      .lean();
    return new Set(reports.map((r) => String(r.term)));
  }

  // school_fees
  const student = await StudentModel.findById(studentId, {
    currentClass: 1,
  }).lean();
  if (!student?.currentClass) return new Set();

  const structures = await FeeStructureModel.find({
    classId: student.currentClass,
    sessionId,
    termId: { $in: termIds },
  })
    .select("termId items")
    .lean();

  return new Set(
    structures
      .filter(
        (fs) =>
          fs.items
            .filter((i) => i.isCompulsory)
            .reduce((sum, i) => sum + i.amount, 0) > 0,
      )
      .map((fs) => String(fs.termId)),
  );
}

/** Per-term paid/blocked state for one student, one session, one payment type. */
export async function getTermPaymentStates(
  studentId: string,
  sessionId: string,
  type: PaymentType = "report_card",
  terms?: SessionTerm[],
): Promise<TermPaymentState[]> {
  const sessionTerms = terms ?? (await loadTerms(sessionId));
  if (!sessionTerms.length) return [];
  const termIds = sessionTerms.map((t) => t.id);

  const [available, paidRecords] = await Promise.all([
    getAvailableTermIds(studentId, sessionId, type, termIds),
    PaymentRecordModel.find({
      student: studentId,
      session: sessionId,
      term: { $in: termIds },
      type,
      status: PaymentStatus.PAID,
    })
      .select("term")
      .lean(),
  ]);
  const paid = new Set(paidRecords.map((r) => String(r.term)));

  const ordered = sessionTerms
    .filter((t) => available.has(t.id))
    .sort((a, b) => TERM_RANK[a.name] - TERM_RANK[b.name]);

  const states: TermPaymentState[] = [];
  let earliestUnpaid: TermName | null = null;

  for (const t of ordered) {
    const isPaid = paid.has(t.id);
    states.push({
      termId: t.id,
      termName: t.name,
      isPaid,
      blockedBy: isPaid ? null : earliestUnpaid,
    });
    if (!isPaid && earliestUnpaid === null) earliestUnpaid = t.name;
  }
  return states;
}

export type PaymentOrderCheck =
  | { allowed: true }
  | {
      allowed: false;
      reason: "ORDER";
      message: string;
      blockedBy: TermName;
    };

/**
 * Call this in an initialize route before creating the Paystack transaction.
 * Blocks the payment if any earlier available term is still unpaid.
 */
export async function checkPaymentOrder(
  studentId: string,
  sessionId: string,
  termId: string,
  type: PaymentType = "report_card",
): Promise<PaymentOrderCheck> {
  const terms = await loadTerms(sessionId);
  const target = terms.find((t) => t.id === termId);
  // Unknown term: let the route's own validation reject it
  if (!target) return { allowed: true };

  const states = await getTermPaymentStates(studentId, sessionId, type, terms);

  // states are sorted first -> third, so this is the earliest unpaid term
  const blocker = states.find(
    (s) => !s.isPaid && TERM_RANK[s.termName] < TERM_RANK[target.name],
  );
  if (!blocker) return { allowed: true };

  const noun = PAYMENT_NOUN[type];
  return {
    allowed: false,
    reason: "ORDER",
    blockedBy: blocker.termName,
    message: `Please pay the ${termLabel(blocker.termName)} ${noun} before paying the ${termLabel(target.name)} ${noun}.`,
  };
}