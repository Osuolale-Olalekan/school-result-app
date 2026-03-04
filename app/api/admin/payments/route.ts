import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import PaymentRecordModel from "@/models/PaymentRecord";
import { AuditAction, PaymentStatus, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId = searchParams.get("termId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    // Require at least session and term to be selected
    if (!sessionId || !termId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Build report card query
    const reportQuery: Record<string, unknown> = {
      status: "approved",
      session: sessionId,
      term: termId,
    };
    if (classId) reportQuery.class = classId;

    // Auto-create payment records for approved report cards
    const approvedReports = await ReportCardModel.find(reportQuery).lean();

    for (const report of approvedReports) {
      const r = report as { student: unknown; session: unknown; term: unknown };
      await PaymentRecordModel.findOneAndUpdate(
        { student: r.student, session: r.session, term: r.term },
        {
          $setOnInsert: {
            student: r.student,
            session: r.session,
            term: r.term,
            status: PaymentStatus.UNPAID,
          },
        },
        { upsert: true, new: true }
      );
    }

    // Fetch payment records with filters
    const type = searchParams.get("type") ?? "school_fees";
    const query: Record<string, unknown> = {
      session: sessionId,
      term: termId,
      type,
    };
    if (status) query.status = status;

    const payments = await PaymentRecordModel.find(query)
      .populate({
        path: "student",
        select: "surname firstName otherName admissionNumber currentClass",
        populate: { path: "currentClass", select: "name section" },
      })
      .populate("session", "name")
      .populate("term", "name")
      .populate("markedBy", "surname firstName otherName")
      .sort({ createdAt: -1 })
      .lean();

    // Filter by class if provided (after populate)
    const filtered = classId
      ? payments.filter((p) => {
          const student = p.student as { currentClass?: { _id: { toString(): string } } };
          return student?.currentClass?._id?.toString() === classId;
        })
      : payments;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    // console.error("Get payments error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json() as {
      studentId: string;
      sessionId: string;
      termId: string;
      type: "school_fees" | "report_card";
      status: PaymentStatus;
      amount?: number;
      note?: string;
    };

    const payment = await PaymentRecordModel.findOneAndUpdate(
      { student: body.studentId, session: body.sessionId, term: body.termId, type: body.type },
      {
        status: body.status,
        amount: body.amount,
        note: body.note,
        markedBy: session.user.id,
        markedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Also update the report card payment status
    await ReportCardModel.findOneAndUpdate(
      { student: body.studentId, session: body.sessionId, term: body.termId },
      {
        paymentStatus: body.status,
        ...(body.status === PaymentStatus.PAID
          ? { paidAt: new Date(), markedPaidBy: session.user.id }
          : {}),
      }
    );

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.PAYMENT_UPDATE,
      entity: "Payment",
      entityId: body.studentId,
      description: `Marked payment as ${body.status} for student ${body.studentId}`,
    });

    return NextResponse.json({ success: true, data: payment, message: "Payment updated" });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


