"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Send, CheckCircle, Save, ChevronDown, ChevronUp,
  Clock, AlertCircle, Sparkles, CalendarDays, Loader2, XCircle,
} from "lucide-react";
import { ReportStatus } from "@/types/enums";
import { toast } from "sonner";

interface ClassAssignment {
  _id: string;
  class: {
    _id: string;
    name: string;
    section: string;
    subjects: Array<{ _id: string; name: string; code: string; hasPractical: boolean; department: string }>;
  };
  session: { _id: string; name: string; terms: Array<{ _id: string; name: string; status: string }> };
}

interface Student {
  _id: string; surname: string; firstName: string; otherName: string;
  admissionNumber: string; department: string;
}

interface SubjectScore {
  subject: string; subjectName: string; subjectCode: string;
  testScore: number; examScore: number; practicalScore: number;
  hasPractical: boolean;
  excludedThisTerm?: boolean; // teacher-level override
}

interface ReportDraft {
  studentId: string;
  scores: SubjectScore[];
  attendance: { schoolDaysOpen: number; daysPresent: number; daysAbsent: number };
  teacherComment: string;
  status?: ReportStatus;
  declineReason?: string;
}

interface AttendanceSummary {
  schoolDaysOpen: number; daysPresent: number; daysAbsent: number;
}

async function fetchAttendanceSummary(
  classId: string, sessionId: string, termId: string, termName: string, studentId: string,
): Promise<AttendanceSummary | null> {
  try {
    const res  = await fetch(`/api/teacher/attendance/summary?classId=${classId}&sessionId=${sessionId}&term=${termName}&termId=${termId}&studentId=${studentId}`);
    const json = (await res.json()) as { success: boolean; data?: AttendanceSummary };
    console.log("attendance summary response:", json); // ADD THIS
    return json.success && json.data ? json.data : null;
  } catch { return null; }
}

export default function TeacherResultsView() {
  const [assignments, setAssignments]             = useState<ClassAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ClassAssignment | null>(null);
  const [selectedTerm, setSelectedTerm]           = useState<string>("");
  const [students, setStudents]                   = useState<Student[]>([]);
  const [drafts, setDrafts]                       = useState<Record<string, ReportDraft>>({});
  const [savedReportIds, setSavedReportIds]       = useState<string[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [saving, setSaving]                       = useState<string | null>(null);
  const [submitting, setSubmitting]               = useState(false);
  const [expandedStudents, setExpandedStudents]   = useState<Set<string>>(new Set());
  const [draftsCollapsed, setDraftsCollapsed]     = useState(true);
  const [attendanceFetched, setAttendanceFetched] = useState<Set<string>>(new Set());
  const [fetchingAttendance, setFetchingAttendance] = useState<Set<string>>(new Set());
  // Admin-excluded subjects for selected class/term
  const [adminExcludedIds, setAdminExcludedIds]   = useState<Set<string>>(new Set());
  const [loadingSchedule, setLoadingSchedule]     = useState(false);

  useEffect(() => { fetchAssignments(); }, []);

  useEffect(() => {
    if (selectedAssignment && selectedTerm) {
      setExpandedStudents(new Set());
      setAttendanceFetched(new Set());
      setAdminExcludedIds(new Set());
      fetchSubjectSchedule(selectedAssignment.class._id, selectedAssignment.session._id, selectedTerm);
      fetchStudents(selectedAssignment.class._id).then((freshStudents) => {
        fetchDrafts(
          selectedAssignment.class._id, selectedAssignment.session._id,
          selectedTerm, freshStudents ?? [], selectedAssignment,
        );
      });
    }
  }, [selectedTerm, selectedAssignment]);

  useEffect(() => {
  expandedStudents.forEach((studentId) => {
    if (!attendanceFetched.has(studentId) && !fetchingAttendance.has(studentId) && drafts[studentId]) {
      autoFillAttendance(studentId);
    }
  });
}, [expandedStudents, drafts]);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res  = await fetch("/api/teacher/classes");
      const json = (await res.json()) as { success: boolean; data?: ClassAssignment[] };
      if (json.success && json.data) {
        setAssignments(json.data);
        if (json.data.length > 0) {
          setSelectedAssignment(json.data[0] ?? null);
          const first = json.data[0];
          if (first?.session?.terms) {
            const activeTerm = first.session.terms.find((t) => t.status === "active");
            setSelectedTerm(activeTerm?._id ?? first.session.terms[0]?._id ?? "");
          }
        }
      }
    } finally { setLoading(false); }
  }

  async function fetchSubjectSchedule(classId: string, sessionId: string, termId: string) {
    // Get term name from selectedAssignment
    const termObj = selectedAssignment?.session.terms.find((t) => t._id === termId);
    if (!termObj) return;
    setLoadingSchedule(true);
    try {
      const res  = await fetch(`/api/teacher/subject-schedule?classId=${classId}&sessionId=${sessionId}&term=${termObj.name}`);
      const json = (await res.json()) as { success: boolean; data?: { excludedSubjectIds: string[] } };
      if (json.success && json.data) {
        setAdminExcludedIds(new Set(json.data.excludedSubjectIds));
      }
    } catch { /* silently fail */ } finally { setLoadingSchedule(false); }
  }

  async function fetchStudents(classId: string) {
    const res  = await fetch(`/api/teacher/classes/${classId}/students`);
    const json = (await res.json()) as { success: boolean; data?: Student[] };
    if (json.success && json.data) { setStudents(json.data); return json.data; }
    return [];
  }

  async function fetchDrafts(
    classId: string, sessionId: string, termId: string,
    freshStudents: Student[], assignment: ClassAssignment,
  ) {
    if (!termId) return;
    const res  = await fetch(`/api/teacher/results?classId=${classId}&termId=${termId}`);
    const json = (await res.json()) as {
      success: boolean;
      data?: Array<{
        _id: string; student: string;
        subjects: SubjectScore[];
        attendance: { schoolDaysOpen: number; daysPresent: number; daysAbsent: number };
        teacherComment?: string; status: ReportStatus; declineReason?: string;
      }>;
    };

    if (json.success && json.data) {
      const loadedDrafts: Record<string, ReportDraft> = {};
      const loadedIds: string[] = [];

      for (const report of json.data) {
        const studentId = typeof report.student === "string" ? report.student : String(report.student);
        const student   = freshStudents.find((s) => s._id === studentId);
        const hasNoDept = !student?.department || student.department === "none" || student.department === "general";
        const allSubjects = assignment.class.subjects ?? [];
        const relevantSubjects = hasNoDept ? allSubjects : allSubjects.filter(
          (s) => s.department === "general" || s.department === "none" || !s.department || s.department === student?.department
        );
        const savedScoreMap = new Map(report.subjects.map((s) => [s.subject, s]));
        const mergedScores = relevantSubjects.map((s) => {
          const saved = savedScoreMap.get(s._id);
          return {
            subject: s._id, subjectName: s.name, subjectCode: s.code, hasPractical: s.hasPractical,
            testScore: saved?.testScore ?? 0, examScore: saved?.examScore ?? 0,
            practicalScore: saved?.practicalScore ?? 0,
            excludedThisTerm: false, // teacher can re-exclude on re-edit
          };
        });

        loadedDrafts[studentId] = {
  studentId: report.student,
  scores: mergedScores,
  attendance: {
    schoolDaysOpen: report.attendance?.schoolDaysOpen || 0,
    daysPresent:    report.attendance?.daysPresent    || 0,
    daysAbsent:     report.attendance?.daysAbsent     || 0,
  },
  teacherComment: report.teacherComment ?? "",
  status: report.status,
  declineReason: report.declineReason,
};
        if (report.status === ReportStatus.DRAFT || report.status === ReportStatus.DECLINED) {
          loadedIds.push(report._id);
        }
      }
      setDrafts(loadedDrafts);
      setSavedReportIds(loadedIds);
    }
  }

  function toggleExpanded(studentId: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
      return next;
    });
  }

  async function autoFillAttendance(studentId: string) {
  if (!selectedAssignment || !selectedTerm || fetchingAttendance.has(studentId)) return;
  const termObj = selectedAssignment.session.terms.find((t) => t._id === selectedTerm);
  if (!termObj) return;

  setFetchingAttendance((prev) => new Set(prev).add(studentId));
  const summary = await fetchAttendanceSummary(
    selectedAssignment.class._id, selectedAssignment.session._id,
    selectedTerm, termObj.name, studentId,
  );
  setFetchingAttendance((prev) => { const next = new Set(prev); next.delete(studentId); return next; });
  setAttendanceFetched((prev) => new Set(prev).add(studentId));

  if (!summary) return;

  setDrafts((prev) => {
    const existing = prev[studentId];
    if (!existing) return prev;
    // Only fill if not already manually set
    if (existing.attendance.schoolDaysOpen > 0) return prev;
    return {
      ...prev,
      [studentId]: {
        ...existing,
        attendance: {
          schoolDaysOpen: summary.schoolDaysOpen,
          daysPresent: summary.daysPresent,
          daysAbsent: summary.daysAbsent,
        },
      },
    };
  });
}

  function updateScore(studentId: string, subjectId: string, field: keyof SubjectScore, value: number) {
    setDrafts((prev) => {
      const studentDraft = prev[studentId];
      if (!studentDraft) return prev;
      return { ...prev, [studentId]: { ...studentDraft, scores: studentDraft.scores.map((s) => s.subject === subjectId ? { ...s, [field]: value } : s) } };
    });
  }

  // Toggle teacher-level subject exclusion
  function toggleSubjectExclusion(studentId: string, subjectId: string) {
    setDrafts((prev) => {
      const studentDraft = prev[studentId];
      if (!studentDraft) return prev;
      return {
        ...prev,
        [studentId]: {
          ...studentDraft,
          scores: studentDraft.scores.map((s) =>
            s.subject === subjectId ? { ...s, excludedThisTerm: !s.excludedThisTerm } : s
          ),
        },
      };
    });
  }

  function initStudentDraft(studentId: string) {
    if (drafts[studentId] || !selectedAssignment) return;
    const student     = students.find((s) => s._id === studentId);
    const allSubjects = selectedAssignment.class.subjects;
    const hasNoDept   = !student?.department || student.department === "none" || student.department === "general";
    const studentSubjects = hasNoDept ? allSubjects : allSubjects.filter(
      (s) => s.department === "general" || s.department === "none" || !s.department || s.department === student.department
    );
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        scores: studentSubjects.map((s) => ({
          subject: s._id, subjectName: s.name, subjectCode: s.code,
          testScore: 0, examScore: 0, practicalScore: 0, hasPractical: s.hasPractical,
          excludedThisTerm: adminExcludedIds.has(s._id), // pre-exclude admin-excluded subjects
        })),
        attendance: { schoolDaysOpen: 0, daysPresent: 0, daysAbsent: 0 },
        teacherComment: "",
      },
    }));
  }

  async function saveResult(studentId: string) {
    const draft = drafts[studentId];
    if (!draft || !selectedAssignment || !selectedTerm) return;
    if (!draft.attendance.schoolDaysOpen || draft.attendance.schoolDaysOpen === 0) {
      toast.error("Please enter the number of school days open"); return;
    }
    const activeScores = draft.scores.filter((s) => !adminExcludedIds.has(s.subject) && !s.excludedThisTerm);
    if (activeScores.length === 0) {
      toast.error("At least one subject must be offered this term"); return;
    }
    setSaving(studentId);
    try {
      const res  = await fetch("/api/teacher/results", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId, classId: selectedAssignment.class._id,
          sessionId: selectedAssignment.session._id, termId: selectedTerm,
          subjects: draft.scores, // send all — API filters excluded ones
          attendance: draft.attendance, teacherComment: draft.teacherComment,
        }),
      });
      const json = (await res.json()) as { success: boolean; message?: string; error?: string; data?: { _id?: string } };
      if (json.success) {
        toast.success("Result saved as draft");
        if (json.data?._id) setSavedReportIds((prev) => Array.from(new Set([...prev, json.data!._id!])));
        setExpandedStudents((prev) => { const next = new Set(prev); next.delete(studentId); return next; });
        if (selectedAssignment && selectedTerm) {
          await fetchDrafts(selectedAssignment.class._id, selectedAssignment.session._id, selectedTerm, students, selectedAssignment);
        }
      } else { toast.error(json.error ?? "Failed to save"); }
    } finally { setSaving(null); }
  }

  async function submitAllForReview() {
    if (savedReportIds.length === 0) { toast.error("No draft results to submit"); return; }
    const missingAttendance = draftedStudents.filter(
      (s) => drafts[s._id]?.status === ReportStatus.DRAFT && (!drafts[s._id]?.attendance.schoolDaysOpen || drafts[s._id]?.attendance.schoolDaysOpen === 0)
    );
    if (missingAttendance.length > 0) {
      toast.error(`${missingAttendance.length} student(s) have missing attendance.`);
      setExpandedStudents(new Set(missingAttendance.map((s) => s._id)));
      setDraftsCollapsed(false); return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/teacher/results", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: savedReportIds }),
      });
      const json = (await res.json()) as { success: boolean; message?: string };
      if (json.success) {
        toast.success(json.message ?? "Reports submitted for review");
        if (selectedAssignment && selectedTerm) {
          await fetchDrafts(selectedAssignment.class._id, selectedAssignment.session._id, selectedTerm, students, selectedAssignment);
        }
      } else { toast.error("Failed to submit reports"); }
    } finally { setSubmitting(false); }
  }

  const pendingStudents  = students.filter((s) => !drafts[s._id]);
  const draftedStudents  = students.filter((s) => !!drafts[s._id]);
  const submittedCount   = draftedStudents.filter((s) => drafts[s._id]?.status === ReportStatus.SUBMITTED).length;
  const approvedCount    = draftedStudents.filter((s) => drafts[s._id]?.status === ReportStatus.APPROVED).length;
  const draftCount       = draftedStudents.filter((s) => drafts[s._id]?.status === ReportStatus.DRAFT).length;

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"><div className="h-40 bg-gray-100 rounded" /></div>
    </div>
  );

  if (assignments.length === 0) return (
    <div className="text-center py-16">
      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <h2 className="font-display text-lg font-semibold text-gray-600">No Classes Assigned</h2>
      <p className="text-gray-400 text-sm">Contact admin to be assigned to classes</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Results & Reports</h1>
          <p className="text-gray-500 text-sm">Enter student scores and submit for approval</p>
        </div>
        <button
          onClick={submitAllForReview} disabled={submitting || draftCount === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting..." : `Submit ${draftCount > 0 ? `${draftCount} Drafts` : "for Review"}`}
        </button>
      </div>

      {/* Class & Term Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Select Class</label>
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <button key={a._id} onClick={() => setSelectedAssignment(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedAssignment?._id === a._id ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {a.class.name}
                </button>
              ))}
            </div>
          </div>
          {selectedAssignment && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Select Term</label>
              <div className="flex gap-2">
                {selectedAssignment.session.terms.map((term) => (
                  <button key={term._id} onClick={() => term.status === "active" && setSelectedTerm(term._id)}
                    disabled={term.status !== "active"}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                      selectedTerm === term._id ? "bg-amber-500 text-white border-amber-500"
                      : term.status === "active" ? "border-gray-200 text-gray-600 hover:border-gray-300"
                      : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                    }`}>
                    {term.name} term
                    {term.status === "upcoming" && <span className="ml-1 text-xs">🔒</span>}
                    {term.status === "completed" && <span className="ml-1 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin exclusion notice */}
        {adminExcludedIds.size > 0 && !loadingSchedule && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>{adminExcludedIds.size} subject{adminExcludedIds.size !== 1 ? "s" : ""}</strong> excluded this term by admin. They won&apos;t appear in report cards or affect grades.
            </span>
          </div>
        )}
      </div>

      {selectedAssignment && students.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-gray-900">{pendingStudents.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending Entry</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Saved Drafts</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-emerald-700">{submittedCount + approvedCount}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Submitted / Approved</p>
            </div>
          </div>

          {pendingStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600">Pending Entry ({pendingStudents.length})</h2>
              </div>
              {pendingStudents.map((student) => (
                <StudentCard key={student._id} student={student} draft={drafts[student._id]}
                  selectedAssignment={selectedAssignment} selectedTermId={selectedTerm}
                  isExpanded={expandedStudents.has(student._id)} saving={saving === student._id}
                  isFetchingAttendance={fetchingAttendance.has(student._id)}
                  adminExcludedIds={adminExcludedIds}
                
                  onToggle={() => {
  initStudentDraft(student._id);
  toggleExpanded(student._id);
}}
                  onUpdateScore={updateScore}
                  onToggleSubjectExclusion={toggleSubjectExclusion}
                  onUpdateAttendance={(field, value) => setDrafts((prev) => ({ ...prev, [student._id]: { ...prev[student._id]!, attendance: { ...prev[student._id]!.attendance, [field]: value } } }))}
                  onUpdateComment={(value) => setDrafts((prev) => ({ ...prev, [student._id]: { ...prev[student._id]!, teacherComment: value } }))}
                  onSave={() => saveResult(student._id)}
                />
              ))}
            </div>
          )}

          {students.length > 0 && pendingStudents.length === 0 && draftCount === 0 && submittedCount + approvedCount === students.length && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-emerald-700">All results entered!</p>
              <p className="text-sm text-emerald-600 mt-1">Click &quot;Submit for Review&quot; to send to admin for approval.</p>
            </div>
          )}

          {draftedStudents.length > 0 && (
            <div className="space-y-3">
              <button onClick={() => setDraftsCollapsed(!draftsCollapsed)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">Saved Drafts</span>
                  <div className="flex items-center gap-2">
                    {draftCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{draftCount} draft{draftCount !== 1 ? "s" : ""}</span>}
                    {submittedCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{submittedCount} submitted</span>}
                    {approvedCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{approvedCount} approved</span>}
                  </div>
                </div>
                {draftsCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
              </button>
              {!draftsCollapsed && (
                <div className="space-y-3">
                  {draftedStudents.map((student) => (
                    <StudentCard key={student._id} student={student} draft={drafts[student._id]}
                      selectedAssignment={selectedAssignment} selectedTermId={selectedTerm}
                      isExpanded={expandedStudents.has(student._id)} saving={saving === student._id}
                      isFetchingAttendance={fetchingAttendance.has(student._id)}
                      adminExcludedIds={adminExcludedIds}
                      onToggle={() => { toggleExpanded(student._id); if (!expandedStudents.has(student._id)) setTimeout(() => autoFillAttendance(student._id), 50); }}
                      onUpdateScore={updateScore}
                      onToggleSubjectExclusion={toggleSubjectExclusion}
                      onUpdateAttendance={(field, value) => setDrafts((prev) => ({ ...prev, [student._id]: { ...prev[student._id]!, attendance: { ...prev[student._id]!.attendance, [field]: value } } }))}
                      onUpdateComment={(value) => setDrafts((prev) => ({ ...prev, [student._id]: { ...prev[student._id]!, teacherComment: value } }))}
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
        <div className="text-center py-12 text-gray-400"><p>No students found in this class</p></div>
      )}
    </div>
  );
}

// ── StudentCard ───────────────────────────────────────────────────────────────

interface StudentCardProps {
  student: Student; draft?: ReportDraft; selectedAssignment: ClassAssignment;
  selectedTermId: string; isExpanded: boolean; saving: boolean;
  isFetchingAttendance: boolean; adminExcludedIds: Set<string>;
  onToggle: () => void;
  onUpdateScore: (studentId: string, subjectId: string, field: keyof SubjectScore, value: number) => void;
  onToggleSubjectExclusion: (studentId: string, subjectId: string) => void;
  onUpdateAttendance: (field: "schoolDaysOpen" | "daysPresent" | "daysAbsent", value: number) => void;
  onUpdateComment: (value: string) => void;
  onSave: () => void;
}

function getGradeFromPercentage(percentage: number): { grade: string; color: string } {
  if (percentage >= 70) return { grade: "A", color: "text-emerald-600" };
  if (percentage >= 60) return { grade: "B", color: "text-blue-600" };
  if (percentage >= 50) return { grade: "C", color: "text-amber-600" };
  if (percentage >= 45) return { grade: "D", color: "text-orange-500" };
  if (percentage >= 40) return { grade: "E", color: "text-orange-600" };
  return { grade: "F", color: "text-red-600" };
}

function StudentCard({
  student, draft, selectedAssignment, isExpanded, saving, isFetchingAttendance,
  adminExcludedIds, onToggle, onUpdateScore, onToggleSubjectExclusion,
  onUpdateAttendance, onUpdateComment, onSave,
}: StudentCardProps) {
  const [generatingComment, setGeneratingComment] = useState(false);

  const isApproved  = draft?.status === ReportStatus.APPROVED;
  const isDeclined  = draft?.status === ReportStatus.DECLINED;
  const isSubmitted = draft?.status === ReportStatus.SUBMITTED;
  const isLocked    = isApproved;

  const canSuggestComment = !isLocked && !isSubmitted && !draft?.teacherComment?.trim();

  // Active scores = not excluded by admin, not excluded by teacher
  const activeScores   = draft?.scores.filter((s) => !adminExcludedIds.has(s.subject) && !s.excludedThisTerm) ?? [];
  const excludedScores = draft?.scores.filter((s) => adminExcludedIds.has(s.subject) || s.excludedThisTerm)  ?? [];

  async function suggestComment() {
    if (!draft || generatingComment) return;
    setGeneratingComment(true);
    try {
      const activeTerm = selectedAssignment.session.terms.find((t) => t.status === "active");
      const res  = await fetch("/api/teacher/results/ai-comment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: `${student.firstName} ${student.surname}`,
          className: selectedAssignment.class.name,
          termName: activeTerm?.name ?? "Current",
          scores: activeScores, // only active subjects for AI context
        }),
      });
      const json = (await res.json()) as { success: boolean; comment?: string; error?: string };
      if (json.success && json.comment) {
        onUpdateComment(json.comment);
        toast.success("AI comment generated — feel free to edit it");
      } else { toast.error(json.error ?? "Could not generate comment"); }
    } catch { toast.error("Failed to reach AI service"); } finally { setGeneratingComment(false); }
  }

  const attendanceError = draft && !isLocked
    ? !draft.attendance.schoolDaysOpen || draft.attendance.schoolDaysOpen === 0 ? "School days open is required"
      : draft.attendance.daysPresent > draft.attendance.schoolDaysOpen ? "Days present cannot exceed school days open"
      : draft.attendance.daysPresent + draft.attendance.daysAbsent > draft.attendance.schoolDaysOpen ? "Present + absent cannot exceed school days open"
      : null
    : null;

  const totalObtained    = activeScores.reduce((sum, s) => sum + s.testScore + s.examScore + (s.hasPractical ? s.practicalScore : 0), 0);
  const totalObtainable  = activeScores.reduce((sum) => sum + 100, 0);
  const percentage       = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
  const { grade, color } = getGradeFromPercentage(percentage);

  const inputClass = (extra = "") =>
    `${extra} text-sm text-gray-900 bg-white focus:outline-none ${isLocked ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100" : "border-gray-200 focus:border-amber-400"}`;

  const statusBadge = () => {
    if (!draft) return <span className="text-xs text-gray-400">Click to enter scores</span>;
    if (isApproved)  return <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (isDeclined)  return <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Declined</span>;
    if (isSubmitted) return <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Submitted</span>;
    if (draft.status === ReportStatus.DRAFT) return <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Saved Draft</span>;
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isDeclined ? "border-red-200" : "border-gray-100"}`}>
      <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDeclined ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>
            {student.surname?.charAt(0) ?? "?"}{student.firstName?.charAt(0) ?? "?"}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">{student.surname} {student.firstName}</p>
            <p className="text-xs text-gray-400">{student.admissionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {draft && totalObtainable > 0 && (
            <div className="text-right">
              <p className={`text-xs sm:text-sm font-bold ${color}`}>{percentage.toFixed(1)}% · {grade}</p>
              <p className="text-xs text-gray-400">{totalObtained}/{totalObtainable} ({activeScores.length} subjects)</p>
            </div>
          )}
          {statusBadge()}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {isExpanded && draft && (
        <div className="border-t border-gray-50 p-4 space-y-4">
          {isDeclined && draft.declineReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 mb-0.5">Declined by Admin</p>
                <p className="text-xs text-red-600">{draft.declineReason}</p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-600">This report has been approved and is no longer editable.</p>
            </div>
          )}

          {/* Attendance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Attendance</h4>
              {isFetchingAttendance && <span className="flex items-center gap-1.5 text-xs text-[#1e3a5f]"><Loader2 className="w-3 h-3 animate-spin" />Auto-filling...</span>}
              {!isFetchingAttendance && draft.attendance.schoolDaysOpen > 0 && !isLocked && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600"><CalendarDays className="w-3 h-3" />Filled from register</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">School Days Open</label>
                <input type="number" min={0} value={draft.attendance.schoolDaysOpen || 0} readOnly={isLocked}
                  
onChange={(e) => {
  if (isLocked) return;
  const val = parseInt(e.target.value) || 0;
  const present = draft.attendance.daysPresent || 0;
  onUpdateAttendance("schoolDaysOpen", val);
  onUpdateAttendance("daysAbsent", Math.max(0, val - present));
}}
                  className={inputClass("w-full px-2 py-1.5 rounded-lg border")} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Days Present</label>
                <input type="number" min={0} step={0.5} max={draft.attendance.schoolDaysOpen} value={draft.attendance.daysPresent || 0} readOnly={isLocked}
                  onChange={(e) => {
  if (isLocked) return;
  const val = Math.min(draft.attendance.schoolDaysOpen || 0, Math.max(0, parseFloat(e.target.value) || 0));
  onUpdateAttendance("daysPresent", val);
  onUpdateAttendance("daysAbsent", Math.max(0, (draft.attendance.schoolDaysOpen || 0) - val));
}}
                  className={inputClass(`w-full px-2 py-1.5 rounded-lg border ${attendanceError ? "border-red-300" : ""}`)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Days Absent <span className="text-gray-300">(auto)</span></label>
                <input type="number" value={draft.attendance.daysAbsent || 0} readOnly className="w-full px-2 py-1.5 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
            </div>
            {attendanceError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{attendanceError}</p>}
          </div>

          {/* Subject Scores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">
                Subject Scores ({activeScores.length} offered{excludedScores.length > 0 ? `, ${excludedScores.length} excluded` : ""})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs text-gray-500">Subject</th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">Test</th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">Exam</th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">Practical (20)</th>
                    <th className="px-3 py-2 text-xs text-gray-500 text-center">Total</th>
                    {!isLocked && !isSubmitted && <th className="px-3 py-2 text-xs text-gray-500 text-center">This Term</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {draft.scores.map((score) => {
                    const isAdminExcluded   = adminExcludedIds.has(score.subject);
                    const isTeacherExcluded = score.excludedThisTerm === true;
                    const isExcluded        = isAdminExcluded || isTeacherExcluded;
                    const total = score.testScore + score.examScore + (score.hasPractical ? score.practicalScore : 0);

                    return (
                      <tr key={score.subject} className={isExcluded ? "opacity-40 bg-gray-50/50" : ""}>
                        <td className="px-3 py-2 font-medium text-gray-700">
                          <div className="flex items-center gap-1.5">
                            {isExcluded && <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                            <span className={isExcluded ? "line-through text-gray-400" : ""}>{score.subjectName}</span>
                            {isAdminExcluded && <span className="text-[10px] text-red-500 font-medium">(admin)</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={score.hasPractical ? 20 : 30}
                              value={score.testScore === 0 ? "" : score.testScore}
                              readOnly={isLocked || isExcluded}
                              onChange={(e) => { if (isLocked || isExcluded) return; onUpdateScore(student._id, score.subject, "testScore", Math.min(score.hasPractical ? 20 : 30, Math.max(0, parseInt(e.target.value) || 0))); }}
                              className={inputClass("w-16 text-center px-2 py-1 rounded border")} />
                            <span className="text-xs text-gray-400">/{score.hasPractical ? 20 : 30}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={score.hasPractical ? 60 : 70}
                              value={score.examScore === 0 ? "" : score.examScore}
                              readOnly={isLocked || isExcluded}
                              onChange={(e) => { if (isLocked || isExcluded) return; onUpdateScore(student._id, score.subject, "examScore", Math.min(score.hasPractical ? 60 : 70, Math.max(0, parseInt(e.target.value) || 0))); }}
                              className={inputClass("w-16 text-center px-2 py-1 rounded border")} />
                            <span className="text-xs text-gray-400">/{score.hasPractical ? 60 : 70}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {score.hasPractical ? (
                            <input type="number" min={0} max={20}
                              value={score.practicalScore === 0 ? "" : score.practicalScore}
                              readOnly={isLocked || isExcluded}
                              onChange={(e) => { if (isLocked || isExcluded) return; onUpdateScore(student._id, score.subject, "practicalScore", Math.min(20, Math.max(0, parseInt(e.target.value) || 0))); }}
                              className={inputClass("w-16 text-center px-2 py-1 rounded border")} />
                          ) : (
                            <span className="text-gray-300 text-sm pl-4">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isExcluded
                            ? <span className="text-xs text-gray-300">—</span>
                            : <span className={`font-bold ${total < 100 * 0.5 ? "text-red-600" : "text-[#1e3a5f]"}`}>{total}/100</span>
                          }
                        </td>
                        {!isLocked && !isSubmitted && (
                          <td className="px-3 py-2 text-center">
                            {isAdminExcluded ? (
                              <span className="text-xs text-gray-400">Admin set</span>
                            ) : (
                              <button
                                onClick={() => onToggleSubjectExclusion(student._id, score.subject)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isTeacherExcluded
                                    ? "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                }`}
                              >
                                {isTeacherExcluded ? "Restore" : "Exclude"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Active subjects summary */}
            {activeScores.length > 0 && (
              <div className="mt-2 flex items-center justify-end gap-2 text-xs text-gray-500 px-3">
                <span>Active total:</span>
                <span className="font-bold text-[#1e3a5f]">{totalObtained}/{totalObtainable}</span>
                <span className={`font-bold ${color}`}>({percentage.toFixed(1)}% · {grade})</span>
              </div>
            )}
          </div>

          {/* Teacher Comment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-500">Teacher&apos;s Comment</label>
              {canSuggestComment && (
                <button onClick={suggestComment} disabled={generatingComment}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors">
                  <Sparkles className="w-3 h-3" />
                  {generatingComment ? "Generating..." : "AI Suggest"}
                </button>
              )}
            </div>
            <input value={draft.teacherComment ?? ""} readOnly={isLocked}
              onChange={(e) => { if (!isLocked) onUpdateComment(e.target.value); }}
              placeholder={generatingComment ? "Generating comment..." : "e.g. Excellent performance this term..."}
              className={inputClass("w-full px-3 py-2 rounded-xl border")} />
          </div>

          {!isApproved && (
            <button onClick={onSave} disabled={saving || !!attendanceError}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isDeclined ? "Save & Resubmit" : "Save Result"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
