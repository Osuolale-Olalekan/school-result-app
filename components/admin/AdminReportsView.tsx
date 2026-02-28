"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReportStatus } from "@/types/enums";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface ReportSummary {
  _id: string;
  studentSnapshot: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  className: string;
  sessionName: string;
  termName: string;
  status: ReportStatus;
  percentage: number;
  position: number;
  totalStudentsInClass: number;
  submittedAt?: string;
  submittedBy: { firstName: string; lastName: string };
  paymentStatus: string;
  teacherComment?: string;
  subjects?: Array<{
    subject: string;
    subjectName: string;
    testScore: number;
    examScore: number;
    practicalScore: number;
    hasPractical: boolean;
    totalScore: number;
    maxTotalScore: number;
    grade: string;
    remark: string;
  }>;
}

const STATUS_CONFIG = {
  [ReportStatus.DRAFT]: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
    icon: Clock,
  },
  [ReportStatus.SUBMITTED]: {
    label: "Pending Review",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  [ReportStatus.APPROVED]: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  [ReportStatus.DECLINED]: {
    label: "Declined",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: ReportStatus.SUBMITTED },
  { label: "Approved", value: ReportStatus.APPROVED },
  { label: "Declined", value: ReportStatus.DECLINED },
];

export default function AdminReportsView() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action modal
  const [actionModal, setActionModal] = useState<{
    report: ReportSummary;
    type: "approve" | "decline";
  } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [principalComment, setPrincipalComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Preview modal
  const [previewReport, setPreviewReport] = useState<ReportSummary | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/reports?${params}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: ReportSummary[];
        pagination?: { totalPages: number };
      };
      if (json.success && json.data) {
        setReports(json.data);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function viewReport(reportId: string) {
    setPreviewLoading(true);
    setPreviewReport(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`);
      const json = (await res.json()) as { success: boolean; data?: ReportSummary };
      if (json.success && json.data) {
        setPreviewReport(json.data);
      } else {
        toast.error("Failed to load report");
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewReport(null);
    setPreviewLoading(false);
  }

  async function handleAction() {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${actionModal.report._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.type,
          ...(actionModal.type === "decline" ? { declineReason } : { principalComment }),
        }),
      });
      const json = (await res.json()) as { success: boolean; message?: string; error?: string };
      if (json.success) {
        toast.success(json.message ?? "Report updated successfully");
        setActionModal(null);
        setDeclineReason("");
        setPrincipalComment("");
        fetchReports();
      } else {
        toast.error(json.error ?? "Failed to update report");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-500 text-sm">Review and approve teacher-submitted report cards</p>
      </div>

      {/* Status tabs */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-[#1e3a5f] text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Term / Session</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Submitted By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No report cards found</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const statusCfg = STATUS_CONFIG[report.status];
                  return (
                    <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">
                          {report.studentSnapshot.firstName} {report.studentSnapshot.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{report.studentSnapshot.admissionNumber}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{report.className}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-gray-600 capitalize">{report.termName} term</p>
                        <p className="text-xs text-gray-400">{report.sessionName}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-[#1e3a5f]">{report.percentage.toFixed(1)}%</span>
                        <span className="text-xs text-gray-400 ml-1">({report.position}/{report.totalStudentsInClass})</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <statusCfg.icon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">
                        {report.submittedBy.firstName} {report.submittedBy.lastName}
                        {report.submittedAt && (
                          <p className="text-gray-400">{formatDateTime(report.submittedAt)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewReport(report._id)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          {report.status === ReportStatus.SUBMITTED && (
                            <>
                              <button
                                onClick={() => setActionModal({ report, type: "approve" })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionModal({ report, type: "decline" })}
                                className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex justify-end gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {(previewReport ?? previewLoading) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-display text-lg font-bold text-gray-900">Report Card Preview</h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {previewLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading report...</p>
              </div>
            ) : previewReport && (
              <div className="p-6 space-y-5">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Student</p>
                    <p className="font-semibold text-gray-900">
                      {previewReport.studentSnapshot.firstName} {previewReport.studentSnapshot.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{previewReport.studentSnapshot.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Class</p>
                    <p className="font-semibold text-gray-900">{previewReport.className}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Term / Session</p>
                    <p className="font-semibold text-gray-900 capitalize">{previewReport.termName} Term</p>
                    <p className="text-xs text-gray-500">{previewReport.sessionName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Overall Performance</p>
                    <p className="font-bold text-[#1e3a5f] text-xl">{previewReport.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{previewReport.position}/{previewReport.totalStudentsInClass} in class</p>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[previewReport.status].color}`}>
                    {previewReport.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    Submitted by {previewReport.submittedBy.firstName} {previewReport.submittedBy.lastName}
                    {previewReport.submittedAt && ` · ${formatDateTime(previewReport.submittedAt)}`}
                  </span>
                </div>

                {/* Subjects Table */}
                {Array.isArray(previewReport.subjects) && previewReport.subjects.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Subject Scores</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-semibold">Subject</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Test</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Exam</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Practical</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Total</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Grade</th>
                            <th className="px-3 py-2.5 text-xs text-gray-500 font-semibold text-center">Remark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {previewReport.subjects.map((s) => (
                            <tr key={s.subject} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-medium text-gray-700">{s.subjectName}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{s.testScore}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{s.examScore}</td>
                              <td className="px-3 py-2.5 text-center text-gray-400">
                                {s.hasPractical ? s.practicalScore : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center font-bold text-[#1e3a5f]">
                                {s.totalScore}/{s.maxTotalScore}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  s.grade === "A" ? "bg-emerald-100 text-emerald-700" :
                                  s.grade === "F" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {s.grade}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center text-xs text-gray-500">{s.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Teacher Comment */}
                {previewReport.teacherComment && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Teacher&apos;s Comment</p>
                    <p className="text-sm text-blue-900 italic">{previewReport.teacherComment}</p>
                  </div>
                )}

                {/* Action buttons — only for submitted reports */}
                {previewReport.status === ReportStatus.SUBMITTED && (
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setActionModal({ report: previewReport, type: "approve" });
                        closePreview();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setActionModal({ report: previewReport, type: "decline" });
                        closePreview();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTION MODAL ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                {actionModal.type === "approve" ? "Approve Report Card" : "Decline Report Card"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {actionModal.report.studentSnapshot.firstName} {actionModal.report.studentSnapshot.lastName} —{" "}
                {actionModal.report.className} — {actionModal.report.termName} term
              </p>

              {actionModal.type === "approve" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal&apos;s Comment (optional)
                  </label>
                  <textarea
                    value={principalComment}
                    onChange={(e) => setPrincipalComment(e.target.value)}
                    rows={3}
                    placeholder="Add a comment from the principal..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Declining *
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this report is being declined..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setActionModal(null); setDeclineReason(""); setPrincipalComment(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading || (actionModal.type === "decline" && !declineReason.trim())}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : actionModal.type === "approve" ? "Approve" : "Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}