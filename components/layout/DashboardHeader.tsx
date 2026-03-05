"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { UserRole, UserStatus } from "@/types/enums";
import { getInitials, formatDateTime, truncate } from "@/lib/utils";
import type { INotification } from "@/types";
import Image from "next/image";

interface SessionUser {
  id: string;
  email: string;
  surname: string;
  firstName: string;
  otherName: string;
  roles: UserRole[];
  activeRole: UserRole;
  status: UserStatus;
  image?: string | null;
}

interface Props {
  user: SessionUser;
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "bg-amber-100 text-amber-700";
    case UserRole.TEACHER:
      return "bg-blue-100 text-blue-700";
    case UserRole.PARENT:
      return "bg-emerald-100 text-emerald-700";
    case UserRole.STUDENT:
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function DashboardHeader({ user }: Props) {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadRef = useRef<number>(0);
  const initialLoad = useRef<boolean>(true);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.volume = 0.6;
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications + play sound on new ones
  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?unread=true&limit=6");
        const json = (await res.json()) as {
          success: boolean;
          data?: INotification[];
          pagination?: { total: number };
        };

        if (!cancelled && json.success && json.data) {
          const newCount = json.pagination?.total ?? 0;

          // Play sound only when count increases AFTER first load
          if (!initialLoad.current && newCount > prevUnreadRef.current) {
            audioRef.current?.play().catch(() => {
              // Browser blocked autoplay — silently ignore
            });
          }

          prevUnreadRef.current = newCount;
          initialLoad.current = false;
          setNotifications(json.data);
          setUnreadCount(newCount);
        }
      } catch {
        // Silently fail — non-critical
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications([]);
    prevUnreadRef.current = 0;
  }

  const roleLabel =
    user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1);

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500">
          Welcome,{" "}
          <span className="font-semibold text-gray-800">{user.firstName}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
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
                <span className="font-semibold text-sm text-gray-800">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      No new notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-800 mb-0.5">
                        {truncate(n.title, 40)}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        {truncate(n.message, 60)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white text-xs font-bold">
              {user.image ? (
                <Image
                  src={user.image}
                  alt="avatar"
                  className="w-full h-full rounded-lg object-cover"
                  width={28}
                  height={28}
                />
              ) : (
                getInitials(user.surname, user.firstName, user.otherName)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {user.surname} {user.firstName} {user.otherName}
              </p>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.activeRole)}`}
              >
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-800">
                  {user.surname} {user.firstName} {user.otherName}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
