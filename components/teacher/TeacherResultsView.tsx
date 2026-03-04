"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Send,
  CheckCircle,
  Save,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ReportStatus } from "@/types/enums";
import { toast } from "sonner";

interface ClassAssignment {
  _id: string;
  class: {
    _id: string;
    name: string;
    section: string;
    subjects: Array<{
      _id: string;
      name: string;
      code: string;
      hasPractical: boolean;
    }>;
  };
  session: {
    _id: string;
    name: string;
    terms: Array<{ _id: string; name: string; status: string }>;
  };
}

interface Student {
  _id: string;
  surname: string
  firstName: string;
  otherName: string;
  admissionNumber: string;
}

interface SubjectScore {
  subject: string;
  subjectName: string;
  subjectCode: string;
  testScore: number;
  examScore: number;
  practicalScore: number;
  hasPractical: boolean;
}

interface ReportDraft {
  studentId: string;
  scores: SubjectScore[];
  attendance: {
    schoolDaysOpen: number;
    daysPresent: number;
    daysAbsent: number;
  };
  teacherComment: string;
  status?: ReportStatus;
  declineReason?: string;
}

export default function TeacherResultsView() {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<ClassAssignment | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReportDraft>>({});
  const [savedReportIds, setSavedReportIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Which student cards are expanded
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set(),
  );
  // Whether the drafts section is collapsed
  const [draftsCollapsed, setDraftsCollapsed] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment && selectedTerm) {
      setExpandedStudents(new Set());
      fetchStudents(selectedAssignment.class._id);
      fetchDrafts(
        selectedAssignment.class._id,
        selectedAssignment.session._id,
        selectedTerm,
      );
    }
  }, [selectedTerm, selectedAssignment]);

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
        if (json.data.length > 0) {
          setSelectedAssignment(json.data[0] ?? null);
          const first = json.data[0];
          if (first?.session?.terms) {
            const activeTerm = first.session.terms.find(
              (t) => t.status === "active",
            );
            setSelectedTerm(
              activeTerm?._id ?? first.session.terms[0]?._id ?? "",
            );
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents(classId: string) {
    const res = await fetch(`/api/teacher/classes/${classId}/students`);
    const json = (await res.json()) as { success: boolean; data?: Student[] };
    if (json.success && json.data) setStudents(json.data);
  }

  async function fetchDrafts(
    classId: string,
    sessionId: string,
    termId: string,
  ) {
    if (!termId) return;
    const res = await fetch(
      `/api/teacher/results?classId=${classId}&termId=${termId}`,
    );
    const json = (await res.json()) as {
      success: boolean;
      data?: Array<{
        _id: string;
        student: string;
        subjects: SubjectScore[];
        attendance: {
          schoolDaysOpen: number;
          daysPresent: number;
          daysAbsent: number;
        };
        teacherComment?: string;
        status: ReportStatus;
        declineReason?: string;
      }>;
    };

    if (json.success && json.data) {
      const loadedDrafts: Record<string, ReportDraft> = {};
      const loadedIds: string[] = [];
      for (const report of json.data) {
        const studentId =
          typeof report.student === "string"
            ? report.student
            : String(report.student);
        loadedDrafts[studentId] = {
          studentId: report.student,
          scores: report.subjects.map((s) => ({ ...s })),
          attendance: report.attendance,
          teacherComment: report.teacherComment ?? "",
          status: report.status,
          declineReason: report.declineReason,
        };
        // ← Only track IDs for reports that can still be submitted
        if (
          report.status === ReportStatus.DRAFT ||
          report.status === ReportStatus.DECLINED
        ) {
          loadedIds.push(report._id);
        }
      }
      setDrafts(loadedDrafts);
      setSavedReportIds(loadedIds); // ← approved IDs never enter this list
    }
  }

  function toggleExpanded(studentId: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function updateScore(
    studentId: string,
    subjectId: string,
    field: keyof SubjectScore,
    value: number,
  ) {
    setDrafts((prev) => {
      const studentDraft = prev[studentId];
      if (!studentDraft) return prev;
      return {
        ...prev,
        [studentId]: {
          ...studentDraft,
          scores: studentDraft.scores.map((s) =>
            s.subject === subjectId ? { ...s, [field]: value } : s,
          ),
        },
      };
    });
  }

  function initStudentDraft(studentId: string) {
    if (drafts[studentId] || !selectedAssignment) return;
    const subjects = selectedAssignment.class.subjects;
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        scores: subjects.map((s) => ({
          subject: s._id,
          subjectName: s.name,
          subjectCode: s.code,
          testScore: 0,
          examScore: 0,
          practicalScore: 0,
          hasPractical: s.hasPractical,
        })),
        attendance: { schoolDaysOpen: 0, daysPresent: 0, daysAbsent: 0 },
        teacherComment: "",
      },
    }));
  }

  async function saveResult(studentId: string) {
    const draft = drafts[studentId];
    if (!draft || !selectedAssignment || !selectedTerm) return;
    setSaving(studentId);
    try {
      const res = await fetch("/api/teacher/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          classId: selectedAssignment.class._id,
          sessionId: selectedAssignment.session._id,
          termId: selectedTerm,
          subjects: draft.scores,
          attendance: draft.attendance,
          teacherComment: draft.teacherComment,
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        data?: { _id?: string };
      };
      if (json.success) {
        toast.success("Result saved as draft");
        if (json.data?._id) {
          setSavedReportIds((prev) =>
            Array.from(new Set([...prev, json.data!._id!])),
          );
        }
        // Collapse the card
        setExpandedStudents((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });

        // ← Refresh from server so approved results stay locked
        if (selectedAssignment && selectedTerm) {
          await fetchDrafts(
            selectedAssignment.class._id,
            selectedAssignment.session._id,
            selectedTerm,
          );
        }
      } else {
        toast.error(json.error ?? "Failed to save");
      }
    } finally {
      setSaving(null);
    }
  }

  async function submitAllForReview() {
    if (savedReportIds.length === 0) {
      toast.error("No draft results to submit");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: savedReportIds }),
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (json.success) {
        toast.success(json.message ?? "Reports submitted for review");
        if (selectedAssignment && selectedTerm) {
          await fetchDrafts(
            selectedAssignment.class._id,
            selectedAssignment.session._id,
            selectedTerm,
          );
        }
      } else {
        toast.error("Failed to submit reports");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Split students into pending and drafted
  const pendingStudents = students.filter((s) => !drafts[s._id]);
  const draftedStudents = students.filter((s) => !!drafts[s._id]);
  const submittedCount = draftedStudents.filter(
    (s) => drafts[s._id]?.status === ReportStatus.SUBMITTED,
  ).length;
  const approvedCount = draftedStudents.filter(
    (s) => drafts[s._id]?.status === ReportStatus.APPROVED,
  ).length;
  const draftCount = draftedStudents.filter(
    (s) => drafts[s._id]?.status === ReportStatus.DRAFT,
  ).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <h2 className="font-display text-lg font-semibold text-gray-600">
          No Classes Assigned
        </h2>
        <p className="text-gray-400 text-sm">
          Contact admin to be assigned to classes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Results & Reports
          </h1>
          <p className="text-gray-500 text-sm">
            Enter student scores and submit for approval
          </p>
        </div>
        <button
          onClick={submitAllForReview}
          disabled={submitting || draftCount === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting
            ? "Submitting..."
            : `Submit ${draftCount > 0 ? `${draftCount} Drafts` : "for Review"}`}
        </button>
      </div>

      {/* Class & Term Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Select Class
            </label>
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <button
                  key={a._id}
                  onClick={() => setSelectedAssignment(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selectedAssignment?._id === a._id
                      ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {a.class.name}
                </button>
              ))}
            </div>
          </div>
          {selectedAssignment && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Select Term
              </label>
              <div className="flex gap-2">
                {selectedAssignment.session.terms.map((term) => (
                  <button
                    key={term._id}
                    onClick={() =>
                      term.status === "active" && setSelectedTerm(term._id)
                    }
                    disabled={term.status !== "active"}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                      selectedTerm === term._id
                        ? "bg-amber-500 text-white border-amber-500"
                        : term.status === "active"
                          ? "border-gray-200 text-gray-600 hover:border-gray-300"
                          : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                    }`}
                  >
                    {term.name} term
                    {term.status === "upcoming" && (
                      <span className="ml-1 text-xs">🔒</span>
                    )}
                    {term.status === "completed" && (
                      <span className="ml-1 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedAssignment && students.length > 0 && (
        <>
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-gray-900">
                {pendingStudents.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pending Entry</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Saved Drafts</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-emerald-700">
                {submittedCount + approvedCount}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Submitted / Approved
              </p>
            </div>
          </div>

          {/* ── PENDING ENTRY SECTION ── */}
          {pendingStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600">
                  Pending Entry ({pendingStudents.length})
                </h2>
              </div>

              {pendingStudents.map((student) => (
                <StudentCard
                  key={student._id}
                  student={student}
                  draft={drafts[student._id]}
                  isExpanded={expandedStudents.has(student._id)}
                  saving={saving === student._id}
                  onToggle={() => {
                    initStudentDraft(student._id);
                    toggleExpanded(student._id);
                  }}
                  onUpdateScore={updateScore}
                  onUpdateAttendance={(field, value) => {
                    setDrafts((prev) => ({
                      ...prev,
                      [student._id]: {
                        ...prev[student._id]!,
                        attendance: {
                          ...prev[student._id]!.attendance,
                          [field]: value,
                        },
                      },
                    }));
                  }}
                  onUpdateComment={(value) => {
                    setDrafts((prev) => ({
                      ...prev,
                      [student._id]: {
                        ...prev[student._id]!,
                        teacherComment: value,
                      },
                    }));
                  }}
                  onSave={() => saveResult(student._id)}
                />
              ))}
            </div>
          )}

          {students.length > 0 &&
            pendingStudents.length === 0 &&
            draftCount === 0 &&
            submittedCount + approvedCount === students.length && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700">
                  All results entered!
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Click &quot;Submit for Review&quot; to send to admin for
                  approval.
                </p>
              </div>
            )}

          {/* ── SAVED DRAFTS SECTION ── */}
          {draftedStudents.length > 0 && (
            <div className="space-y-3">
              {/* Collapsible Header */}
              <button
                onClick={() => setDraftsCollapsed(!draftsCollapsed)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Saved Drafts
                  </span>
                  <div className="flex items-center gap-2">
                    {draftCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {draftCount} draft{draftCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {submittedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {submittedCount} submitted
                      </span>
                    )}
                    {approvedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {approvedCount} approved
                      </span>
                    )}
                  </div>
                </div>
                {draftsCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Drafted Students List */}
              {!draftsCollapsed && (
                <div className="space-y-3">
                  {draftedStudents.map((student) => (
                    <StudentCard
                      key={student._id}
                      student={student}
                      draft={drafts[student._id]}
                      isExpanded={expandedStudents.has(student._id)}
                      saving={saving === student._id}
                      onToggle={() => toggleExpanded(student._id)}
                      onUpdateScore={updateScore}
                      onUpdateAttendance={(field, value) => {
                        setDrafts((prev) => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id]!,
                            attendance: {
                              ...prev[student._id]!.attendance,
                              [field]: value,
                            },
                          },
                        }));
                      }}
                      onUpdateComment={(value) => {
                        setDrafts((prev) => ({
                          ...prev,
                          [student._id]: {
                            ...prev[student._id]!,
                            teacherComment: value,
                          },
                        }));
                      }}
                      onSave={() => saveResult(student._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedAssignment && students.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No students found in this class</p>
        </div>
      )}
    </div>
  );
}

// ── Extracted StudentCard component ─────────────────────────────────────────

interface StudentCardProps {
  student: Student;
  draft?: ReportDraft;
  isExpanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onUpdateScore: (
    studentId: string,
    subjectId: string,
    field: keyof SubjectScore,
    value: number,
  ) => void;
  onUpdateAttendance: (
    field: "schoolDaysOpen" | "daysPresent" | "daysAbsent",
    value: number,
  ) => void;
  onUpdateComment: (value: string) => void;
  onSave: () => void;
}

function StudentCard({
  student,
  draft,
  isExpanded,
  saving,
  onToggle,
  onUpdateScore,
  onUpdateAttendance,
  onUpdateComment,
  onSave,
}: StudentCardProps) {
  const isApproved = draft?.status === ReportStatus.APPROVED;
  const isDeclined = draft?.status === ReportStatus.DECLINED;
  const isLocked = isApproved; // only approved is fully locked

  const attendanceError =
    draft && !isLocked
      ? draft.attendance.daysPresent > draft.attendance.schoolDaysOpen
        ? "Days present cannot exceed school days open"
        : draft.attendance.daysPresent + draft.attendance.daysAbsent >
            draft.attendance.schoolDaysOpen
          ? "Present + absent cannot exceed school days open"
          : null
      : null;

  const statusBadge = () => {
    if (!draft)
      return (
        <span className="text-xs text-gray-400">Click to enter scores</span>
      );
    if (isApproved)
      return (
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    if (isDeclined)
      return (
        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Declined
        </span>
      );
    if (draft.status === ReportStatus.SUBMITTED)
      return (
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          Submitted
        </span>
      );
    if (draft.status === ReportStatus.DRAFT)
      return (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          Saved Draft
        </span>
      );
    return null;
  };

  // Shared input class helpers
  const inputClass = (extra = "") =>
    `${extra} text-sm focus:outline-none ${
      isLocked
        ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
        : "border-gray-200 focus:border-amber-400"
    }`;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
        isDeclined ? "border-red-200" : "border-gray-100"
      }`}
    >
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
              isDeclined
                ? "bg-red-100 text-red-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {student.surname?.charAt(0) ?? "?"}
            {student.firstName?.charAt(0) ?? "?"}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">
              {student.surname} {student.firstName}
            </p>
            <p className="text-xs text-gray-400">{student.admissionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && draft && (
        <div className="border-t border-gray-50 p-4 space-y-4">
          {/* ── Decline Reason Banner ── */}
          {isDeclined && draft.declineReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 mb-0.5">
                  Declined by Admin
                </p>
                <p className="text-xs text-red-600">{draft.declineReason}</p>
                <p className="text-xs text-red-400 mt-1">
                  Please correct the issues above and save again.
                </p>
              </div>
            </div>
          )}

          {/* ── Approved Banner ── */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-0.5">
                  Report Approved
                </p>
                <p className="text-xs text-emerald-600">
                  This report has been approved and is no longer editable.
                </p>
              </div>
            </div>
          )}

          {/* Attendance */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Attendance
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  School Days Open
                </label>
                <input
                  type="number"
                  min={0}
                  value={draft.attendance.schoolDaysOpen}
                  readOnly={isLocked}
                  onChange={(e) => {
                    if (isLocked) return;
                    const val = parseInt(e.target.value) || 0;
                    onUpdateAttendance("schoolDaysOpen", val);
                    onUpdateAttendance(
                      "daysAbsent",
                      Math.max(0, val - draft.attendance.daysPresent),
                    );
                  }}
                  className={inputClass("w-full px-2 py-1.5 rounded-lg border")}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Days Present
                </label>
                <input
                  type="number"
                  min={0}
                  max={draft.attendance.schoolDaysOpen}
                  value={draft.attendance.daysPresent}
                  readOnly={isLocked}
                  onChange={(e) => {
                    if (isLocked) return;
                    const val = Math.min(
                      draft.attendance.schoolDaysOpen,
                      Math.max(0, parseInt(e.target.value) || 0),
                    );
                    onUpdateAttendance("daysPresent", val);
                    onUpdateAttendance(
                      "daysAbsent",
                      Math.max(0, draft.attendance.schoolDaysOpen - val),
                    );
                  }}
                  className={inputClass(
                    `w-full px-2 py-1.5 rounded-lg border ${attendanceError ? "border-red-300" : ""}`,
                  )}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Days Absent <span className="text-gray-300">(auto)</span>
                </label>
                <input
                  type="number"
                  value={draft.attendance.daysAbsent}
                  readOnly
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            {attendanceError && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {attendanceError}
              </p>
            )}
          </div>

          {/* Subject Scores */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Subject Scores
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs text-gray-500">
                      Subject
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">
                      Test
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">
                      Exam
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">
                      Practical (20)
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {draft.scores.map((score) => {
                    const total =
                      score.testScore +
                      score.examScore +
                      (score.hasPractical ? score.practicalScore : 0);
                    const maxTotal = 100;
                    return (
                      <tr key={score.subject}>
                        <td className="px-3 py-2 font-medium text-gray-700">
                          {score.subjectName}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={score.hasPractical ? 20 : 30}
                              value={score.testScore}
                              readOnly={isLocked}
                              onChange={(e) => {
                                if (isLocked) return;
                                onUpdateScore(
                                  student._id,
                                  score.subject,
                                  "testScore",
                                  Math.min(
                                    score.hasPractical ? 20 : 30,
                                    Math.max(0, parseInt(e.target.value) || 0),
                                  ),
                                );
                              }}
                              className={inputClass(
                                "w-16 text-center px-2 py-1 rounded border",
                              )}
                            />
                            <span className="text-xs text-gray-400">
                              /{score.hasPractical ? 20 : 30}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={score.hasPractical ? 60 : 70}
                              value={score.examScore}
                              readOnly={isLocked}
                              onChange={(e) => {
                                if (isLocked) return;
                                onUpdateScore(
                                  student._id,
                                  score.subject,
                                  "examScore",
                                  Math.min(
                                    score.hasPractical ? 60 : 70,
                                    Math.max(0, parseInt(e.target.value) || 0),
                                  ),
                                );
                              }}
                              className={inputClass(
                                "w-16 text-center px-2 py-1 rounded border",
                              )}
                            />
                            <span className="text-xs text-gray-400">
                              /{score.hasPractical ? 60 : 70}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {score.hasPractical ? (
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={score.practicalScore}
                              readOnly={isLocked}
                              onChange={(e) => {
                                if (isLocked) return;
                                onUpdateScore(
                                  student._id,
                                  score.subject,
                                  "practicalScore",
                                  Math.min(
                                    20,
                                    Math.max(0, parseInt(e.target.value) || 0),
                                  ),
                                );
                              }}
                              className={inputClass(
                                "w-16 text-center px-2 py-1 rounded border",
                              )}
                            />
                          ) : (
                            <span className="text-gray-300 text-sm pl-4">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`font-bold ${total < maxTotal * 0.5 ? "text-red-600" : "text-[#1e3a5f]"}`}
                          >
                            {total}/{maxTotal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Teacher&apos;s Comment
            </label>
            <input
              value={draft.teacherComment}
              readOnly={isLocked}
              onChange={(e) => {
                if (!isLocked) onUpdateComment(e.target.value);
              }}
              placeholder="e.g. Excellent performance this term..."
              className={inputClass("w-full px-3 py-2 rounded-xl border")}
            />
          </div>

          {/* Save Button — hidden if approved, shown for draft AND declined */}
          {!isApproved && (
            <button
              onClick={onSave}
              disabled={saving || !!attendanceError}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving
                ? "Saving..."
                : isDeclined
                  ? "Save & Resubmit"
                  : "Save Result"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
