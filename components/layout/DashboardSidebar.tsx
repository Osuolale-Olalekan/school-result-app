"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  BarChart3,
  ClipboardList,
  Shield,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  TrendingUp,
  LogOut,
  ChevronLeft,
  BookMarked,
  GraduationCap,
  Settings,
  User,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";

const SCHOOL_LOGO =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Sessions", href: "/admin/sessions", icon: Calendar },
  { label: "Classes", href: "/admin/classes", icon: BookOpen },
  { label: "Subjects", href: "/admin/subjects", icon: BookMarked },
  {
    label: "Class Assignments",
    href: "/admin/class-assignments",
    icon: UserCheck,
  },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  // { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Promotions", href: "/admin/promote", icon: TrendingUp },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Behaviour", href: "/admin/behaviour", icon: ShieldAlert },
  { label: "My Profile", href: "/admin/profile", icon: User },
];

const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
  { label: "Results & Reports", href: "/teacher/results", icon: FileText },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Behaviour", href: "/teacher/behaviour", icon: ShieldAlert },
  { label: "My Profile", href: "/teacher/profile", icon: User }, // ← add
];

const PARENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: GraduationCap },
  { label: "Report Cards", href: "/parent/reports", icon: FileText },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Behaviour", href: "/parent/behaviour",  icon: ShieldAlert },
  { label: "My Profile", href: "/parent/profile", icon: User }, // ← add
];

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Reports", href: "/student/reports", icon: FileText },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Behaviour", href: "/student/behaviour", icon: ShieldAlert },
  { label: "My Profile", href: "/student/profile", icon: User }, // ← add
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case UserRole.ADMIN:
      return ADMIN_NAV;
    case UserRole.TEACHER:
      return TEACHER_NAV;
    case UserRole.PARENT:
      return PARENT_NAV;
    case UserRole.STUDENT:
      return STUDENT_NAV;
    default:
      return [];
  }
}

// Role badge accent colors — all within the navy/orange/sky-blue palette
function getRoleBadgeStyle(role: UserRole): React.CSSProperties {
  switch (role) {
    case UserRole.ADMIN:
      return {
        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        color: "#fff",
      };
    case UserRole.TEACHER:
      return {
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        color: "#fff",
      };
    case UserRole.PARENT:
      return {
        background: "linear-gradient(135deg, #7ab8d4 0%, #0ea5e9 100%)",
        color: "#fff",
      };
    case UserRole.STUDENT:
      return {
        background: "linear-gradient(135deg, #0ea5e9 0%, #7ab8d4 100%)",
        color: "#fff",
      };
    default:
      return { background: "rgba(255,255,255,0.1)", color: "#f5f0e8" };
  }
}

// Active nav item accent per role
function getActiveStyle(role: UserRole): React.CSSProperties {
  switch (role) {
    case UserRole.ADMIN:
      return {
        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        color: "#fff",
        boxShadow: "0 2px 12px rgba(249,115,22,0.30)",
      };
    case UserRole.TEACHER:
      return {
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        color: "#fff",
        boxShadow: "0 2px 12px rgba(14,165,233,0.30)",
      };
    case UserRole.PARENT:
      return {
        background: "linear-gradient(135deg, #0ea5e9 0%, #7ab8d4 100%)",
        color: "#fff",
        boxShadow: "0 2px 12px rgba(14,165,233,0.25)",
      };
    case UserRole.STUDENT:
      return {
        background: "linear-gradient(135deg, #7ab8d4 0%, #0ea5e9 100%)",
        color: "#fff",
        boxShadow: "0 2px 12px rgba(14,165,233,0.25)",
      };
    default:
      return { background: "rgba(255,255,255,0.1)", color: "#f5f0e8" };
  }
}

interface Props {
  role: UserRole;
}

export default function DashboardSidebar({ role }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavItems(role);

  const SidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #071428 0%, #0a1d3b 100%)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 p-4",
          collapsed && "justify-center",
        )}
        style={{ borderBottom: "1px solid rgba(14,165,233,0.12)" }}
      >
        {/* School logo with spinning conic ring */}
        <div
          className="relative flex-shrink-0"
          style={{ width: "36px", height: "36px" }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: "-3px",
              background:
                "conic-gradient(from 0deg, transparent 50%, rgba(249,115,22,0.7) 68%, rgba(14,165,233,0.6) 84%, transparent 100%)",
              animation: "gwSpin 16s linear infinite",
            }}
          />
          <div
            className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(245,240,232,0.15)",
            }}
          >
            <img
              src={SCHOOL_LOGO}
              alt="God's Way Schools"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p
              className="text-xs font-bold leading-tight truncate"
              style={{ color: "#f5f0e8" }}
            >
              God&apos;s Way
            </p>
            <p
              className="text-[10px] leading-tight truncate"
              style={{ color: "#7ab8d4" }}
            >
              Management Portal
            </p>
          </div>
        )}
      </div>

      {/* ── Role badge ────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={getRoleBadgeStyle(role)}
          >
            <Shield className="w-3 h-3" />
            {/* {role.charAt(0).toUpperCase() + role.slice(1)} Portal */}
            {role?.charAt(0).toUpperCase() + role?.slice(1)} Portal
          </span>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                collapsed && "justify-center px-2",
              )}
              style={
                isActive
                  ? getActiveStyle(role)
                  : { color: "rgba(245,240,232,0.45)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "#f5f0e8";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(14,165,233,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(245,240,232,0.45)";
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }
              }}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                  {item.badge && item.badge > 0 && (
                    <span
                      className="ml-auto text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ background: "#f97316" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Sign out ──────────────────────────────────────────────── */}
      <div
        className="p-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
            collapsed && "justify-center",
          )}
          style={{ color: "rgba(245,240,232,0.35)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#f87171";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(248,113,113,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(245,240,232,0.35)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r transition-all duration-300 relative",
          collapsed ? "w-16" : "w-60",
        )}
        style={{ borderColor: "rgba(14,165,233,0.12)" }}
      >
        {SidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
          style={{
            background: "#0a1d3b",
            border: "1px solid rgba(14,165,233,0.25)",
            color: "rgba(245,240,232,0.40)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f0e8")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(245,240,232,0.40)")
          }
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* ── Mobile menu button ────────────────────────────────────── */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          boxShadow: "0 4px 20px rgba(249,115,22,0.40)",
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Mobile sidebar ────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{
              background: "rgba(7,20,40,0.75)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
            style={{ borderRight: "1px solid rgba(14,165,233,0.12)" }}
          >
            {SidebarContent}
          </aside>
        </>
      )}

      <style>{`
        @keyframes gwSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
