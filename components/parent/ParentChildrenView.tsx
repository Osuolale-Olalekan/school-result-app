"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  FileText,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Loader2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildInfo {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  profilePhoto?: string;
  currentClass: { name: string; section: string };
  gender: string;
  studentStatus: string;
}

interface AttendanceBreakdown {
  date: string;
  morning: string;
  afternoon: string;
}

interface AttendanceSummary {
  termName: string;
  sessionName: string;
  schoolDaysOpen: number;
  totalDaysMarked: number;
  daysPresent: number;
  daysAbsent: number;
  attendancePercentage: number;
  breakdown: AttendanceBreakdown[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAttendanceColor(percentage: number): {
  bar: string;
  text: string;
  bg: string;
  border: string;
} {
  if (percentage >= 90) return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (percentage >= 75) return { bar: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   };
  return                        { bar: "bg-red-500",    text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     };
}

function getStatusIcon(status: string) {
  switch (status) {
    case "present": return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    case "absent":  return <XCircle      className="w-3 h-3 text-red-400"     />;
    case "late":    return <Clock        className="w-3 h-3 text-amber-500"   />;
    case "excused": return <FileCheck    className="w-3 h-3 text-blue-500"    />;
    default:        return <XCircle      className="w-3 h-3 text-gray-300"    />;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── Attendance section ───────────────────────────────────────────────────────

function AttendanceSection({ childId }: { childId: string }) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/parent/attendance?studentId=${childId}`);
        const json = (await res.json()) as {
          success: boolean;
          data?: AttendanceSummary;
          error?: string;
        };
        if (!json.success) throw new Error(json.error ?? "Failed to load");
        setSummary(json.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    }
    void fetchAttendance();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-[#1e3a5f]" />
        <span className="ml-2 text-xs text-gray-400">Loading attendance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!summary || summary.totalDaysMarked === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No attendance recorded yet this term.</p>
      </div>
    );
  }

  const colors = getAttendanceColor(summary.attendancePercentage);

  return (
    <div className="space-y-3">
      {/* Term label */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase capitalize">
          {summary.termName} Term · {summary.sessionName}
        </p>
        {summary.attendancePercentage < 75 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Low attendance
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-700">{summary.daysPresent}</p>
          <p className="text-[11px] text-emerald-600">Days Present</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-red-600">{summary.daysAbsent}</p>
          <p className="text-[11px] text-red-500">Days Absent</p>
        </div>
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-3 text-center`}>
          <p className={`text-lg font-bold ${colors.text}`}>{summary.attendancePercentage}%</p>
          <p className={`text-[11px] ${colors.text}`}>Attendance</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>{summary.totalDaysMarked} days marked by teacher</span>
          {summary.schoolDaysOpen > 0 && (
            <span>{summary.schoolDaysOpen} school days this term</span>
          )}
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colors.bar}`}
            style={{ width: `${Math.min(summary.attendancePercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <TrendingUp className="w-3 h-3" />
          {summary.attendancePercentage >= 90
            ? "Excellent attendance — keep it up!"
            : summary.attendancePercentage >= 75
            ? "Good attendance — room for improvement"
            : "Attendance is below the 75% minimum requirement"}
        </div>
      </div>

      {/* Daily breakdown toggle */}
      {summary.breakdown.length > 0 && (
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600"
          >
            <span>Daily breakdown ({summary.breakdown.length} days)</span>
            {showBreakdown
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            }
          </button>

          {showBreakdown && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Date</span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase w-16 text-center">Morning</span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase w-16 text-center">Afternoon</span>
              </div>

              {summary.breakdown.map((day) => (
                <div
                  key={day.date}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <span className="text-xs text-gray-600">{formatDate(day.date)}</span>

                  {/* Morning */}
                  <div className="flex items-center justify-center gap-1 w-16">
                    {getStatusIcon(day.morning)}
                    <span className={`text-[11px] font-medium capitalize ${
                      day.morning === "present" ? "text-emerald-600"
                      : day.morning === "absent"  ? "text-red-500"
                      : day.morning === "late"    ? "text-amber-600"
                      : "text-blue-500"
                    }`}>
                      {day.morning}
                    </span>
                  </div>

                  {/* Afternoon */}
                  <div className="flex items-center justify-center gap-1 w-16">
                    {getStatusIcon(day.afternoon)}
                    <span className={`text-[11px] font-medium capitalize ${
                      day.afternoon === "present" ? "text-emerald-600"
                      : day.afternoon === "absent"  ? "text-red-500"
                      : day.afternoon === "late"    ? "text-amber-600"
                      : "text-blue-500"
                    }`}>
                      {day.afternoon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ParentChildrenView() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttendance, setExpandedAttendance] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    try {
      const res = await fetch("/api/parent/me");
      const json = (await res.json()) as {
        success: boolean;
        data?: { children?: ChildInfo[] };
      };
      if (json.success && json.data?.children) {
        setChildren(json.data.children as ChildInfo[]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function toggleAttendance(childId: string) {
    setExpandedAttendance((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-500 text-sm">
          View your children&apos;s academic information and report cards
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No children linked to your account</p>
          <p className="text-gray-400 text-sm mt-1">
            Contact the school admin to link your children
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((child) => {
            const isAttendanceOpen = expandedAttendance.has(child._id);
            return (
              <div
                key={child._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-amber-200 transition-colors"
              >
                <div className="p-5">
                  {/* Child info header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700 flex-shrink-0 overflow-hidden">
                      {child.profilePhoto ? (
                        <img
                          src={child.profilePhoto}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        `${child.surname.charAt(0)}${child.firstName.charAt(0)}${child.otherName.charAt(0)}`
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900">
                        {child.surname} {child.firstName} {child.otherName}
                      </h3>
                      <p className="text-sm text-gray-500">{child.currentClass?.name}</p>
                      <p className="text-xs font-mono text-gray-400">{child.admissionNumber}</p>
                    </div>
                  </div>

                  {/* Status + Gender */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {child.studentStatus}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {child.gender}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/parent/reports?studentId=${child._id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Report Cards
                    </Link>

                    {/* Attendance toggle button */}
                    <button
                      onClick={() => toggleAttendance(child._id)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        isAttendanceOpen
                          ? "bg-[#1e3a5f]/5 border-[#1e3a5f]/20 text-[#1e3a5f]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      {isAttendanceOpen ? "Hide" : "View"} Attendance
                      {isAttendanceOpen
                        ? <ChevronUp className="w-3.5 h-3.5 ml-auto" />
                        : <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                      }
                    </button>
                  </div>
                </div>

                {/* Expandable attendance section */}
                {isAttendanceOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30">
                    <AttendanceSection childId={child._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}