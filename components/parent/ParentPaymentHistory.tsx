"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  Banknote,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildFeeInfo {
  child: {
    _id: string;
    firstName: string;
    surname: string;
  };
  feeStructure: {
    items: Array<{
      feeType: string;
      label: string;
      amount: number;
      isCompulsory: boolean;
    }>;
  } | null;
  payment: {
    status: string;
    amount?: number;
    paidAt?: string;
    method?: string;
  } | null;
  totalDue: number;
  amountPaid: number;
  paymentStatus: string;
}

interface PaymentRecord {
  _id: string;
  type: "school_fees" | "report_card";
  status: string;
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
  markedAt?: string;
  session: { name: string } | string;
  term: { name: string } | string;
  student: { firstName?: string; surname?: string } | string;
}

interface SessionDoc {
  _id: string;
  name: string;
  status?: string;
  terms?: TermDoc[];
}
interface TermDoc {
  _id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  if (status === "paid")
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
    };
  if (status === "partial")
    return {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
    };
  return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" };
}

const INPUT_CLS =
  "flex-1 min-w-[130px] px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-40";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParentPaymentHistory() {
  const [feeInfo, setFeeInfo] = useState<ChildFeeInfo[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChild, setActiveChild] = useState<string>("");
  const [paying, setPaying] = useState<string | null>(null);
  const [selSession, setSelSession] = useState("");
  const [selTerm, setSelTerm] = useState("");
  const [terms, setTerms] = useState<TermDoc[]>([]);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: SessionDoc[] }) => {
        if (j.success) {
          setSessions(j.data ?? []);
          const active = (j.data ?? []).find((s) => s.status === "active");
          if (active) {
            setSelSession(active._id);
            setTerms(active.terms ?? []);
          }
        }
      });
  }, []);

  useEffect(() => {
    const s = sessions.find((s) => s._id === selSession);
    setTerms(s?.terms ?? []);
    setSelTerm("");
  }, [selSession, sessions]);

  const fetchFeeInfo = useCallback(
    async (silent = false) => {
      if (!selSession || !selTerm) return;
      if (!silent) setIsLoading(true);
      try {
        const res = await fetch(
          `/api/parent/fee-structure?sessionId=${selSession}&termId=${selTerm}`,
        );
        const json = await res.json();
        if (json.success) {
          setFeeInfo(json.data ?? []);
          if (json.data?.length && !activeChild)
            setActiveChild(String(json.data[0].child._id));
        }
      } catch {
        /* silent */
      } finally {
        setIsLoading(false);
      }
    },
    [selSession, selTerm, activeChild],
  );

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/payment-history");
      const json = await res.json();
      if (json.success) setHistory(json.data ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void fetchFeeInfo(true);
  }, [fetchFeeInfo]);
  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      toast.success("Payment verified successfully!");
      void fetchFeeInfo(true);
      void fetchHistory();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchFeeInfo, fetchHistory]);

  async function handlePaySchoolFees(childId: string, amount: number) {
    if (!selSession || !selTerm)
      return toast.error("Select session and term first");
    setPaying(childId);
    try {
      const res = await fetch("/api/parent/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: childId,
          sessionId: selSession,
          termId: selTerm,
          amount,
          type: "school_fees",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      window.location.href = json.data.authorizationUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(null);
    }
  }

  const selectedFeeInfo = feeInfo.find(
    (f) => String(f.child._id) === activeChild,
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── School Fees card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">
              School Fees
            </h2>
            <p className="text-xs text-gray-400">Current term fee status</p>
          </div>
        </div>

        {/* Session / term selectors */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={selSession}
            onChange={(e) => setSelSession(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">Select session…</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={selTerm}
            onChange={(e) => setSelTerm(e.target.value)}
            disabled={!selSession}
            className={INPUT_CLS}
          >
            <option value="">Select term…</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Child tabs (only shown when multiple children) */}
        {feeInfo.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {feeInfo.map(({ child }) => (
              <button
                key={String(child._id)}
                onClick={() => setActiveChild(String(child._id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  activeChild === String(child._id)
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {child.firstName} {child.surname}
              </button>
            ))}
          </div>
        )}

        {/* Fee info body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          </div>
        ) : !selSession || !selTerm ? (
          <p className="text-xs text-center py-6 text-gray-400">
            Select session and term to view fees
          </p>
        ) : !selectedFeeInfo ? (
          <p className="text-xs text-center py-6 text-gray-400">
            No fee information available
          </p>
        ) : (
          <div className="space-y-3">
            {/* Status summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-900">
                  {selectedFeeInfo.child.firstName}{" "}
                  {selectedFeeInfo.child.surname}
                </p>
                <div className="flex items-center gap-3 text-[10px] mt-0.5 flex-wrap">
                  <span className="text-gray-400">
                    Total due: ₦{selectedFeeInfo.totalDue.toLocaleString()}
                  </span>
                  {selectedFeeInfo.amountPaid > 0 && (
                    <span className="text-emerald-600 font-medium">
                      Paid: ₦{selectedFeeInfo.amountPaid.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {(() => {
                const st = statusStyle(selectedFeeInfo.paymentStatus);
                return (
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold capitalize border ${st.bg} ${st.text} ${st.border}`}
                  >
                    {selectedFeeInfo.paymentStatus}
                  </span>
                );
              })()}
            </div>

            {/* Fee line items */}
            {selectedFeeInfo.feeStructure?.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-gray-100"
              >
                <div>
                  <p className="text-xs text-gray-700">{item.label}</p>
                  {!item.isCompulsory && (
                    <p className="text-[10px] text-gray-400">Optional</p>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  ₦{item.amount.toLocaleString()}
                </p>
              </div>
            ))}

            {/* Pay button */}
            {/* ✅ Fix — cash note is outside the button, in its own wrapper */}
            {selectedFeeInfo.paymentStatus !== "paid" &&
              selectedFeeInfo.totalDue > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      handlePaySchoolFees(
                        String(selectedFeeInfo.child._id),
                        selectedFeeInfo.totalDue - selectedFeeInfo.amountPaid,
                      )
                    }
                    disabled={paying === String(selectedFeeInfo.child._id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {paying === String(selectedFeeInfo.child._id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay ₦
                        {(
                          selectedFeeInfo.totalDue - selectedFeeInfo.amountPaid
                        ).toLocaleString()}{" "}
                        via Paystack
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-400">
                    You can also pay in cash at the school office. The admin
                    will update your payment status.
                  </p>
                </div>
              )}

            {/* Fully paid notice */}
            {selectedFeeInfo.paymentStatus === "paid" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">
                  School fees fully paid
                  {selectedFeeInfo.payment?.paidAt &&
                    ` · ${new Date(selectedFeeInfo.payment.paidAt).toLocaleDateString("en-NG")}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Payment History card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 font-display">
            Payment History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
            <CreditCard className="w-7 h-7 mb-2 text-gray-300" />
            <p className="text-xs text-gray-400">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((p, i) => {
              const st = statusStyle(p.status);
              const sessionName =
                typeof p.session === "object" ? p.session.name : "—";
              const termName = typeof p.term === "object" ? p.term.name : "—";
              const date = p.paidAt ?? p.markedAt;

              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${st.bg} ${st.border}`}
                  >
                    {p.type === "report_card" ? (
                      <FileText className={`w-3.5 h-3.5 ${st.text}`} />
                    ) : (
                      <Banknote className={`w-3.5 h-3.5 ${st.text}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">
                      {p.type === "report_card" ? "Report Card" : "School Fees"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {sessionName} · {termName} Term
                      {date &&
                        ` · ${new Date(date).toLocaleDateString("en-NG")}`}
                    </p>
                    {p.paymentMethod && (
                      <p className="text-[10px] text-gray-400">
                        via{" "}
                        {p.paymentMethod === "paystack"
                          ? "Paystack (online)"
                          : "Manual"}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.amount && (
                      <p className="text-xs font-bold text-gray-900 mb-0.5">
                        ₦{p.amount.toLocaleString()}
                      </p>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${st.bg} ${st.text} ${st.border}`}
                    >
                      {p.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
