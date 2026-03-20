// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Bell, ChevronDown } from "lucide-react";
// import { signOut } from "next-auth/react";
// import { UserRole, UserStatus } from "@/types/enums";
// import { getInitials, formatDateTime, truncate } from "@/lib/utils";
// import type { INotification } from "@/types";
// import Image from "next/image";

// interface SessionUser {
//   id: string;
//   email: string;
//   surname: string;
//   firstName: string;
//   otherName: string;
//   roles: UserRole[];
//   activeRole: UserRole;
//   status: UserStatus;
//   image?: string | null;
// }

// interface Props {
//   user: SessionUser;
// }

// function getRoleBadgeColor(role: UserRole): string {
//   switch (role) {
//     case UserRole.ADMIN:
//       return "bg-amber-100 text-amber-700";
//     case UserRole.TEACHER:
//       return "bg-blue-100 text-blue-700";
//     case UserRole.PARENT:
//       return "bg-emerald-100 text-emerald-700";
//     case UserRole.STUDENT:
//       return "bg-purple-100 text-purple-700";
//     default:
//       return "bg-gray-100 text-gray-700";
//   }
// }

// export default function DashboardHeader({ user }: Props) {
//   const [notifications, setNotifications] = useState<INotification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [showUserMenu, setShowUserMenu] = useState(false);

//   const notifRef = useRef<HTMLDivElement>(null);
//   const userRef = useRef<HTMLDivElement>(null);
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const prevUnreadRef = useRef<number>(0);
//   const initialLoad = useRef<boolean>(true);

//   // Initialize audio
//   useEffect(() => {
//     audioRef.current = new Audio("/sounds/notification.mp3");
//     audioRef.current.volume = 0.6;
//   }, []);

//   // Click outside to close dropdowns
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
//         setShowNotifications(false);
//       }
//       if (userRef.current && !userRef.current.contains(e.target as Node)) {
//         setShowUserMenu(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Fetch notifications + play sound on new ones
//   useEffect(() => {
//     let cancelled = false;

//     async function fetchNotifications() {
//       try {
//         const res = await fetch("/api/notifications?unread=true&limit=6");
//         const json = (await res.json()) as {
//           success: boolean;
//           data?: INotification[];
//           pagination?: { total: number };
//         };

//         if (!cancelled && json.success && json.data) {
//           const newCount = json.pagination?.total ?? 0;

//           // Play sound only when count increases AFTER first load
//           if (!initialLoad.current && newCount > prevUnreadRef.current) {
//             audioRef.current?.play().catch(() => {
//               // Browser blocked autoplay — silently ignore
//             });
//           }

//           prevUnreadRef.current = newCount;
//           initialLoad.current = false;
//           setNotifications(json.data);
//           setUnreadCount(newCount);
//         }
//       } catch {
//         // Silently fail — non-critical
//       }
//     }

//     fetchNotifications();
//     const interval = setInterval(fetchNotifications, 30000);
//     return () => {
//       cancelled = true;
//       clearInterval(interval);
//     };
//   }, []);

//   async function markAllRead() {
//     await fetch("/api/notifications", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ markAll: true }),
//     });
//     setUnreadCount(0);
//     setNotifications([]);
//     prevUnreadRef.current = 0;
//   }

//   const roleLabel =
//     user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1);

//   return (
//     <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
//       {/* Left */}
//       <div className="flex items-center gap-2">
//         <div className="text-sm text-gray-500">
//           Welcome,{" "}
//           <span className="font-semibold text-gray-800">{user.firstName}</span>
//         </div>
//       </div>

//       {/* Right */}
//       <div className="flex items-center gap-2">
//         {/* Notifications */}
//         <div className="relative" ref={notifRef}>
//           <button
//             onClick={() => setShowNotifications(!showNotifications)}
//             className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
//           >
//             <Bell className="w-4 h-4" />
//             {unreadCount > 0 && (
//               <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
//                 {unreadCount > 9 ? "9+" : unreadCount}
//               </span>
//             )}
//           </button>

//           {showNotifications && (
//             <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
//               <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
//                 <span className="font-semibold text-sm text-gray-800">
//                   Notifications
//                 </span>
//                 {unreadCount > 0 && (
//                   <button
//                     onClick={markAllRead}
//                     className="text-xs text-blue-600 hover:text-blue-700"
//                   >
//                     Mark all read
//                   </button>
//                 )}
//               </div>
//               <div className="max-h-72 overflow-y-auto">
//                 {notifications.length === 0 ? (
//                   <div className="py-8 text-center">
//                     <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
//                     <p className="text-gray-400 text-sm">
//                       No new notifications
//                     </p>
//                   </div>
//                 ) : (
//                   notifications.map((n) => (
//                     <div
//                       key={n._id}
//                       className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
//                     >
//                       <p className="text-sm font-medium text-gray-800 mb-0.5">
//                         {truncate(n.title, 40)}
//                       </p>
//                       <p className="text-xs text-gray-500 mb-1">
//                         {truncate(n.message, 60)}
//                       </p>
//                       <p className="text-[10px] text-gray-400">
//                         {formatDateTime(n.createdAt)}
//                       </p>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* User menu */}
//         <div className="relative" ref={userRef}>
//           <button
//             onClick={() => setShowUserMenu(!showUserMenu)}
//             className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
//           >
//             <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white text-xs font-bold">
//               {user.image ? (
//                 <Image
//                   src={user.image}
//                   alt="avatar"
//                   className="w-full h-full rounded-lg object-cover"
//                   width={28}
//                   height={28}
//                 />
//               ) : (
//                 getInitials(user.surname, user.firstName, user.otherName)
//               )}
//             </div>
//             <div className="hidden sm:block text-left">
//               <p className="text-xs font-semibold text-gray-800 leading-tight">
//                 {user.surname} {user.firstName} {user.otherName}
//               </p>
//               <span
//                 className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.activeRole)}`}
//               >
//                 {roleLabel}
//               </span>
//             </div>
//             <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
//           </button>

//           {showUserMenu && (
//             <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
//               <div className="px-4 py-3 border-b border-gray-50">
//                 <p className="text-sm font-semibold text-gray-800">
//                   {user.surname} {user.firstName} {user.otherName}
//                 </p>
//                 <p className="text-xs text-gray-400">{user.email}</p>
//               </div>
//               <button
//                 onClick={() => signOut({ callbackUrl: "/sign-in" })}
//                 className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
//               >
//                 Sign Out
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, User, LogOut, Trash2, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { UserRole, UserStatus } from "@/types/enums";
import { getInitials, formatDateTime, truncate } from "@/lib/utils";
import type { INotification } from "@/types";
import Image from "next/image";

const SCHOOL_LOGO =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

interface SessionUser {
  id:         string;
  email:      string;
  surname:    string;
  firstName:  string;
  otherName:  string;
  roles:      UserRole[];
  activeRole: UserRole;
  status:     UserStatus;
  image?:     string | null;
}

interface Props {
  user: SessionUser;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleBadgeStyle(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return { background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" };
    case UserRole.TEACHER:
      return { background: "rgba(14,165,233,0.15)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)" };
    case UserRole.PARENT:
      return { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" };
    case UserRole.STUDENT:
      return { background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" };
    default:
      return { background: "rgba(255,255,255,0.1)", color: "#f5f0e8", border: "1px solid rgba(255,255,255,0.2)" };
  }
}

function getRoleAccentColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:   return "#f97316";
    case UserRole.TEACHER: return "#0ea5e9";
    case UserRole.PARENT:  return "#10b981";
    case UserRole.STUDENT: return "#8b5cf6";
    default:               return "#f97316";
  }
}

// ─── NotificationItems — declared OUTSIDE the parent component ────────────────

interface NotificationItemsProps {
  notifications:       INotification[];
  dark?:               boolean;
  onClose:             () => void;
  onClearOne:          (e: React.MouseEvent, id: string) => void;
}

function NotificationItems({
  notifications,
  dark = false,
  onClose,
  onClearOne,
}: NotificationItemsProps) {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center">
        <Bell
          className="w-8 h-8 mx-auto mb-2"
          style={dark ? { color: "rgba(122,184,212,0.3)" } : { color: "#e5e7eb" }}
        />
        <p
          className="text-sm"
          style={dark ? { color: "rgba(245,240,232,0.4)" } : { color: "#9ca3af" }}
        >
          No new notifications
        </p>
      </div>
    );
  }

  return (
    <>
      {notifications.map((n) => (
        <div key={n._id} className="group relative">
          <a
            href={n.link ?? "/notifications"}
            onClick={onClose}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
              dark ? "hover:bg-white/[.04]" : "hover:bg-gray-50"
            }`}
            style={dark ? { borderBottom: "1px solid rgba(14,165,233,0.07)" } : undefined}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium mb-0.5 pr-5"
                style={dark ? { color: "#f5f0e8", fontWeight: 600 } : { color: "#1f2937" }}
              >
                {truncate(n.title, 36)}
              </p>
              <p
                className="text-xs mb-1"
                style={dark ? { color: "rgba(245,240,232,0.5)" } : { color: "#6b7280" }}
              >
                {truncate(n.message, 55)}
              </p>
              <p
                className="text-[10px]"
                style={dark ? { color: "rgba(122,184,212,0.5)" } : { color: "#9ca3af" }}
              >
                {formatDateTime(n.createdAt)}
              </p>
            </div>
          </a>

          {/* Clear single — appears on hover */}
          <button
            onClick={(e) => onClearOne(e, n._id)}
            className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            style={dark
              ? { color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.06)" }
              : { color: "#9ca3af", background: "#f3f4f6" }
            }
            title="Clear notification"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardHeader({ user }: Props) {
  const [notifications,      setNotifications]      = useState<INotification[]>([]);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [showUserMenu,       setShowUserMenu]       = useState(false);

  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const prevUnreadRef     = useRef<number>(0);
  const initialLoad       = useRef<boolean>(true);
  const desktopNotifRef   = useRef<HTMLDivElement>(null);
  const desktopUserRef    = useRef<HTMLDivElement>(null);
  const mobileNotifRef    = useRef<HTMLDivElement>(null);
  const mobileUserRef     = useRef<HTMLDivElement>(null);

  const accentColor = getRoleAccentColor(user.activeRole);
  const roleLabel   = user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!desktopNotifRef.current?.contains(target) && !mobileNotifRef.current?.contains(target)) {
        setShowNotifications(false);
      }
      if (!desktopUserRef.current?.contains(target) && !mobileUserRef.current?.contains(target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchNotifications() {
      try {
        const res  = await fetch("/api/notifications?limit=6");
        const json = await res.json() as {
          success: boolean; data?: INotification[]; unreadCount?: number;
        };
        if (!cancelled && json.success && json.data) {
          const newCount = json.unreadCount ?? 0;
          if (!initialLoad.current && newCount > prevUnreadRef.current) {
            audioRef.current?.play().catch(() => {});
          }
          prevUnreadRef.current = newCount;
          initialLoad.current   = false;
          setNotifications(json.data);
          setUnreadCount(newCount);
        }
      } catch { /* silently fail */ }
    }
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch { /* silently fail */ }
  }

  async function clearAll() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch { /* silently fail */ }
  }

  async function clearOne(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, action: "clear" }),
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch { /* silently fail */ }
  }

  function handleToggleNotifications() {
    const opening = !showNotifications;
    setShowNotifications(opening);
    setShowUserMenu(false);
    if (opening && unreadCount > 0) void markAllRead();
  }

  function handleToggleUserMenu() {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  }

  const closeNotifications = () => setShowNotifications(false);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ════════════════════════════════════════════════════ */}
      {/* Desktop Header (lg+)                               */}
      {/* ════════════════════════════════════════════════════ */}
      <header className="hidden lg:flex bg-white border-b border-gray-100 px-6 h-14 items-center justify-between sticky top-0 z-30">
        <div className="text-sm text-gray-500">
          Welcome, <span className="font-semibold text-gray-800">{user.firstName}</span>
        </div>

        <div className="flex items-center gap-2">

          {/* ── Desktop Bell ── */}
          <div className="relative" ref={desktopNotifRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <span className="font-semibold text-sm text-gray-800">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  <NotificationItems
                    notifications={notifications}
                    dark={false}
                    onClose={closeNotifications}
                    onClearOne={clearOne}
                  />
                </div>

                <a
                  href="/notifications"
                  onClick={closeNotifications}
                  className="flex items-center justify-center py-3 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50 transition-colors text-blue-500"
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>

          {/* ── Desktop User Menu ── */}
          <div className="relative" ref={desktopUserRef}>
            <button
              onClick={handleToggleUserMenu}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {user.surname} {user.firstName}
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={getRoleBadgeStyle(user.activeRole)}
                >
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-800">{user.surname} {user.firstName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <a
                  href={`/${user.activeRole}/profile`}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" /> My Profile
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ════════════════════════════════════════════════════ */}
      {/* Mobile Header (< lg)                               */}
      {/* ════════════════════════════════════════════════════ */}
      <header
        className="lg:hidden sticky top-0 z-30"
        style={{
          background: "linear-gradient(135deg, #071428 0%, #0a1d3b 60%, #0c2348 100%)",
          borderBottom: "1px solid rgba(14,165,233,0.15)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, #0ea5e9, transparent)` }}
        />

        <div className="flex items-center justify-between px-4 h-14">

          {/* Left — Logo + school name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <img src={SCHOOL_LOGO} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight" style={{ color: "#f5f0e8", letterSpacing: "-0.01em" }}>
                God&apos;s Way
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "rgba(122,184,212,0.8)" }}>
                {roleLabel} Portal
              </p>
            </div>
          </div>

          {/* Right — Bell + Avatar */}
          <div className="flex items-center gap-2">

            {/* ── Mobile Bell ── */}
            <div className="relative" ref={mobileNotifRef}>
              <button
                onClick={handleToggleNotifications}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: showNotifications ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(14,165,233,0.2)",
                }}
              >
                <Bell className="w-4 h-4" style={{ color: "#7ab8d4" }} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                    style={{
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      boxShadow: "0 2px 8px rgba(249,115,22,0.5)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="fixed top-[57px] left-2 right-2 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: "rgba(8,22,50,0.98)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid rgba(14,165,233,0.12)" }}
                  >
                    <span className="font-semibold text-sm" style={{ color: "#f5f0e8" }}>
                      Notifications
                    </span>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium" style={{ color: "#0ea5e9" }}>
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: "#f87171" }}
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    <NotificationItems
                      notifications={notifications}
                      dark={true}
                      onClose={closeNotifications}
                      onClearOne={clearOne}
                    />
                  </div>

                  <a
                    href="/notifications"
                    onClick={closeNotifications}
                    className="flex items-center justify-center py-3 text-xs font-semibold hover:bg-white/[.03] transition-colors"
                    style={{ color: "#0ea5e9", borderTop: "1px solid rgba(14,165,233,0.12)" }}
                  >
                    View all notifications
                  </a>
                </div>
              )}
            </div>

            {/* ── Mobile User Menu ── */}
            <div className="relative" ref={mobileUserRef}>
              <button
                onClick={handleToggleUserMenu}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-all"
                style={{
                  background: showUserMenu ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)` }}
                >
                  {user.image
                    ? <Image src={user.image} alt="avatar" width={28} height={28} className="w-full h-full object-cover" />
                    : getInitials(user.surname, user.firstName, user.otherName)
                  }
                </div>
                <ChevronDown className="w-3 h-3" style={{ color: "rgba(245,240,232,0.4)" }} />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-11 w-60 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: "rgba(8,22,50,0.98)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(14,165,233,0.12)" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)` }}
                      >
                        {user.image
                          ? <Image src={user.image} alt="avatar" width={40} height={40} className="w-full h-full object-cover" />
                          : getInitials(user.surname, user.firstName, user.otherName)
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#f5f0e8" }}>
                          {user.surname} {user.firstName}
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={getRoleBadgeStyle(user.activeRole)}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mt-2 truncate" style={{ color: "rgba(245,240,232,0.35)" }}>
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <a
                      href={`/${user.activeRole}/profile`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/[.04]"
                      style={{ color: "rgba(245,240,232,0.75)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.2)" }}
                      >
                        <User className="w-3.5 h-3.5" style={{ color: "#0ea5e9" }} />
                      </div>
                      My Profile
                    </a>
                    <button
                      onClick={() => signOut({ callbackUrl: "/sign-in" })}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/[.04]"
                      style={{ color: "rgba(239,68,68,0.85)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <LogOut className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
}