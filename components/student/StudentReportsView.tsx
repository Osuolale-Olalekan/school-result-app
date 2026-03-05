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
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Report Cards</h1>
        <p className="text-gray-500 text-sm">View your academic performance reports</p>
      </div>

      {/* Summary */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Reports", value: reports.length, color: "bg-blue-50 text-blue-700" },
            { label: "Available",     value: unlockedCount,  color: "bg-emerald-50 text-emerald-700" },
            { label: "Locked",        value: lockedCount,    color: "bg-amber-50 text-amber-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No report cards yet</p>
            <p className="text-gray-400 text-sm mt-1">Your approved report cards will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((report) => (
              <div key={report._id} className="p-5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  report.isLocked ? "bg-gray-100" : "bg-emerald-100"
                }`}>
                  {report.isLocked
                    ? <Lock className="w-5 h-5 text-gray-400" />
                    : <FileText className="w-5 h-5 text-emerald-600" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 capitalize">
                    {report.term?.name} Term — {report.session?.name} Session
                  </p>
                  {!report.isLocked && report.percentage !== undefined && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      Score: <span className="font-semibold text-[#1e3a5f]">{report.percentage.toFixed(1)}%</span>
                      {report.grade && <span className="ml-2 font-semibold text-[#1e3a5f]">· Grade {report.grade}</span>}
                      {report.position && <span className="ml-2 text-gray-400">· Position {report.position}/{report.totalStudentsInClass}</span>}
                    </p>
                  )}
                  {report.isLocked && (
                    <div className="mt-1 space-y-0.5">
                      {!report.schoolFeesPaid && (
                        <p className="text-xs text-amber-600">⚠ School fees not paid</p>
                      )}
                      {!report.reportCardPaid && (
                        <p className="text-xs text-amber-600">⚠ Report card fee not paid</p>
                      )}
                      <p className="text-xs text-gray-400">Contact your parent/guardian to make payment</p>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {report.isLocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  ) : (
                    <button
                      onClick={() => viewReport(report._id)}
                      disabled={loadingReport}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
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

      {/* Report Card Modal */}
      {(viewingReport ?? loadingReport) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="font-display text-lg font-bold text-gray-900">Report Card</h3>
              <button
                onClick={() => setViewingReport(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
              <div className="p-4 overflow-x-auto">
                <ReportCardComponent report={viewingReport} showActions={true} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}