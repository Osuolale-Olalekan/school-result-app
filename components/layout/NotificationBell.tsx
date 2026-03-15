"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Loader2, CheckCheck, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function typeColor(type: string): string {
  if (type.includes("approved") || type.includes("available")) return "#34d399";
  if (type.includes("declined"))  return "#f87171";
  if (type.includes("behaviour") || type.includes("general")) return "#f97316";
  if (type.includes("announcement")) return "#a78bfa";
  if (type.includes("payment"))   return "#fbbf24";
  return "#38bdf8";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const dropdownRef                   = useRef<HTMLDivElement>(null);
  const hasMarkedRead                 = useRef(false);

  // ── Fetch unread count on mount (lightweight) ──
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications?limit=1&page=1");
      const json = await res.json();
      if (json.success) setUnreadCount(json.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(() => void fetchUnreadCount(), 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Close on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Open dropdown: fetch + mark all read ──
  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setIsLoading(true);
    hasMarkedRead.current = false;

    try {
      const res  = await fetch("/api/notifications?limit=6&page=1");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }

      // Mark all read
      if ((json.unreadCount ?? 0) > 0 && !hasMarkedRead.current) {
        hasMarkedRead.current = true;
        await fetch("/api/notifications", { method: "PATCH" });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  }

  function handleNotificationClick(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: open ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.08)"}`,
        }}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" style={{ color: open ? "#38bdf8" : "rgba(245,240,232,0.6)" }} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
            style={{ background: "#f97316", boxShadow: "0 0 0 2px #0a1118" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
            style={{
              background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
              border: "1px solid rgba(14,165,233,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Dropdown header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" style={{ color: "#38bdf8" }} />
                <span className="text-xs font-bold" style={{ color: "#f5f0e8" }}>Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setOpen(false)}
                  className="p-1 rounded-lg transition-all"
                  style={{ color: "rgba(245,240,232,0.3)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#38bdf8" }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCheck className="w-6 h-6" style={{ color: "rgba(245,240,232,0.15)" }} />
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>All caught up!</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/[.03]"
                    style={{ borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  >
                    {/* Color dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: n.isRead ? "rgba(255,255,255,0.15)" : typeColor(n.type) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate mb-0.5"
                        style={{ color: n.isRead ? "rgba(245,240,232,0.5)" : "#f5f0e8" }}>
                        {n.title}
                      </p>
                      <p className="text-[10px] line-clamp-2"
                        style={{ color: "rgba(245,240,232,0.35)" }}>
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: "rgba(245,240,232,0.25)" }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {n.link && (
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-1" style={{ color: "rgba(245,240,232,0.2)" }} />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer — view all */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => { setOpen(false); router.push("/notifications"); }}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all hover:bg-white/[.03]"
                style={{ color: "#38bdf8" }}
              >
                View all notifications <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}