"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Lock, Eye, X, Loader2 } from "lucide-react";
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
  studentSnapshot?: {
    surname: string;
    firstName: string;
    otherName: string;
  };
}

interface FullReport extends IReportCard {
  sessionName: string;
  termName: TermName;
  className: string;
  principalSignature?: string;
}

export default function StudentReportsView() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<FullReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/reports");
      const json = await res.json() as { success: boolean; data?: ReportSummary[] };
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

  async function viewReport(reportId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/student/report/${reportId}`);
      const json = await res.json() as { success: boolean; data?: FullReport; error?: string };
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

  const unlockedCount = reports.filter(r => !r.isLocked).length;
  const lockedCount = reports.filter(r => r.isLocked).length;

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

      {/* Summary — 3 columns at all sizes; smaller padding/text on 320 */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Total Reports", value: reports.length, color: "bg-blue-50 text-blue-700" },
            { label: "Available",     value: unlockedCount,  color: "bg-emerald-50 text-emerald-700" },
            { label: "Locked",        value: lockedCount,    color: "bg-amber-50 text-amber-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-4 ${color}`}>
              <p className="text-xl sm:text-2xl font-bold leading-none">{value}</p>
              <p className="text-[10px] sm:text-xs font-medium mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center px-4">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No report cards yet</p>
            <p className="text-gray-400 text-xs mt-1">Your approved report cards will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((report) => (
              <div
                key={report._id}
                className="p-3 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Icon — hidden on small screens to reclaim space */}
                <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${
                  report.isLocked ? "bg-gray-100" : "bg-emerald-100"
                }`}>
                  {report.isLocked
                    ? <Lock className="w-5 h-5 text-gray-400" />
                    : <FileText className="w-5 h-5 text-emerald-600" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 capitalize text-sm sm:text-base leading-snug">
                    {report.term?.name} Term
                    <span className="text-gray-400 font-normal"> — </span>
                    <span className="whitespace-nowrap">{report.session?.name} Session</span>
                  </p>

                  {!report.isLocked && report.percentage !== undefined && (
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
                  )}

                  {report.isLocked && (
                    <div className="mt-1 space-y-0.5">
                      {!report.schoolFeesPaid && (
                        <p className="text-xs text-amber-600">⚠ School fees not paid</p>
                      )}
                      {!report.reportCardPaid && (
                        <p className="text-xs text-amber-600">⚠ Report card fee not paid</p>
                      )}
                      <p className="text-xs text-gray-400 leading-snug">
                        Contact your parent/guardian to make payment
                      </p>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  {report.isLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      <span className="hidden sm:inline">Locked</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => viewReport(report._id)}
                      disabled={loadingReport}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Card Modal
          Key insight: on mobile we give the modal zero padding (p-0) and make it
          full-width with no rounded corners. This gives ReportCard's ResizeObserver
          the maximum available width so it computes the correct CSS scale
          automatically — no manual scale logic needed here.
      */}
      {(viewingReport ?? loadingReport) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-4xl shadow-2xl sm:my-4">

            {/* Sticky header */}
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
              // Zero padding on mobile — let ReportCard's own ResizeObserver drive the scale
              <div className="p-0 sm:p-4">
                <ReportCardComponent report={viewingReport} showActions={true} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}