"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  CalendarDays,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Search,
  BookOpen,
  BarChart3,
  Shield,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TermOption {
  _id: string;
  name: string;
  status: string;
}

interface ClassSummary {
  classId: string;
  className: string;
  section: string;
  department: string;
  totalStudents: number;
  totalDaysMarked: number;
  schoolDaysOpen: number;
  averageAttendance: number;
  studentsBelow75: number;
  hasData: boolean;
}

interface StudentSummary {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  gender: string;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysExcused: number;
  attendancePercentage: number;
  totalDaysMarked: number;
  schoolDaysOpen: number;
}

interface ClassesData {
  mode: "classes";
  sessionId: string;
  sessionName: string;
  termName: string;
  terms: TermOption[];
  classes: ClassSummary[];
}

interface StudentsData {
  mode: "students";
  sessionName: string;
  termName: string;
  totalDaysMarked: number;
  schoolDaysOpen: number;
  students: StudentSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  primary: "Primary",
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

function getAttendanceColor(pct: number) {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (pct >= 75) return { bar: "bg-amber-400",   text: "text-amber-700",   badge: "bg-amber-50 text-amber-700 border-amber-200"       };
  return               { bar: "bg-red-500",       text: "text-red-700",     badge: "bg-red-50 text-red-700 border-red-200"             };
}

function AttendanceBadge({ pct }: { pct: number }) {
  const colors = getAttendanceColor(pct);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors.badge}`}>
      {pct >= 90 ? <TrendingUp className="w-3 h-3" /> : pct < 75 ? <TrendingDown className="w-3 h-3" /> : null}
      {pct}%
    </span>
  );
}

function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  const colors = getAttendanceColor(pct);
  return (
    <div className={`w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${colors.bar}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

const SECTION_ORDER = { primary: 0, jss: 1, sss: 2 };

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAttendanceView() {
  const [classesData, setClassesData] = useState<ClassesData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentsData | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [drilldownClass, setDrilldownClass] = useState<ClassSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillLoading, setDrillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── Fetch class overview ──────────────────────────────────────────────────

  const fetchOverview = useCallback(async (term?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = term
        ? `/api/admin/attendance?term=${term}`
        : `/api/admin/attendance`;
      const res = await fetch(url);
      const json = (await res.json()) as { success: boolean; data?: ClassesData; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load");
      setClassesData(json.data);
      if (!selectedTerm) setSelectedTerm(json.data.termName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    void fetchOverview();
  }, []);

  // ── Fetch student drilldown ───────────────────────────────────────────────

  async function drillIntoClass(cls: ClassSummary) {
    setDrilldownClass(cls);
    setDrillLoading(true);
    setSearch("");
    try {
      const term = selectedTerm || classesData?.termName;
      const url  = `/api/admin/attendance?classId=${cls.classId}${term ? `&term=${term}` : ""}`;
      const res  = await fetch(url);
      const json = (await res.json()) as { success: boolean; data?: StudentsData; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed");
      setStudentsData(json.data);
    } catch {
      setStudentsData(null);
    } finally {
      setDrillLoading(false);
    }
  }

  function goBack() {
    setDrilldownClass(null);
    setStudentsData(null);
    setSearch("");
  }

  function switchTerm(termName: string) {
    setSelectedTerm(termName);
    void fetchOverview(termName);
    // If drilled in, re-fetch for that class too
    if (drilldownClass) {
      setDrillLoading(true);
      fetch(`/api/admin/attendance?classId=${drilldownClass.classId}&term=${termName}`)
        .then((r) => r.json())
        .then((json: { success: boolean; data?: StudentsData }) => {
          if (json.success && json.data) setStudentsData(json.data);
        })
        .finally(() => setDrillLoading(false));
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const filteredStudents = (studentsData?.students ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.surname.toLowerCase().includes(q) ||
      s.firstName.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q)
    );
  });

  const classesWithData  = classesData?.classes.filter((c) => c.hasData) ?? [];
  const classesNoData    = classesData?.classes.filter((c) => !c.hasData) ?? [];
  const schoolAverage    = classesWithData.length > 0
    ? Math.round(classesWithData.reduce((s, c) => s + c.averageAttendance, 0) / classesWithData.length)
    : 0;
  const totalBelow75     = classesWithData.reduce((s, c) => s + c.studentsBelow75, 0);

  // Group classes by section
  const grouped = classesWithData.reduce((acc, cls) => {
    if (!acc[cls.section]) acc[cls.section] = [];
    acc[cls.section]!.push(cls);
    return acc;
  }, {} as Record<string, ClassSummary[]>);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[0,1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {drilldownClass && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {drilldownClass ? `${drilldownClass.className} — Attendance` : "Attendance Overview"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {classesData?.sessionName} · {selectedTerm || classesData?.termName} Term
            </p>
          </div>
        </div>

        {/* Term switcher */}
        {classesData?.terms && classesData.terms.length > 0 && (
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            {classesData.terms.map((t) => (
              <button
                key={t._id}
                onClick={() => switchTerm(t.name)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  (selectedTerm || classesData.termName) === t.name
                    ? "bg-[#1e3a5f] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary cards (class overview only) ──────────────────────────── */}
      {!drilldownClass && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-[#1e3a5f]" />
              <span className="text-xs font-semibold text-gray-400 uppercase">School Average</span>
            </div>
            <p className={`text-3xl font-bold ${getAttendanceColor(schoolAverage).text}`}>
              {schoolAverage}%
            </p>
            <ProgressBar pct={schoolAverage} className="mt-2" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
              <span className="text-xs font-semibold text-gray-400 uppercase">Classes Tracked</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{classesWithData.length}</p>
            <p className="text-xs text-gray-400 mt-1">{classesNoData.length} with no data yet</p>
          </div>

          <div className={`rounded-2xl border shadow-sm p-4 ${totalBelow75 > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`w-4 h-4 ${totalBelow75 > 0 ? "text-red-600" : "text-emerald-600"}`} />
              <span className={`text-xs font-semibold uppercase ${totalBelow75 > 0 ? "text-red-500" : "text-emerald-500"}`}>Below 75%</span>
            </div>
            <p className={`text-3xl font-bold ${totalBelow75 > 0 ? "text-red-700" : "text-emerald-700"}`}>{totalBelow75}</p>
            <p className={`text-xs mt-1 ${totalBelow75 > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {totalBelow75 > 0 ? "students need attention" : "all students on track"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-[#1e3a5f]" />
              <span className="text-xs font-semibold text-gray-400 uppercase">Days Tracked</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {classesWithData[0]?.totalDaysMarked ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              of {classesWithData[0]?.schoolDaysOpen || "—"} school days
            </p>
          </div>
        </div>
      )}

      {/* ── Class overview grid ───────────────────────────────────────────── */}
      {!drilldownClass && (
        <div className="space-y-5">
          {classesWithData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No attendance data yet</p>
              <p className="text-sm mt-1">Teachers need to start marking attendance for this term.</p>
            </div>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => (SECTION_ORDER[a as keyof typeof SECTION_ORDER] ?? 9) - (SECTION_ORDER[b as keyof typeof SECTION_ORDER] ?? 9))
              .map(([section, sectionClasses]) => (
                <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Section header */}
                  <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-600">
                      {SECTION_LABELS[section] ?? section}
                    </h3>
                    <span className="text-xs text-gray-400">{sectionClasses.length} classes</span>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {sectionClasses.map((cls) => {
                      const colors = getAttendanceColor(cls.averageAttendance);
                      return (
                        <button
                          key={cls.classId}
                          onClick={() => drillIntoClass(cls)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left group"
                        >
                          {/* Class icon */}
                          <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-[#1e3a5f]/60" />
                          </div>

                          {/* Class info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900">{cls.className}</p>
                              {cls.department !== "none" && (
                                <span className="text-xs text-gray-400 capitalize">({cls.department})</span>
                              )}
                              {cls.studentsBelow75 > 0 && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  {cls.studentsBelow75} below 75%
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <ProgressBar pct={cls.averageAttendance} className="flex-1 max-w-[200px]" />
                              <span className="text-xs text-gray-400">
                                {cls.totalDaysMarked} days marked · {cls.totalStudents} students
                              </span>
                            </div>
                          </div>

                          {/* Attendance badge + arrow */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <AttendanceBadge pct={cls.averageAttendance} />
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
          )}

          {/* Classes with no attendance data yet */}
          {classesNoData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-60">
              <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
                <h3 className="text-sm font-semibold text-gray-400">No attendance data yet</h3>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {classesNoData.map((cls) => (
                  <span key={cls.classId} className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-400">
                    {cls.className}{cls.department !== "none" ? ` (${cls.department})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Student drilldown ─────────────────────────────────────────────── */}
      {drilldownClass && (
        <div className="space-y-4">
          {/* Drilldown summary */}
          {studentsData && !drillLoading && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{drilldownClass.totalStudents}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Students</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold ${getAttendanceColor(drilldownClass.averageAttendance).text}`}>
                  {drilldownClass.averageAttendance}%
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Class Average</p>
              </div>
              <div className={`rounded-2xl border shadow-sm p-4 text-center ${drilldownClass.studentsBelow75 > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                <p className={`text-2xl font-bold ${drilldownClass.studentsBelow75 > 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {drilldownClass.studentsBelow75}
                </p>
                <p className={`text-xs mt-0.5 ${drilldownClass.studentsBelow75 > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  Below 75%
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>

          {/* Student list */}
          {drillLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
              <span className="ml-3 text-sm text-gray-400">Loading students...</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_repeat(4,_auto)] items-center gap-3 px-5 py-3 bg-[#1e3a5f] text-white text-xs font-semibold rounded-t-2xl">
                <span className="w-6">#</span>
                <span>Student</span>
                <span className="w-16 text-center">Present</span>
                <span className="w-14 text-center">Absent</span>
                <span className="w-14 text-center">Late</span>
                <span className="w-20 text-center">Attendance</span>
              </div>

              <div className="divide-y divide-gray-50">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No students found</p>
                  </div>
                ) : (
                  filteredStudents
                    .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
                    .map((student, idx) => {
                      const colors = getAttendanceColor(student.attendancePercentage);
                      const isLow  = student.attendancePercentage < 75;
                      return (
                        <div
                          key={student._id}
                          className={`grid grid-cols-[auto_1fr_repeat(4,_auto)] items-center gap-3 px-5 py-3.5 ${isLow ? "bg-red-50/40" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          <span className="text-xs text-gray-300 w-6 text-right">{idx + 1}</span>

                          {/* Student info */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              student.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {student.surname.charAt(0)}{student.firstName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {student.surname} {student.firstName}
                                {student.otherName ? ` ${student.otherName}` : ""}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">{student.admissionNumber}</p>
                            </div>
                            {isLow && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            )}
                          </div>

                          {/* Stats */}
                          <span className="text-sm font-semibold text-emerald-700 w-16 text-center">{student.daysPresent}</span>
                          <span className="text-sm font-semibold text-red-500 w-14 text-center">{student.daysAbsent}</span>
                          <span className="text-sm font-semibold text-amber-600 w-14 text-center">{student.daysLate}</span>

                          {/* Attendance % */}
                          <div className="w-20 flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {student.attendancePercentage}%
                            </span>
                            <ProgressBar pct={student.attendancePercentage} className="w-full" />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              {filteredStudents.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} · sorted by attendance
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> ≥90% excellent</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-amber-500" /> ≥75% good</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> &lt;75% needs attention</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}