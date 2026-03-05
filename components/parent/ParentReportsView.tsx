"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, Lock, Eye, CreditCard, CheckCircle,
  X, Loader2, AlertCircle, ExternalLink,
} from "lucide-react";
import { PaymentStatus, TermName } from "@/types/enums";
import type { IReportCard } from "@/types";
import ReportCardComponent from "@/components/shared/ReportCard";
import { toast } from "sonner";

interface ReportSummary {
  _id: string;
  className: string;
  sessionName: string;
  termName: TermName;
  paymentStatus: PaymentStatus;
  status: string;
  percentage?: number;
  grade?: string;
  position?: number;
  totalStudentsInClass?: number;
  isLocked: boolean;
  session: { _id: string; name: string };
  term: { _id: string; name: string };
  reportCardPaid: boolean;
  schoolFeesPaid: boolean;
}

interface PaymentModalState {
  report: ReportSummary;
  step: "confirm" | "processing" | "pending_admin";
}

// Report card fee — you can make this dynamic later
const REPORT_CARD_FEE = 1000; // ₦1000

export default function ParentReportsView() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<IReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchReports = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/${id}/reports`);
      const json = await res.json() as { success: boolean; data?: ReportSummary[] };
      if (json.success && json.data) setReports(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) fetchReports(studentId);
  }, [studentId, fetchReports]);

  async function viewReport(reportId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/parent/report/${reportId}`);
      const json = await res.json() as {
        success: boolean;
        data?: IReportCard;
        error?: string;
        code?: string;
      };
      if (json.success && json.data) {
        setSelectedReport(json.data);
      } else if (res.status === 402) {
        toast.error("Payment required to view this report card");
      } else {
        toast.error(json.error ?? "Failed to load report");
      }
    } finally {
      setLoadingReport(false);
    }
  }

  async function handlePayNow(report: ReportSummary) {
    if (!studentId) return;
    setPaymentModal({ report, step: "confirm" });
  }

  async function initiatePaystackPayment() {
    if (!paymentModal || !studentId) return;
    const { report } = paymentModal;

    setPaymentLoading(true);
    setPaymentModal((prev) => prev ? { ...prev, step: "processing" } : null);

    try {
      const res = await fetch("/api/parent/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionId: report.session._id,
          termId: report.term._id,
          amount: REPORT_CARD_FEE,
        }),
      });

      const json = await res.json() as {
        success: boolean;
        data?: { authorizationUrl: string; reference: string };
        error?: string;
      };

      if (json.success && json.data) {
        // Redirect to Paystack payment page
        window.location.href = json.data.authorizationUrl;
      } else {
        toast.error(json.error ?? "Failed to initialize payment");
        setPaymentModal((prev) => prev ? { ...prev, step: "confirm" } : null);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
      setPaymentModal((prev) => prev ? { ...prev, step: "confirm" } : null);
    } finally {
      setPaymentLoading(false);
    }
  }

  // Handle Paystack redirect return — verify payment on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    const trxref = urlParams.get("trxref");
    const ref = reference ?? trxref;

    if (ref && studentId) {
      verifyPayment(ref, studentId);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname + `?studentId=${studentId}`);
    }
  }, [studentId]);

  async function verifyPayment(reference: string, sid: string) {
    try {
      const res = await fetch("/api/parent/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Payment successful! Your report card is now unlocked.");
        fetchReports(sid);
      } else {
        toast.error(json.error ?? "Payment verification failed");
      }
    } catch {
      toast.error("Failed to verify payment");
    }
  }

  // Derive the dynamic payment banner based on the first locked report's payment state
  function renderPaymentBanner() {
    const lockedReport = reports.find(r => r.isLocked);
    if (!lockedReport) return null;

    const { reportCardPaid, schoolFeesPaid } = lockedReport;

    if (!reportCardPaid && !schoolFeesPaid) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Two Payments Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Both <strong>school fees</strong> and the <strong>₦{REPORT_CARD_FEE.toLocaleString()} report card access fee</strong> must be paid each term before results can be accessed. Contact the school admin to confirm school fees, and pay the report card fee below.
            </p>
          </div>
        </div>
      );
    }

    if (reportCardPaid && !schoolFeesPaid) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Report Card Fee Paid ✓</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your report card access fee has been received. However, <strong>school fees for this term are yet to be confirmed</strong> by the school admin. Please contact the school to complete your school fees payment.
            </p>
          </div>
        </div>
      );
    }

    if (schoolFeesPaid && !reportCardPaid) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Report Card Access Fee Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              School fees confirmed ✓. A fee of <strong>₦{REPORT_CARD_FEE.toLocaleString()}</strong> is required per term to access and download your child&apos;s report card. Pay online via Paystack or have the school admin confirm your cash payment.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  if (!studentId) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <p className="text-gray-500">Select a child to view their report cards</p>
        <a href="/parent/children" className="mt-3 inline-block text-amber-600 text-sm hover:underline">
          Go to My Children →
        </a>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div>
        <button
          onClick={() => setSelectedReport(null)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to reports list
        </button>
        <ReportCardComponent
          report={selectedReport as IReportCard & { sessionName: string; termName: TermName; className: string }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-500 text-sm">
          View and download your child&apos;s academic report cards
        </p>
      </div>

      {/* Dynamic Payment Banner — shown only when relevant */}
      {renderPaymentBanner()}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No approved report cards yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Report cards will appear here once approved by the school
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-colors ${
                report.isLocked ? "border-gray-100" : "border-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    report.isLocked ? "bg-gray-100" : "bg-emerald-100"
                  }`}>
                    {report.isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {report.termName
                        ? report.termName.charAt(0).toUpperCase() + report.termName.slice(1)
                        : ""}{" "}
                      Term Report
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.className} · {report.sessionName ?? report.session?.name}
                    </p>
                    {!report.isLocked && report.percentage !== undefined && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Score: {report.percentage.toFixed(1)}% · Grade: {report.grade} · Position:{" "}
                        {report.position}/{report.totalStudentsInClass}
                      </p>
                    )}
                    {report.isLocked && (
                      <p className="text-xs mt-0.5">
                        {report.reportCardPaid && !report.schoolFeesPaid
                          ? <span className="text-blue-400">School fees payment pending</span>
                          : <span className="text-red-400">Payment required to unlock</span>
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {report.isLocked ? (
                    report.reportCardPaid && !report.schoolFeesPaid ? (
                      <span className="text-xs text-blue-500 font-medium px-3 py-2">
                        Awaiting school fees
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayNow(report)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay ₦{REPORT_CARD_FEE.toLocaleString()}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => viewReport(report._id)}
                      disabled={loadingReport}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold hover:bg-[#152847] transition-colors disabled:opacity-50"
                    >
                      {loadingReport ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      View & Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Unlock Report Card</h3>
                  <p className="text-xs text-gray-500">
                    {paymentModal.report.termName?.charAt(0).toUpperCase() +
                      paymentModal.report.termName?.slice(1)}{" "}
                    Term · {paymentModal.report.className}
                  </p>
                </div>
              </div>
              {paymentModal.step === "confirm" && (
                <button
                  onClick={() => setPaymentModal(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6">
              {paymentModal.step === "confirm" && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Report Card Access Fee</span>
                      <span className="font-semibold text-gray-900">
                        ₦{REPORT_CARD_FEE.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Term</span>
                      <span className="font-medium text-gray-700 capitalize">
                        {paymentModal.report.termName} Term
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Session</span>
                      <span className="font-medium text-gray-700">
                        {paymentModal.report.sessionName ?? paymentModal.report.session.name}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-[#1e3a5f]">
                        ₦{REPORT_CARD_FEE.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-5 text-center">
                    You will be redirected to Paystack to complete your payment securely.
                    Your report card will be unlocked immediately after successful payment.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={initiatePaystackPayment}
                      disabled={paymentLoading}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Pay with Paystack
                    </button>
                  </div>
                </>
              )}

              {paymentModal.step === "processing" && (
                <div className="text-center py-6">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">Redirecting to Paystack...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please wait while we prepare your payment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}