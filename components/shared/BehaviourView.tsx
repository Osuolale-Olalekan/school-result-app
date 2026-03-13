"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert, ThumbsUp, ThumbsDown, Calendar,
  User, Loader2, RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { BehaviourSeverity, BehaviourType } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  _id: string;
  firstName: string;
  surname: string;
  admissionNumber: string;
}

interface BehaviourRecord {
  _id: string;
  studentId: Student | string;
  loggedBy: { firstName: string; surname: string } | string;
  date: string;
  type: BehaviourType;
  category: string;
  description: string;
  severity?: BehaviourSeverity;
  actionTaken?: string;
  parentNotified: boolean;
}

// ─── Severity styles ──────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<BehaviourSeverity, { label: string; bg: string; text: string; border: string }> = {
  [BehaviourSeverity.LOW]:    { label: "Low",    bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200"  },
  [BehaviourSeverity.MEDIUM]: { label: "Medium", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  [BehaviourSeverity.HIGH]:   { label: "High",   bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"    },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface BehaviourViewProps {
  /** "parent" fetches /api/parent/behaviour, "student" fetches /api/student/behaviour */
  role: "parent" | "student";
  /** For parent: if provided, filters to one child */
  childId?: string;
  /** Compact = 5 records max for dashboard widget */
  compact?: boolean;
}

export default function BehaviourView({ role, childId, compact = false }: BehaviourViewProps) {
  const [records, setRecords]             = useState<BehaviourRecord[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [typeFilter, setTypeFilter]       = useState<string>("all");
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const limit   = compact ? 5 : 15;
  const apiBase = role === "parent" ? "/api/parent/behaviour" : "/api/student/behaviour";

  const fetchRecords = useCallback(
    async (p = 1, append = false, silent = false) => {
      if (p === 1 && !silent) setIsLoading(true);
      else if (p > 1) setIsLoadingMore(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(limit) });
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (role === "parent" && childId) params.set("childId", childId);
        const res  = await fetch(`${apiBase}?${params}`);
        const json = await res.json();
        if (json.success) {
          setRecords((prev) =>
            append ? [...prev, ...(json.data ?? [])] : (json.data ?? [])
          );
          setTotalPages(json.pagination?.totalPages ?? 1);
        }
      } catch { /* silent */ } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [apiBase, childId, limit, role, typeFilter]
  );

  useEffect(() => {
    setPage(1);
    void fetchRecords(1, false, true);
  }, [fetchRecords]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    void fetchRecords(next, true, false);
  }

  const negCount = records.filter((r) => r.type === BehaviourType.NEGATIVE).length;
  const posCount = records.filter((r) => r.type === BehaviourType.POSITIVE).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 font-display">
            Behaviour Records
          </h2>
        </div>

        {/* Mini stats */}
        {!isLoading && records.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ThumbsUp className="w-3 h-3" /> {posCount}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200">
              <ThumbsDown className="w-3 h-3" /> {negCount}
            </span>
          </div>
        )}
      </div>

      {/* Type filter (hidden in compact) */}
      {!compact && (
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
          {["all", "negative", "positive"].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === t
                  ? "bg-white text-amber-600 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "all" ? "All" : t === "negative" ? "⚠ Negative" : "★ Positive"}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <ShieldAlert className="w-7 h-7 mb-2 text-gray-300" />
          <p className="text-xs text-gray-400">No behaviour records yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r, i) => {
            const isNeg    = r.type === BehaviourType.NEGATIVE;
            const sevStyle = r.severity ? SEVERITY_STYLES[r.severity] : null;
            const catLabel = r.category.replace(/_/g, " ");
            const student  = typeof r.studentId === "object" ? r.studentId : null;
            const loggedBy = typeof r.loggedBy  === "object" ? r.loggedBy  : null;

            return (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-3 rounded-xl bg-white border ${
                  isNeg ? "border-red-100" : "border-emerald-100"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                    isNeg ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                  }`}>
                    {isNeg
                      ? <ThumbsDown className="w-3 h-3 text-red-500" />
                      : <ThumbsUp   className="w-3 h-3 text-emerald-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {role === "parent" && student && (
                        <span className="text-xs font-semibold text-gray-900">
                          {student.firstName} {student.surname}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                        isNeg
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                        {catLabel}
                      </span>
                      {sevStyle && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
                          {sevStyle.label}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{r.description}</p>

                    {r.actionTaken && (
                      <p className="text-[10px] text-gray-400 italic mb-1.5">
                        Action taken: {r.actionTaken}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(r.date).toLocaleDateString("en-NG")}
                      </span>
                      {loggedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {loggedBy.firstName} {loggedBy.surname}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Load more */}
          {!compact && page < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
            >
              {isLoadingMore
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><RefreshCw className="w-3 h-3" /> Load more</>
              }
            </button>
          )}

          {/* Compact view-all */}
          {compact && totalPages > 1 && (
            <a
              href={role === "parent" ? "/parent/behaviour" : "/student/behaviour"}
              className="block text-center text-[10px] py-1.5 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              View all records →
            </a>
          )}
        </div>
      )}
    </div>
  );
}