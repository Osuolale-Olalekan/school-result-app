"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import AttendanceTab from "@/components/teacher/AttendanceTab";

interface TermOption {
  _id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface ClassAssignment {
  _id: string;
  class: {
    _id: string;
    name: string;
    section: string;
    department: string;
    subjects: Array<{ _id: string; name: string; code: string }>;
  };
  session: {
    _id: string;
    name: string;
    status: string;
    terms: TermOption[];
  };
}

interface Student {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  gender: string;
  studentStatus: string;
}

type ClassTab = "students" | "attendance";

const SECTION_LABELS: Record<string, string> = {
  primary: "Primary",
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

// ─── Term detection ───────────────────────────────────────────────────────────
function detectCurrentTerm(terms: TermOption[]): TermOption | undefined {
  if (!terms || terms.length === 0) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate = terms.find((t) => {
    if (!t.startDate || !t.endDate) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });
  if (byDate) return byDate;

  const byStatus = terms.find((t) => t.status === "active");
  if (byStatus) return byStatus;

  const ended = terms
    .filter((t) => t.endDate && new Date(t.endDate) < today)
    .sort(
      (a, b) =>
        new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime()
    );
  if (ended.length > 0) return ended[0];

  return terms[0];
}

const genderStyles: Record<string, string> = {
  female: "bg-pink-100 text-pink-700",
  male: "bg-blue-100 text-blue-700",
};

export default function TeacherClassesView() {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [students, setStudents] = useState<Record<string, Student[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, ClassTab>>({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/classes");
      const json = (await res.json()) as {
        success: boolean;
        data?: ClassAssignment[];
      };
      if (json.success && json.data) {
        setAssignments(json.data);
        const first = json.data[0];
        if (first) setExpanded(first._id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleClass(assignmentId: string, classId: string) {
    if (expanded === assignmentId) {
      setExpanded(null);
      return;
    }
    setExpanded(assignmentId);
    if (!students[classId]) {
      setLoadingStudents(classId);
      try {
        const res = await fetch(`/api/teacher/classes/${classId}/students`);
        const json = (await res.json()) as {
          success: boolean;
          data?: Student[];
        };
        if (json.success && json.data) {
          setStudents((prev) => ({ ...prev, [classId]: json.data! }));
        }
      } finally {
        setLoadingStudents(null);
      }
    }
  }

  function getTab(assignmentId: string): ClassTab {
    return activeTab[assignmentId] ?? "students";
  }

  function setTab(assignmentId: string, tab: ClassTab) {
    setActiveTab((prev) => ({ ...prev, [assignmentId]: tab }));
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 px-0">
        <div className="h-7 w-36 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="font-semibold text-lg text-gray-700">
          No Classes Assigned
        </h2>
        <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
          Contact your administrator to assign you to classes.
        </p>
      </div>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-xl text-gray-900 leading-tight">
            My Classes
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {assignments.length} class{assignments.length !== 1 ? "es" : ""}{" "}
            assigned this session
          </p>
        </div>
        <Link
          href="/teacher/results"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e3a5f] text-white text-xs font-semibold hover:bg-[#152847] transition-colors flex-shrink-0 whitespace-nowrap"
        >
          Results
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Class cards */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const isExpanded = expanded === assignment._id;
          const classStudents = students[assignment.class._id] ?? [];
          const isLoadingThis = loadingStudents === assignment.class._id;
          const currentTab = getTab(assignment._id);
          const detectedTerm = detectCurrentTerm(assignment.session.terms);

          return (
            <div
              key={assignment._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0"
            >
              {/* ── Card header / toggle ── */}
              <button
                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50/60 transition-colors text-left min-w-0"
                onClick={() =>
                  toggleClass(assignment._id, assignment.class._id)
                }
              >
                {/* Left: icon + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-gray-900 truncate leading-tight">
                      {assignment.class.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {SECTION_LABELS[assignment.class.section] ??
                        assignment.class.section}
                      {assignment.class.department !== "none" && (
                        <span className="capitalize">
                          {" "}
                          · {assignment.class.department}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: meta pills + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Session/term meta — hidden on very small screens */}
                  <div className="hidden xs:flex flex-col items-end gap-0.5">
                    <span className="text-[11px] text-gray-400">
                      {assignment.session.name}
                    </span>
                    {detectedTerm && (
                      <span className="text-[11px] font-medium text-[#1e3a5f] capitalize">
                        {detectedTerm.name}
                      </span>
                    )}
                  </div>

                  {/* Subjects count badge */}
                  <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[11px] font-medium">
                    {assignment.class.subjects.length} subj
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* ── Expanded content ── */}
              {isExpanded && (
                <div className="border-t border-gray-100 min-w-0">
                  {/* Session/term info row — shown only on very small screens */}
                  <div className="xs:hidden flex items-center gap-3 px-4 py-2.5 bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                    <span>
                      Session:{" "}
                      <strong className="text-gray-700">
                        {assignment.session.name}
                      </strong>
                    </span>
                    {detectedTerm && (
                      <span>
                        Term:{" "}
                        <strong className="text-[#1e3a5f] capitalize">
                          {detectedTerm.name}
                        </strong>
                      </span>
                    )}
                    <span>
                      Subjects:{" "}
                      <strong className="text-gray-700">
                        {assignment.class.subjects.length}
                      </strong>
                    </span>
                  </div>

                  {/* Subjects strip */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Subjects
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {assignment.class.subjects.map((subj) => (
                        <span
                          key={subj._id}
                          className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-medium leading-none"
                        >
                          {subj.name}
                        </span>
                      ))}
                      {assignment.class.subjects.length === 0 && (
                        <span className="text-xs text-gray-400">
                          No subjects assigned yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tab bar */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setTab(assignment._id, "students")}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 justify-center sm:flex-none sm:justify-start ${
                        currentTab === "students"
                          ? "border-[#1e3a5f] text-[#1e3a5f]"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>Students</span>
                      {classStudents.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium leading-none">
                          {classStudents.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setTab(assignment._id, "attendance")}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 justify-center sm:flex-none sm:justify-start ${
                        currentTab === "attendance"
                          ? "border-[#1e3a5f] text-[#1e3a5f]"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>Attendance</span>
                    </button>
                  </div>

                  {/* Tab content */}
                  <div className="p-3 sm:p-4 min-w-0 w-full overflow-x-hidden">
                    {/* ── Students tab ── */}
                    {currentTab === "students" && (
                      <>
                        {isLoadingThis ? (
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-12 bg-gray-100 rounded-xl animate-pulse"
                              />
                            ))}
                          </div>
                        ) : classStudents.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No students enrolled yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2">
                            {classStudents.map((student, idx) => (
                              <div
                                key={student._id}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors min-w-0"
                              >
                                <span className="text-[11px] text-gray-400 w-4 text-right flex-shrink-0 tabular-nums">
                                  {idx + 1}.
                                </span>
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 uppercase ${
                                    genderStyles[student.gender] ??
                                    "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {student.surname.charAt(0)}
                                  {student.firstName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                                    {student.surname} {student.firstName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-mono truncate leading-tight mt-0.5">
                                    {student.admissionNumber}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Attendance tab ── */}
                    {currentTab === "attendance" && (
                      <div className="w-full min-w-0 overflow-x-hidden">
                        {detectedTerm ? (
                          <AttendanceTab
                            classId={assignment.class._id}
                            sessionId={assignment.session._id}
                            terms={assignment.session.terms}
                            defaultTerm={detectedTerm}
                            className={assignment.class.name}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                              No terms found for this session.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}