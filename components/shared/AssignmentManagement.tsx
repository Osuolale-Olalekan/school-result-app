"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, Loader2, X, ChevronRight,
  Calendar, Users, Star, Clock, FileText,
  CheckCircle, Edit2, Send,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UserRole } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassDoc   { _id: string; name: string; section?: string }
interface SubjectDoc { _id: string; name: string }

interface Assignment {
  _id:          string;
  title:        string;
  description?: string;
  classId:      ClassDoc | string;
  subjectId?:   SubjectDoc | string;
  createdBy:    { firstName: string; surname: string } | string;
  dueDate:      string;
  maxScore:     number;
  attachments:  string[];
  status:       "draft" | "published";
  createdAt:    string;
}

interface Submission {
  _id:          string;
  studentId:    { firstName: string; surname: string; admissionNumber: string } | string;
  submittedAt?: string;
  isSubmitted:  boolean;
  isLate:       boolean;
  score?:       number;
  feedback?:    string;
  textAnswer?:  string;
  attachments:  string[];
}

interface AssignmentManagementProps {
  role: UserRole.ADMIN | UserRole.TEACHER;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

const API_BASE = (role: UserRole) =>
  role === UserRole.ADMIN ? "/api/admin/assignments" : "/api/teacher/assignments";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignmentManagement({ role }: AssignmentManagementProps) {
  const [assignments, setAssignments]   = useState<Assignment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);

  const [selected, setSelected]               = useState<Assignment | null>(null);
  const [submissions, setSubmissions]         = useState<Submission[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [gradingId, setGradingId]           = useState<string | null>(null);
  const [gradeScore, setGradeScore]         = useState("");
  const [gradeFeedback, setGradeFeedback]   = useState("");
  const [isGrading, setIsGrading]           = useState(false);

  const [classes, setClasses]   = useState<ClassDoc[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    classId:     "",
    subjectId:   "",
    dueDate:     "",
    maxScore:    "100",
    status:      "draft" as "draft" | "published",
  });

  // ── Fetch assignments ──
  const fetchAssignments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res  = await fetch(`${API_BASE(role)}?${params}`);
      const json = await res.json();
      if (json.success) {
        setAssignments(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    } catch {
      if (!silent) toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, role]);

  const fetchClasses = useCallback(async () => {
    try {
      const url  = role === UserRole.TEACHER ? "/api/teacher/classes" : "/api/admin/classes";
      const res  = await fetch(url);
      const json = await res.json();
      if (json.success) setClasses(json.data ?? []);
    } catch { /* silent */ }
  }, [role]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/subjects");
      const json = await res.json();
      if (json.success) setSubjects(json.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void fetchAssignments(true); }, [fetchAssignments]);
  useEffect(() => { void fetchClasses(); void fetchSubjects(); }, [fetchClasses, fetchSubjects]);

  async function fetchDetail(a: Assignment) {
    setSelected(a);
    if (role !== UserRole.TEACHER) return;
    setIsLoadingDetail(true);
    try {
      const res  = await fetch(`/api/teacher/assignments/${a._id}`);
      const json = await res.json();
      if (json.success) setSubmissions(json.data.submissions ?? []);
    } catch { /* silent */ } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleSave(publishNow = false) {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.classId)      return toast.error("Select a class");
    if (!form.dueDate)      return toast.error("Due date is required");

    setIsSaving(true);
    try {
      const res  = await fetch(API_BASE(role), {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       form.title.trim(),
          description: form.description.trim() || undefined,
          classId:     form.classId,
          subjectId:   form.subjectId || undefined,
          dueDate:     form.dueDate,
          maxScore:    parseInt(form.maxScore) || 100,
          status:      publishNow ? "published" : form.status,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success(publishNow ? "Assignment published!" : "Assignment saved as draft");
      setShowForm(false);
      setForm({ title: "", description: "", classId: "", subjectId: "", dueDate: "", maxScore: "100", status: "draft" });
      await fetchAssignments(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(a: Assignment) {
    try {
      const res  = await fetch(`/api/teacher/assignments/${a._id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Assignment published!");
      await fetchAssignments(false);
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  async function handleGrade(submissionId: string, assignmentId: string) {
    const score = parseFloat(gradeScore);
    if (isNaN(score)) return toast.error("Enter a valid score");
    setIsGrading(true);
    try {
      const res  = await fetch(
        `/api/teacher/assignments/${assignmentId}/submissions/${submissionId}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, feedback: gradeFeedback.trim() || undefined }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Submission graded!");
      setGradingId(null);
      setGradeScore("");
      setGradeFeedback("");
      if (selected) await fetchDetail(selected);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grade");
    } finally {
      setIsGrading(false);
    }
  }

  function isOverdue(dueDate: string) { return new Date() > new Date(dueDate); }
  function daysLeft(dueDate: string) {
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0)   return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    return `${days}d left`;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">Assignments</h2>
            <p className="text-xs text-gray-400">{assignments.length} total</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New Assignment
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
        {["all", "published", "draft"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? "bg-white text-amber-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : s === "published" ? "✓ Published" : "◦ Drafts"}
          </button>
        ))}
      </div>

      {/* Assignment grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <BookOpen className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No assignments yet</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {assignments.map((a, i) => {
            const cls     = typeof a.classId   === "object" ? a.classId   : null;
            const subj    = typeof a.subjectId === "object" ? a.subjectId : null;
            const overdue = isOverdue(a.dueDate);
            const isDraft = a.status === "draft";

            return (
              <motion.button
                key={a._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => fetchDetail(a)}
                className={`p-3.5 rounded-xl text-left transition-all hover:shadow-sm bg-white border ${
                  isDraft ? "border-gray-100 hover:border-gray-200" : "border-blue-100 hover:border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
                    {a.title}
                  </p>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isDraft
                      ? "bg-gray-100 text-gray-500 border-gray-200"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                  }`}>
                    {isDraft ? "Draft" : "Published"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {cls && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Users className="w-3 h-3" /> {cls.name}
                    </span>
                  )}
                  {subj && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <FileText className="w-3 h-3" /> {subj.name}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-[10px] ml-auto ${
                    overdue && !isDraft ? "text-red-500" : "text-gray-400"
                  }`}>
                    <Clock className="w-3 h-3" />
                    {daysLeft(a.dueDate)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Max: {a.maxScore} pts</span>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-40"
          >Prev</button>
          <span className="text-xs text-gray-400">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-40"
          >Next</button>
        </div>
      )}

      {/* ── Create Assignment Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
              style={{ maxHeight: "92dvh" }}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 font-display">New Assignment</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className={LABEL_CLS}>Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Chapter 3 Exercise"
                    className={INPUT_CLS}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={LABEL_CLS}>Description / Instructions</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the task, what students should submit, etc."
                    rows={3}
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Class */}
                <div>
                  <label className={LABEL_CLS}>Class *</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">Select class…</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}{c.section ? ` (${c.section})` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className={LABEL_CLS}>Subject (optional)</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">No subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due date + Max score */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Due Date *</label>
                    <input
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Max Score</label>
                    <input
                      type="number" value={form.maxScore} min="1" max="1000"
                      onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => handleSave(false)} disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Edit2 className="w-3.5 h-3.5" /> Save Draft</>}
                  </button>
                  <button
                    onClick={() => handleSave(true)} disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Publish</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Assignment Detail + Submissions Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
              style={{ maxHeight: "92dvh" }}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        selected.status === "published"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {selected.status === "published" ? "Published" : "Draft"}
                      </span>
                      {isOverdue(selected.dueDate) && selected.status === "published" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 font-display">{selected.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-wrap text-[10px] text-gray-400">
                  {typeof selected.classId === "object" && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{selected.classId.name}</span>
                  )}
                  {typeof selected.subjectId === "object" && selected.subjectId && (
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{selected.subjectId.name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {new Date(selected.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{selected.maxScore} pts</span>
                </div>

                {/* Description */}
                {selected.description && (
                  <p className="text-xs p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-600">
                    {selected.description}
                  </p>
                )}

                {/* Publish button for draft */}
                {selected.status === "draft" && role === UserRole.TEACHER && (
                  <button
                    onClick={() => handlePublish(selected)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish Assignment
                  </button>
                )}

                {/* Submissions (teacher only) */}
                {role === UserRole.TEACHER && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">
                      Submissions ({submissions.filter((s) => s.isSubmitted).length})
                    </p>

                    {isLoadingDetail ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <p className="text-xs text-center py-6 text-gray-400">No submissions yet</p>
                    ) : (
                      submissions.map((sub) => {
                        const student      = typeof sub.studentId === "object" ? sub.studentId : null;
                        const isGradingThis = gradingId === sub._id;

                        return (
                          <div
                            key={sub._id}
                            className="p-3 rounded-xl space-y-2 bg-white border border-gray-100"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <p className="text-xs font-semibold text-gray-900">
                                  {student ? `${student.firstName} ${student.surname}` : "—"}
                                </p>
                                {student && (
                                  <p className="text-[10px] text-gray-400">#{student.admissionNumber}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {sub.isLate && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                                    Late
                                  </span>
                                )}
                                {sub.score !== undefined ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    {sub.score}/{selected.maxScore}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => { setGradingId(sub._id); setGradeScore(""); setGradeFeedback(""); }}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                                  >
                                    Grade
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Text answer preview */}
                            {sub.textAnswer && (
                              <p className="text-[10px] line-clamp-3 p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500">
                                {sub.textAnswer}
                              </p>
                            )}

                            {/* Attachments */}
                            {sub.attachments?.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {sub.attachments.map((url, idx) => (
                                  <a
                                    key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                                  >
                                    <FileText className="w-2.5 h-2.5" /> File {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Existing feedback */}
                            {sub.feedback && (
                              <p className="text-[10px] italic text-gray-400">Feedback: {sub.feedback}</p>
                            )}

                            {/* Grading form */}
                            {isGradingThis && (
                              <div className="space-y-2 pt-1 border-t border-gray-100">
                                <div>
                                  <label className={LABEL_CLS}>Score (0–{selected.maxScore})</label>
                                  <input
                                    type="number" value={gradeScore} min="0" max={selected.maxScore}
                                    onChange={(e) => setGradeScore(e.target.value)}
                                    className={INPUT_CLS}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLS}>Feedback (optional)</label>
                                  <textarea
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    placeholder="Write feedback for the student…"
                                    rows={2}
                                    className={`${INPUT_CLS} resize-none`}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setGradingId(null)}
                                    className="flex-1 py-2 rounded-xl text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleGrade(sub._id, selected._id)}
                                    disabled={isGrading}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                                  >
                                    {isGrading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Submit Grade"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}