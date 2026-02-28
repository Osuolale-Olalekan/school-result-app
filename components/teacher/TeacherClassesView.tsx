"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import Link from "next/link";

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
    terms: Array<{ _id: string; name: string; status: string }>;
  };
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: string;
  studentStatus: string;
}

const SECTION_LABELS: Record<string, string> = {
  primary: "Primary School",
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

export default function TeacherClassesView() {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [students, setStudents] = useState<Record<string, Student[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/classes");
      const json = await res.json() as { success: boolean; data?: ClassAssignment[] };
      if (json.success && json.data) {
        setAssignments(json.data);
        // Auto-expand first active
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
        const json = await res.json() as { success: boolean; data?: Student[] };
        if (json.success && json.data) {
          setStudents((prev) => ({ ...prev, [classId]: json.data! }));
        }
      } finally {
        setLoadingStudents(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-6 w-40 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <h2 className="font-display text-lg font-semibold text-gray-600">No Classes Assigned</h2>
        <p className="text-gray-400 text-sm mt-1">Contact your administrator to assign you to classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-500 text-sm">{assignments.length} class{assignments.length !== 1 ? "es" : ""} assigned this session</p>
        </div>
        <Link
          href="/teacher/results"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847]"
        >
          Enter Results →
        </Link>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const isExpanded = expanded === assignment._id;
          const classStudents = students[assignment.class._id] ?? [];
          const isLoadingThis = loadingStudents === assignment.class._id;
          const activeTerm = assignment.session.terms.find((t) => t.status === "active") ?? assignment.session.terms[0];

          return (
            <div key={assignment._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors text-left"
                onClick={() => toggleClass(assignment._id, assignment.class._id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-gray-900">{assignment.class.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-500 capitalize">
                        {SECTION_LABELS[assignment.class.section] ?? assignment.class.section}
                      </span>
                      {assignment.class.department !== "none" && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-sm text-gray-500 capitalize">{assignment.class.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Session</p>
                      <p className="text-sm font-medium text-gray-700">{assignment.session.name}</p>
                    </div>
                    {activeTerm && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Current Term</p>
                        <p className="text-sm font-medium text-gray-700 capitalize">{activeTerm.name}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Subjects</p>
                      <p className="text-sm font-medium text-gray-700">{assignment.class.subjects.length}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 `flex-shrink-0`" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 `flex-shrink-0`" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-50">
                  {/* Subjects row */}
                  <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/30">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.class.subjects.map((subj) => (
                        <span key={subj._id} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium">
                          {subj.name}
                        </span>
                      ))}
                      {assignment.class.subjects.length === 0 && (
                        <span className="text-xs text-gray-400">No subjects assigned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Students list */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Students {classStudents.length > 0 && `(${classStudents.length})`}
                      </p>
                    </div>

                    {isLoadingThis ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : classStudents.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No students enrolled yet</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {classStudents.map((student, idx) => (
                          <div
                            key={student._id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-xs text-gray-400 w-5 text-right `flex-shrink-0`">{idx + 1}.</span>
                            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0`">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">{student.admissionNumber}</p>
                            </div>
                          </div>
                        ))}
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
