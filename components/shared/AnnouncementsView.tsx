"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  AlertTriangle,
  Globe,
  Users,
  BookOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnnouncementAudience, AnnouncementPriority } from "@/types/enums";
import type { IAnnouncement } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUDIENCE_ICONS = {
  [AnnouncementAudience.ALL]: Globe,
  [AnnouncementAudience.ROLE]: Users,
  [AnnouncementAudience.CLASS]: BookOpen,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AnnouncementsViewProps {
  /** Compact mode — shows 3 items, no pagination, for dashboard widgets */
  compact?: boolean;
}

export default function AnnouncementsView({
  compact = false,
}: AnnouncementsViewProps) {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const limit = compact ? 3 : 10;

  const fetchAnnouncements = useCallback(
    async (p = 1, append = false, silent = false) => {
      if (p === 1 && !silent) setIsLoading(true);
      else if (p > 1) setIsLoadingMore(true);
      try {
        const res = await fetch(`/api/announcements?page=${p}&limit=${limit}`);
        const json = await res.json();
        if (json.success) {
          setAnnouncements((prev) =>
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
    [limit]
  );

  useEffect(() => {
    void fetchAnnouncements(1, false, true);
  }, [fetchAnnouncements]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    void fetchAnnouncements(next, true, false);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-4 h-4 text-amber-500" />
        </div>
        <h2 className="text-sm font-bold text-gray-900 font-display">
          Announcements
        </h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <Megaphone className="w-7 h-7 mb-2 text-gray-300" />
          <p className="text-xs text-gray-400">No announcements at the moment</p>
        </div>
      ) : (
        <div className="space-y-2.5 w-full min-w-0">
          {announcements.map((a, i) => {
            const isUrgent = a.priority === AnnouncementPriority.URGENT;
            const isExpanded = expanded === a._id;
            const AudienceIcon = AUDIENCE_ICONS[a.audience];
            const publishedAt = a.publishedAt ?? a.createdAt;

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl overflow-hidden cursor-pointer w-full border transition-colors ${
                  isUrgent
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
                onClick={() => setExpanded(isExpanded ? null : a._id)}
              >
                {/* Urgent stripe */}
                {isUrgent && (
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold bg-red-100 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent Announcement
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start gap-2">
                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        isUrgent
                          ? "bg-red-100 border-red-200"
                          : "bg-amber-50 border-amber-100"
                      }`}
                    >
                      <Megaphone
                        className={`w-3.5 h-3.5 ${isUrgent ? "text-red-500" : "text-amber-500"}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-xs font-semibold text-gray-900 leading-snug mb-0.5"
                        style={{ wordBreak: "break-word" }}
                      >
                        {a.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-400">
                        <span>{timeAgo(publishedAt)}</span>
                        <span className="flex items-center gap-0.5">
                          <AudienceIcon className="w-2.5 h-2.5" />
                          {a.audience === AnnouncementAudience.ALL
                            ? "Everyone"
                            : a.audience === AnnouncementAudience.ROLE
                            ? "Selected roles"
                            : "Your class"}
                        </span>
                        {a.expiresAt && (
                          <span>Exp. {new Date(a.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 mt-1 text-gray-400"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Expandable body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mt-3 pt-3 text-xs text-gray-600 leading-relaxed border-t border-gray-100"
                          style={{ wordBreak: "break-word" }}
                          dangerouslySetInnerHTML={{ __html: a.body }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              {isLoadingMore ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <><RefreshCw className="w-3 h-3" /> Load more</>
              )}
            </button>
          )}

          {/* Compact — view all link */}
          {compact && totalPages > 1 && (
            <a
              href="/announcements"
              className="block text-center text-[10px] py-1.5 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              View all announcements →
            </a>
          )}
        </div>
      )}
    </div>
  );
}