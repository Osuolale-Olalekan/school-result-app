"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, Lock, Eye, CreditCard, CheckCircle,
  X, Loader2, ExternalLink, ChevronDown,
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
  step: "confirm" | "processing";
}

const REPORT_CARD_FEE = 1000;

export default function ParentReportsView() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<IReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Filter state
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

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

  // Derive unique sessions from reports
  const sessions = useMemo(() => {
    const map = new Map<string, string>();
    reports.forEach(r => {
      if (r.session?._id) map.set(r.session._id, r.session.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reports]);

  // Derive terms available for the selected session
  const terms = useMemo(() => {
    if (!selectedSession) return [];
    const map = new Map<string, string>();
    reports
      .filter(r => r.session._id === selectedSession)
      .forEach(r => {
        if (r.term?._id) map.set(r.term._id, r.term.name);
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reports, selectedSession]);

  // Filtered reports based on selection
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (selectedSession && r.session._id !== selectedSession) return false;
      if (selectedTerm && r.term._id !== selectedTerm) return false;
      return true;
    });
  }, [reports, selectedSession, selectedTerm]);

  // Reset term when session changes
  useEffect(() => {
    setSelectedTerm("");
  }, [selectedSession]);

  async function viewReport(reportId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/parent/report/${reportId}`);
      const json = await res.json() as {
        success: boolean; data?: IReportCard; error?: string;
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

  async function initiatePaystackPayment() {
    if (!paymentModal || !studentId) return;
    const { report } = paymentModal;
    setPaymentLoading(true);
    setPaymentModal(prev => prev ? { ...prev, step: "processing" } : null);
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
        data?: { authorizationUrl: string };
        error?: string;
      };
      if (json.success && json.data) {
        window.location.href = json.data.authorizationUrl;
      } else {
        toast.error(json.error ?? "Failed to initialize payment");
        setPaymentModal(prev => prev ? { ...prev, step: "confirm" } : null);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
      setPaymentModal(prev => prev ? { ...prev, step: "confirm" } : null);
    } finally {
      setPaymentLoading(false);
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("reference") ?? urlParams.get("trxref");
    if (ref && studentId) {
      verifyPayment(ref, studentId);
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

  // Stats derived from filtered reports
  const unlockedCount = filteredReports.filter(r => !r.isLocked).length;
  const lockedCount = filteredReports.filter(r => r.isLocked).length;

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
        <p className="text-gray-500 text-sm">View and download your child`s academic report cards</p>
      </div>

      {/* Filter Bar */}
      {!loading && reports.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filter Reports</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Session select */}
            <div className="relative flex-1">
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white"
              >
                <option value="">All Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} Session</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Term select */}
            <div className="relative flex-1">
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                disabled={!selectedSession}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Terms</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name} Term</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {(selectedSession || selectedTerm) && (
              <button
                onClick={() => { setSelectedSession(""); setSelectedTerm(""); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Summary counts */}
          {filteredReports.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filteredReports.length}</span> report{filteredReports.length !== 1 ? "s" : ""}
              </p>
              {unlockedCount > 0 && (
                <p className="text-xs text-emerald-600">
                  <span className="font-semibold">{unlockedCount}</span> available
                </p>
              )}
              {lockedCount > 0 && (
                <p className="text-xs text-amber-600">
                  <span className="font-semibold">{lockedCount}</span> locked
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 && reports.length === 0 ? (
        // No reports at all
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No approved report cards yet</p>
          <p className="text-xs text-gray-400 mt-1">Report cards will appear here once approved by the school</p>
        </div>
      ) : filteredReports.length === 0 ? (
        // No results for current filter
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No reports found for this filter</p>
          <button
            onClick={() => { setSelectedSession(""); setSelectedTerm(""); }}
            className="mt-3 text-amber-600 text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-colors ${
                report.isLocked ? "border-gray-100" : "border-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    report.isLocked ? "bg-gray-100" : "bg-emerald-100"
                  }`}>
                    {report.isLocked
                      ? <Lock className="w-5 h-5 text-gray-400" />
                      : <FileText className="w-5 h-5 text-emerald-600" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 capitalize">
                      {report.termName} Term Report
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.className} · {report.sessionName ?? report.session?.name} Session
                    </p>
                    {!report.isLocked && report.percentage !== undefined && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Score: {report.percentage.toFixed(1)}% · Grade: {report.grade} · Position: {report.position}/{report.totalStudentsInClass}
                      </p>
                    )}
                    {report.isLocked && (
                      <p className="text-xs mt-0.5">
                        {report.reportCardPaid && !report.schoolFeesPaid
                          ? <span className="text-blue-400">Awaiting school fees confirmation</span>
                          : <span className="text-amber-500">Payment required to unlock</span>
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {report.isLocked ? (
                    report.reportCardPaid && !report.schoolFeesPaid ? (
                      <span className="text-xs text-blue-500 font-medium px-3 py-2">
                        Awaiting school fees
                      </span>
                    ) : (
                      <button
                        onClick={() => setPaymentModal({ report, step: "confirm" })}
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
                      {loadingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      View & Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Unlock Report Card</h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {paymentModal.report.termName} Term · {paymentModal.report.className}
                  </p>
                </div>
              </div>
              {paymentModal.step === "confirm" && (
                <button onClick={() => setPaymentModal(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6">
              {paymentModal.step === "confirm" && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Report Card Access Fee</span>
                      <span className="font-semibold">₦{REPORT_CARD_FEE.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Term</span>
                      <span className="font-medium capitalize">{paymentModal.report.termName} Term</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Session</span>
                      <span className="font-medium">{paymentModal.report.sessionName ?? paymentModal.report.session.name}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-[#1e3a5f]">₦{REPORT_CARD_FEE.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-5 text-center">
                    You will be redirected to Paystack to complete your payment securely.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
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
                  <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your payment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}