"use client";
 
import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2, Clock, Star, CheckCircle, AlertCircle, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface ChildSubmission {
  _id:        string;
  studentId:  { _id: string; firstName: string; surname: string; admissionNumber: string } | string;
  isSubmitted: boolean;
  isLate:      boolean;
  score?:      number;
  feedback?:   string;
  submittedAt?: string;
}
 
interface Assignment {
  _id:          string;
  title:        string;
  description?: string;
  classId:      { name: string } | string;
  subjectId?:   { name: string } | string;
  createdBy:    { firstName: string; surname: string } | string;
  dueDate:      string;
  maxScore:     number;
  submissions:  ChildSubmission[];
}
 
// ─── Component ────────────────────────────────────────────────────────────────
 
interface AssignmentParentViewProps {
  childId?: string; // optional — filter to one child
}
 
export default function AssignmentParentView({ childId }: AssignmentParentViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
 
  const fetchAssignments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (childId) params.set("childId", childId);
      const res  = await fetch(`/api/parent/assignments?${params}`);
      const json = await res.json();
      if (json.success) setAssignments(json.data ?? []);
    } catch {
      if (!silent) toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  }, [childId]);
 
  useEffect(() => { void fetchAssignments(true); }, [fetchAssignments]);
 
  function isOverdue(dueDate: string) { return new Date() > new Date(dueDate); }
  function daysLeft(dueDate: string) {
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0)   return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    return `${days}d left`;
  }
 
  function submissionStatus(sub: ChildSubmission | undefined, maxScore: number) {
    if (!sub?.isSubmitted) return { label: "Not submitted", color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" };
    if (sub.score !== undefined) return { label: `Graded: ${sub.score}/${maxScore}`, color: "#34d399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" };
    if (sub.isLate) return { label: "Submitted (Late)", color: "#fbbf24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" };
    return { label: "Submitted", color: "#38bdf8", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.2)" };
  }
 
  return (
    <div
      className="w-full min-w-0 rounded-2xl p-4 lg:p-6 space-y-4"
      style={{
        background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
        border: "1px solid rgba(14,165,233,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.25)" }}>
          <BookOpen className="w-4 h-4" style={{ color: "#38bdf8" }} />
        </div>
        <h2 className="text-sm font-bold" style={{ color: "#f5f0e8" }}>Assignments</h2>
      </div>
 
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#38bdf8" }} />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl"
          style={{ border: "1px dashed rgba(14,165,233,0.12)", background: "rgba(255,255,255,0.01)" }}>
          <BookOpen className="w-7 h-7 mb-2" style={{ color: "rgba(245,240,232,0.12)" }} />
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a, i) => {
            const cls    = typeof a.classId   === "object" ? a.classId   : null;
            const subj   = typeof a.subjectId === "object" ? a.subjectId : null;
            const overdue = isOverdue(a.dueDate);
 
            return (
              <motion.div key={a._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Assignment header */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-xs font-semibold" style={{ color: "#f5f0e8" }}>{a.title}</p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(245,240,232,0.35)" }}>
                    {subj && <span><FileText className="w-2.5 h-2.5 inline mr-0.5" />{subj.name}</span>}
                    {cls  && <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{cls.name}</span>}
                    <span className={overdue ? "text-red-400" : ""}>
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />{daysLeft(a.dueDate)}
                    </span>
                    <span><Star className="w-2.5 h-2.5 inline mr-0.5" />{a.maxScore} pts</span>
                  </div>
                </div>
 
                {/* Per-child submission status */}
                <div className="space-y-1.5">
                  {a.submissions.length === 0 ? (
                    // No submission from any child yet
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#f87171" }} />
                      <p className="text-[10px]" style={{ color: "#f87171" }}>Not submitted yet</p>
                    </div>
                  ) : (
                    a.submissions.map((sub) => {
                      const student = typeof sub.studentId === "object" ? sub.studentId : null;
                      const st      = submissionStatus(sub, a.maxScore);
                      return (
                        <div key={sub._id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg flex-wrap"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[10px] font-medium" style={{ color: "rgba(245,240,232,0.6)" }}>
                            {student ? `${student.firstName} ${student.surname}` : "—"}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
 