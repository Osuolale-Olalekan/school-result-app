"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Lock,
  Eye,
  CreditCard,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import ReportCardComponent from "@/components/shared/ReportCard";
import type { IReportCard } from "@/types";
import { TermName } from "@/types/enums";

interface ReportSummary {
  _id: string;
  session: { _id: string; name: string };
  term: { _id: string; name: string };
  status: string;
  isLocked: boolean;
  reportCardPaid: boolean;
  schoolFeesPaid: boolean;
  percentage?: number;
  grade?: string;
  position?: number;
  totalStudentsInClass?: number;
  termName?: TermName;
  sessionName?: string;
  className?: string;
  underReview?: boolean;
}

interface FullReport extends IReportCard {
  sessionName: string;
  termName: TermName;
  className: string;
  principalSignature?: string;
}

interface PaymentModalState {
  report: ReportSummary;
  step: "confirm" | "processing";
}

const REPORT_CARD_FEE = 1000;

export default function StudentReportsView() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<FullReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(
    null,
  );
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/reports");
      const json = (await res.json()) as {
        success: boolean;
        data?: ReportSummary[];
      };
      if (json.success && json.data) setReports(json.data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle Paystack callback redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("reference") ?? urlParams.get("trxref");
    if (ref) {
      verifyPayment(ref);
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPayment(reference: string) {
    try {
      const res = await fetch("/api/student/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Payment successful! Your report card is now unlocked.");
        fetchReports();
      } else {
        toast.error(json.error ?? "Payment verification failed");
      }
    } catch {
      toast.error("Failed to verify payment");
    }
  }

  async function initiatePayment() {
    if (!paymentModal) return;
    const { report } = paymentModal;

    setPaymentLoading(true);
    setPaymentModal((prev) => (prev ? { ...prev, step: "processing" } : null));

    try {
      const res = await fetch("/api/student/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: report.session._id,
          termId: report.term._id,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { authorizationUrl: string };
        error?: string;
      };
      if (json.success && json.data) {
        window.location.href = json.data.authorizationUrl;
      } else {
        toast.error(json.error ?? "Failed to initialize payment");
        setPaymentModal((prev) => (prev ? { ...prev, step: "confirm" } : null));
      }
    } catch {
      toast.error("An error occurred. Please try again.");
      setPaymentModal((prev) => (prev ? { ...prev, step: "confirm" } : null));
    } finally {
      setPaymentLoading(false);
    }
  }

  async function viewReport(reportId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/student/report/${reportId}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: FullReport;
        error?: string;
      };
      if (json.success && json.data) {
        setViewingReport(json.data);
      } else {
        toast.error(json.error ?? "Failed to load report");
      }
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  }

  const unlockedCount = reports.filter(
    (r) => !r.isLocked && !r.underReview,
  ).length;
  const lockedCount = reports.filter((r) => r.isLocked).length;
  const underReviewCount = reports.filter((r) => r.underReview).length;

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          My Report Cards
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          View your academic performance reports
        </p>
      </div>

      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            {
              label: "Total Reports",
              value: reports.length,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Available",
              value: unlockedCount,
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Locked",
              value: lockedCount,
              color: "bg-amber-50 text-amber-700",
            },
            {
              label: "Under Review",
              value: underReviewCount,
              color: "bg-amber-50 text-amber-700",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 ${color}`}
            >
              <p className="text-xl sm:text-2xl font-bold leading-none">
                {value}
              </p>
              <p className="text-[10px] sm:text-xs font-medium mt-1 leading-tight">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center px-4">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">
              No report cards yet
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Your approved report cards will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((report) => (
              <div
                key={report._id}
                className="p-3 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 capitalize text-sm sm:text-base leading-snug">
                    {report.term?.name} Term
                    <span className="text-gray-400 font-normal"> — </span>
                    <span className="whitespace-nowrap">
                      {report.session?.name} Session
                    </span>
                  </p>

                  {/* ── Under Review state ── */}
                  {report.underReview ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                        Result Under Review
                      </span>
                    </div>
                  ) : !report.isLocked && report.percentage !== undefined ? (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                      <p className="text-xs sm:text-sm text-gray-500">
                        Score:{" "}
                        <span className="font-semibold text-[#1e3a5f]">
                          {report.percentage.toFixed(1)}%
                        </span>
                      </p>
                      {report.grade && (
                        <span className="text-xs sm:text-sm font-semibold text-[#1e3a5f]">
                          · Grade {report.grade}
                        </span>
                      )}
                      {report.position && (
                        <span className="text-xs text-gray-400">
                          · {report.position}/{report.totalStudentsInClass}
                        </span>
                      )}
                    </div>
                  ) : report.isLocked ? (
                    <div className="mt-1 space-y-0.5">
                      {!report.schoolFeesPaid && (
                        <p className="text-xs text-amber-600">
                          ⚠ School fees not confirmed
                        </p>
                      )}
                      {report.schoolFeesPaid && !report.reportCardPaid && (
                        <p className="text-xs text-gray-400">
                          Pay ₦{REPORT_CARD_FEE.toLocaleString()} to unlock
                          report card
                        </p>
                      )}
                      {report.reportCardPaid && !report.schoolFeesPaid && (
                        <p className="text-xs text-blue-500">
                          Report card fee paid — awaiting school fees
                          confirmation
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* ── Action button ── */}
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  {report.underReview ? (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-xs font-medium">
                      Under Review
                    </span>
                  ) : !report.isLocked ? (
                    <button
                      onClick={() => viewReport(report._id)}
                      disabled={loadingReport}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  ) : report.schoolFeesPaid && !report.reportCardPaid ? (
                    <button
                      onClick={() =>
                        setPaymentModal({ report, step: "confirm" })
                      }
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                    >
                      <CreditCard className="w-3 h-3" />
                      Pay ₦{REPORT_CARD_FEE.toLocaleString()}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      <span className="hidden sm:inline">Locked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end min-[480px]:items-center justify-center p-0 min-[480px]:p-4">
          <div className="bg-white rounded-t-2xl min-[480px]:rounded-2xl w-full min-[480px]:max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 min-[480px]:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Unlock Report Card
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {paymentModal.report.term?.name} Term ·{" "}
                    {paymentModal.report.session?.name} Session
                  </p>
                </div>
              </div>
              {paymentModal.step === "confirm" && (
                <button
                  onClick={() => setPaymentModal(null)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 min-[480px]:p-6">
              {paymentModal.step === "confirm" && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Report Card Access Fee
                      </span>
                      <span className="font-semibold text-blue-950">
                        ₦{REPORT_CARD_FEE.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Term</span>
                      <span className="font-medium capitalize text-blue-950">
                        {paymentModal.report.term?.name} Term
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Session</span>
                      <span className="font-medium text-blue-950">
                        {paymentModal.report.session?.name}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-bold text-[#1e3a5f]">
                        ₦{REPORT_CARD_FEE.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-5 text-center">
                    You will be redirected to Paystack to complete your payment
                    securely.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={initiatePayment}
                      disabled={paymentLoading}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-1"
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
                  <p className="font-semibold text-gray-900">
                    Redirecting to Paystack...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please wait while we prepare your payment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {(viewingReport ?? loadingReport) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-4xl shadow-2xl sm:my-4">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10 sm:rounded-t-2xl">
              <h3 className="font-display text-base sm:text-lg font-bold text-gray-900">
                Report Card
              </h3>
              <button
                onClick={() => setViewingReport(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {loadingReport ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Loading report card...</p>
              </div>
            ) : viewingReport ? (
              <div className="p-0 sm:p-4">
                <ReportCardComponent
                  report={viewingReport}
                  showActions={true}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
