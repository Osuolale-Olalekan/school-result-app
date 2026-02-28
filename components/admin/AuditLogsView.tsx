"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { IAuditLog } from "@/types";
import { AuditAction } from "@/types/enums";

const ACTION_COLORS: Record<string, string> = {
  [AuditAction.CREATE]: "bg-emerald-100 text-emerald-700",
  [AuditAction.UPDATE]: "bg-blue-100 text-blue-700",
  [AuditAction.DELETE]: "bg-red-100 text-red-700",
  [AuditAction.LOGIN]: "bg-gray-100 text-gray-600",
  [AuditAction.APPROVE]: "bg-emerald-100 text-emerald-700",
  [AuditAction.DECLINE]: "bg-red-100 text-red-700",
  [AuditAction.PROMOTE]: "bg-purple-100 text-purple-700",
  [AuditAction.ACTIVATE]: "bg-emerald-100 text-emerald-700",
  [AuditAction.DEACTIVATE]: "bg-gray-100 text-gray-600",
  [AuditAction.SUSPEND]: "bg-amber-100 text-amber-700",
  [AuditAction.PAYMENT_UPDATE]: "bg-blue-100 text-blue-700",
  [AuditAction.PASSWORD_RESET]: "bg-orange-100 text-orange-700",
};

export default function AuditLogsView() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(actionFilter && { action: actionFilter }),
      });
      const res = await fetch(`/api/audit-logs?${params}`);
      const json = await res.json() as {
        success: boolean;
        data?: IAuditLog[];
        pagination?: { totalPages: number; total: number };
      };
      if (json.success && json.data) {
        setLogs(json.data);
        setTotalPages(json.pagination?.totalPages ?? 1);
        setTotal(json.pagination?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm">{total} total entries — all system actions are tracked</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActionFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              actionFilter === "" ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600"
            }`}
          >
            All
          </button>
          {Object.values(AuditAction).map((action) => (
            <button
              key={action}
              onClick={() => { setActionFilter(action); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                actionFilter === action ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600"
              }`}
            >
              {action.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 text-sm">{log.actorName}</p>
                      <p className="text-xs text-gray-400 capitalize">{log.actorRole}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600">{log.entity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <p className="truncate">{log.description}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
