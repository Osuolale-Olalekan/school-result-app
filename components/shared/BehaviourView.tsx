"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert, ThumbsUp, ThumbsDown, Calendar,
  User, Loader2, RefreshCw, Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { BehaviourSeverity, BehaviourType, UserRole } from "@/types/enums";

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
  [BehaviourSeverity.LOW]:    { label: "Low",    bg: "rgba(245,158,11,0.1)",  text: "#fbbf24", border: "rgba(245,158,11,0.2)"  },
  [BehaviourSeverity.MEDIUM]: { label: "Medium", bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.22)" },
  [BehaviourSeverity.HIGH]:   { label: "High",   bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.22)"  },
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
  const [records, setRecords]         = useState<BehaviourRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [typeFilter, setTypeFilter]   = useState<string>("all");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const limit = compact ? 5 : 15;
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
      } catch {
        // silent
      } finally {
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

  // ── Stats summary ──
  const negCount = records.filter((r) => r.type === BehaviourType.NEGATIVE).length;
  const posCount = records.filter((r) => r.type === BehaviourType.POSITIVE).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full min-w-0 rounded-2xl p-4 lg:p-6 space-y-4"
      style={{
        background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
        border: "1px solid rgba(14,165,233,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}
          >
            <ShieldAlert className="w-4 h-4" style={{ color: "#f97316" }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: "#f5f0e8" }}>
            Behaviour Records
          </h2>
        </div>

        {/* Mini stats */}
        {!isLoading && records.length > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.18)" }}
            >
              <ThumbsUp className="w-3 h-3" /> {posCount}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <ThumbsDown className="w-3 h-3" /> {negCount}
            </span>
          </div>
        )}
      </div>

      {/* Type filter (hidden in compact) */}
      {!compact && (
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(14,165,233,0.12)" }}
        >
          {["all", "negative", "positive"].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={
                typeFilter === t
                  ? { background: "rgba(249,115,22,0.2)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }
                  : { color: "rgba(245,240,232,0.4)", border: "1px solid transparent" }
              }
            >
              {t === "all" ? "All" : t === "negative" ? "⚠ Negative" : "★ Positive"}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#f97316" }} />
        </div>
      ) : records.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 rounded-2xl"
          style={{ border: "1px dashed rgba(14,165,233,0.12)", background: "rgba(255,255,255,0.01)" }}
        >
          <ShieldAlert className="w-7 h-7 mb-2" style={{ color: "rgba(245,240,232,0.12)" }} />
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>
            No behaviour records yet
          </p>
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
                className="p-3 rounded-xl"
                style={{
                  background: isNeg ? "rgba(239,68,68,0.05)" : "rgba(16,185,129,0.05)",
                  border: isNeg ? "1px solid rgba(239,68,68,0.12)" : "1px solid rgba(16,185,129,0.12)",
                }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: isNeg ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                      border: isNeg ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    {isNeg
                      ? <ThumbsDown className="w-3 h-3" style={{ color: "#f87171" }} />
                      : <ThumbsUp   className="w-3 h-3" style={{ color: "#34d399" }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {/* For parent view: show student name */}
                      {role === "parent" && student && (
                        <span className="text-xs font-semibold" style={{ color: "#f5f0e8" }}>
                          {student.firstName} {student.surname}
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{
                          background: isNeg ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          color: isNeg ? "#f87171" : "#34d399",
                          border: isNeg ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(16,185,129,0.18)",
                        }}
                      >
                        {catLabel}
                      </span>
                      {sevStyle && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: sevStyle.bg, color: sevStyle.text, border: `1px solid ${sevStyle.border}` }}
                        >
                          {sevStyle.label}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs mb-1.5" style={{ color: "rgba(245,240,232,0.55)", lineHeight: "1.5" }}>
                      {r.description}
                    </p>

                    {r.actionTaken && (
                      <p className="text-[10px] mb-1.5 italic" style={{ color: "rgba(245,240,232,0.35)" }}>
                        Action taken: {r.actionTaken}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(245,240,232,0.3)" }}>
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(245,240,232,0.5)",
              }}
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
              className="block text-center text-[10px] py-1.5"
              style={{ color: "#0ea5e9" }}
            >
              View all records →
            </a>
          )}
        </div>
      )}
    </div>
  );
}