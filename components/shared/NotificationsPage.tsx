"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Loader2, CheckCheck, ChevronRight,
  Megaphone, ShieldAlert, FileText, Star,
  CreditCard, UserCheck, RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  _id:       string;
  type:      string;
  title:     string;
  message:   string;
  isRead:    boolean;
  link?:     string;
  createdAt: string;
}

interface GroupedNotifications {
  label: string;
  items: Notification[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDate(notifications: Notification[]): GroupedNotifications[] {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const thisWeek  = today - 6 * 86400000;

  const groups: Record<string, Notification[]> = {
    Today:       [],
    Yesterday:   [],
    "This week": [],
    Earlier:     [],
  };

  for (const n of notifications) {
    const t = new Date(n.createdAt).getTime();
    if      (t >= today)     groups["Today"].push(n);
    else if (t >= yesterday) groups["Yesterday"].push(n);
    else if (t >= thisWeek)  groups["This week"].push(n);
    else                     groups["Earlier"].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function typeIcon(type: string) {
  if (type.includes("announcement")) return Megaphone;
  if (type.includes("behaviour"))    return ShieldAlert;
  if (type.includes("report"))       return FileText;
  if (type.includes("result"))       return Star;
  if (type.includes("payment"))      return CreditCard;
  if (type.includes("account"))      return UserCheck;
  return Bell;
}

function typeColor(type: string): { bg: string; text: string; border: string } {
  if (type.includes("approved") || type.includes("available") || type.includes("result"))
    return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" };
  if (type.includes("declined"))
    return { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200"     };
  if (type.includes("behaviour") || type.includes("general"))
    return { bg: "bg-orange-50",  text: "text-orange-500",  border: "border-orange-200"  };
  if (type.includes("announcement"))
    return { bg: "bg-purple-50",  text: "text-purple-500",  border: "border-purple-200"  };
  if (type.includes("payment"))
    return { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200"   };
  return   { bg: "bg-blue-50",    text: "text-blue-500",    border: "border-blue-200"    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [unreadCount, setUnreadCount]     = useState(0);

  const fetchNotifications = useCallback(async (p = 1, append = false, silent = false) => {
    if (p === 1 && !silent) setIsLoading(true);
    else if (p > 1)         setIsLoadingMore(true);
    try {
      const res  = await fetch(`/api/notifications?page=${p}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) =>
          append ? [...prev, ...(json.data ?? [])] : (json.data ?? [])
        );
        setTotalPages(json.pagination?.totalPages ?? 1);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(1, false, false).then(async () => {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  }, [fetchNotifications]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    void fetchNotifications(next, true, false);
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n._id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((item) => item._id === n._id ? { ...item, isRead: true } : item)
      );
    }
    if (n.link) router.push(n.link);
  }

  const grouped = groupByDate(notifications);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">Notifications</h2>
            <p className="text-xs text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl gap-3 border border-dashed border-gray-200 bg-gray-50">
          <CheckCheck className="w-10 h-10 text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
            <p className="text-xs mt-1 text-gray-300">You&apos;re all caught up!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Group label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1 text-gray-400">
                {label}
              </p>

              <div className="space-y-1.5">
                {items.map((n, i) => {
                  const Icon   = typeIcon(n.type);
                  const colors = typeColor(n.type);

                  return (
                    <motion.button
                      key={n._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors border ${
                        n.isRead
                          ? "bg-white border-gray-100 hover:bg-gray-50"
                          : "bg-amber-50/40 border-amber-100 hover:bg-amber-50"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${colors.bg} ${colors.border}`}>
                        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-xs font-semibold truncate ${n.isRead ? "text-gray-500" : "text-gray-900"}`}>
                            {n.title}
                          </p>
                          {/* Unread dot */}
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-2 text-gray-400">
                          {n.message}
                        </p>
                        <p className="text-[10px] mt-1 text-gray-300">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>

                      {n.link && (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-2 text-gray-300" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {page < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
            >
              {isLoadingMore
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><RefreshCw className="w-3 h-3" /> Load more</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}