"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Loader2, Clock, Star, FileText,
  CheckCircle, AlertCircle, Upload, X, Send, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  _id:          string;
  isSubmitted:  boolean;
  isLate:       boolean;
  submittedAt?: string;
  textAnswer?:  string;
  attachments:  string[];
  score?:       number;
  feedback?:    string;
}

interface Assignment {
  _id:          string;
  title:        string;
  description?: string;
  subjectId?:   { name: string } | string;
  createdBy:    { firstName: string; surname: string } | string;
  dueDate:      string;
  maxScore:     number;
  attachments:  string[];
  submission:   Submission | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res  = await fetch("/api/upload", { method: "POST", body: formData });
  const json = await res.json() as { success: boolean; url: string; error?: string };
  if (!json.success) throw new Error(json.error ?? "Upload failed");
  return json.url;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(dueDate: string) { return new Date() > new Date(dueDate); }

function daysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

function statusInfo(a: Assignment): {
  label: string; bg: string; text: string; border: string;
} {
  const sub = a.submission;
  if (!sub?.isSubmitted) {
    return isOverdue(a.dueDate)
      ? { label: "Missed",  bg: "bg-red-50",   text: "text-red-600",   border: "border-red-200"   }
      : { label: "Pending", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" };
  }
  if (sub.score !== undefined) {
    return { label: `Graded: ${sub.score}/${a.maxScore}`, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" };
  }
  if (sub.isLate) {
    return { label: "Submitted (Late)", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" };
  }
  return { label: "Submitted", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignmentView() {
  const [assignments, setAssignments]       = useState<Assignment[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [selected, setSelected]             = useState<Assignment | null>(null);
  const [textAnswer, setTextAnswer]         = useState("");
  const [files, setFiles]                   = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchAssignments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      const res  = await fetch(`/api/student/assignments?${params}`);
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
  }, [page]);

  useEffect(() => { void fetchAssignments(true); }, [fetchAssignments]);

  function openSubmit(a: Assignment) {
    setSelected(a);
    setTextAnswer(a.submission?.textAnswer ?? "");
    setFiles([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    const skipped: string[] = [];
    for (const f of picked) {
      if (!ALLOWED_TYPES.includes(f.type))  skipped.push(`${f.name} (unsupported type)`);
      else if (f.size > MAX_FILE_SIZE)       skipped.push(`${f.name} (exceeds 5MB)`);
      else                                   valid.push(f);
    }
    if (skipped.length > 0) toast.error(`Skipped: ${skipped.join(", ")}`);
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!selected) return;
    if (!textAnswer.trim() && files.length === 0)
      return toast.error("Please write an answer or attach a file");

    setIsSubmitting(true);
    try {
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        setUploadingFiles(true);
        try {
          attachmentUrls = await Promise.all(files.map(uploadFile));
        } catch (uploadErr) {
          toast.error(uploadErr instanceof Error ? uploadErr.message : "File upload failed");
          return;
        } finally {
          setUploadingFiles(false);
        }
      }

      const res  = await fetch(`/api/student/assignments/${selected._id}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textAnswer:  textAnswer.trim() || undefined,
          attachments: attachmentUrls,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");

      toast.success(json.data.isLate ? "Submitted! (marked as late)" : "Assignment submitted!");
      setSelected(null);
      setFiles([]);
      setTextAnswer("");
      await fetchAssignments(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 font-display">My Assignments</h2>
          <p className="text-xs text-gray-400">{assignments.length} assignments</p>
        </div>
      </div>

      {/* List */}
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
        <div className="space-y-2">
          {assignments.map((a, i) => {
            const status    = statusInfo(a);
            const sub       = a.submission;
            const overdue   = isOverdue(a.dueDate);
            const subj      = typeof a.subjectId === "object" ? a.subjectId : null;
            const teacher   = typeof a.createdBy === "object" ? a.createdBy : null;
            const canSubmit = !sub?.isSubmitted;

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3.5 rounded-xl bg-white border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${status.bg} ${status.border}`}>
                    {sub?.isSubmitted
                      ? <CheckCircle className={`w-4 h-4 ${status.text}`} />
                      : overdue
                        ? <AlertCircle className={`w-4 h-4 ${status.text}`} />
                        : <Clock className={`w-4 h-4 ${status.text}`} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-xs font-semibold text-gray-900">{a.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2 flex-wrap">
                      {subj    && <span className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{subj.name}</span>}
                      {teacher && <span>{teacher.firstName} {teacher.surname}</span>}
                      <span className={`flex items-center gap-0.5 ${overdue && !sub?.isSubmitted ? "text-red-500" : ""}`}>
                        <Clock className="w-2.5 h-2.5" />{daysLeft(a.dueDate)}
                      </span>
                      <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{a.maxScore} pts</span>
                    </div>

                    {/* Teacher feedback preview */}
                    {sub?.feedback && (
                      <p className="text-[10px] italic mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
                        Teacher: {sub.feedback}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {canSubmit && (
                        <button
                          onClick={() => openSubmit(a)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors border ${
                            overdue
                              ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                              : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <Send className="w-2.5 h-2.5" />
                          {overdue ? "Submit Late" : "Submit"}
                        </button>
                      )}
                      {sub?.isSubmitted && (
                        <button
                          onClick={() => openSubmit(a)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5" /> View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
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

      {/* ── Submit / View Modal ── */}
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
              className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
              style={{ maxHeight: "92dvh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="p-5 space-y-4">
                {/* Modal header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 font-display mb-1">{selected.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                      <span>Due {new Date(selected.dueDate).toLocaleDateString("en-NG")}</span>
                      <span>·</span>
                      <span>{selected.maxScore} pts</span>
                      {isOverdue(selected.dueDate) && !selected.submission?.isSubmitted && (
                        <span className="text-red-500">· Overdue</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Instructions */}
                {selected.description && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Instructions</p>
                    <p className="text-xs text-gray-600">{selected.description}</p>
                  </div>
                )}

                {/* Assignment attachments */}
                {selected.attachments?.length > 0 && (
                  <div>
                    <p className={LABEL_CLS}>Assignment Files</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {selected.attachments.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
                          <FileText className="w-2.5 h-2.5" /> File {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Read-only submitted view ── */}
                {selected.submission?.isSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600">
                        Submitted {selected.submission.isLate ? "(Late)" : ""}
                      </span>
                      {selected.submission.submittedAt && (
                        <span className="text-[10px] text-gray-400">
                          · {new Date(selected.submission.submittedAt).toLocaleDateString("en-NG")}
                        </span>
                      )}
                    </div>

                    {selected.submission.textAnswer && (
                      <div>
                        <p className={LABEL_CLS}>Your Answer</p>
                        <p className="text-xs p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 whitespace-pre-wrap">
                          {selected.submission.textAnswer}
                        </p>
                      </div>
                    )}

                    {selected.submission.attachments?.length > 0 && (
                      <div>
                        <p className={LABEL_CLS}>Your Attachments</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {selected.submission.attachments.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
                              <FileText className="w-2.5 h-2.5" /> File {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.submission.score !== undefined && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <Star className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700">
                            Score: {selected.submission.score} / {selected.maxScore}
                          </p>
                          {selected.submission.feedback && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">{selected.submission.feedback}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                ) : (
                  /* ── Submit form ── */
                  <div className="space-y-3 pb-2">
                    {/* Late warning */}
                    {isOverdue(selected.dueDate) && (
                      <div className="flex items-start gap-2 p-3 rounded-xl text-xs bg-amber-50 border border-amber-100 text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        This assignment is past its due date. Your submission will be marked as late.
                      </div>
                    )}

                    {/* Text answer */}
                    <div>
                      <label className={LABEL_CLS}>Your Answer</label>
                      <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Write your answer here…"
                        rows={5}
                        className={`${INPUT_CLS} resize-none`}
                      />
                    </div>

                    {/* File upload */}
                    <div>
                      <label className={LABEL_CLS}>
                        Attach Files{" "}
                        <span className="font-normal text-gray-400">(images or PDF · max 5MB each)</span>
                      </label>

                      <label className="flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-colors bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400">
                        <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">Click to attach a file</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>

                      {files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {files.map((f, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              <span className="text-[10px] text-blue-600 truncate flex-1">{f.name}</span>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {(f.size / 1024).toFixed(0)}KB
                              </span>
                              <button
                                type="button" onClick={() => removeFile(idx)}
                                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {uploadingFiles ? "Uploading files…" : "Submitting…"}
                        </>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /> Submit Assignment</>
                      )}
                    </button>
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