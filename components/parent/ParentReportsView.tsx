"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Lock, Download, Eye } from "lucide-react";
import { PaymentStatus, TermName } from "@/types/enums";
import type { IReportCard } from "@/types";
import ReportCardComponent from "@/components/shared/ReportCard";

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
  session: { name: string };
  term: { name: string };
}

export default function ParentReportsView() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<IReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (studentId) fetchReports(studentId);
  }, [studentId]);

  async function fetchReports(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/${id}/reports`);
      const json = await res.json() as { success: boolean; data?: ReportSummary[] };
      if (json.success && json.data) setReports(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function viewReport(reportId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/parent/report/${reportId}`);
      const json = await res.json() as { success: boolean; data?: IReportCard };
      if (json.success && json.data) setSelectedReport(json.data);
    } finally {
      setLoadingReport(false);
    }
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
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to reports list
        </button>
        <ReportCardComponent report={selectedReport as IReportCard & { sessionName: string; termName: TermName; className: string }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-500 text-sm">View and download your child&apos;s academic report cards</p>
      </div>

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
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.isLocked ? "bg-gray-100" : "bg-amber-100"}`}>
                    {report.isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {report.termName?.toUpperCase() ?? ""} Term Report
                    </p>
                    <p className="text-sm text-gray-500">{report.className} · {report.sessionName ?? report.session?.name}</p>
                    {!report.isLocked && report.percentage !== undefined && (
                      <p className="text-xs text-gray-400">
                        Score: {report.percentage?.toFixed(1)}% · Grade: {report.grade} · Position: {report.position}/{report.totalStudentsInClass}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.isLocked ? (
                    <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Payment Required
                    </span>
                  ) : (
                    <button
                      onClick={() => viewReport(report._id)}
                      disabled={loadingReport}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white text-xs font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View & Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
