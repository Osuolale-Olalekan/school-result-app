"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert, Plus, Loader2, X, Search,
  ThumbsUp, ThumbsDown, AlertTriangle, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BehaviourCategory, BehaviourSeverity, BehaviourType } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  _id: string;
  firstName: string;
  surname: string;
  admissionNumber: string;
  currentClass?: { name: string };
}

interface TeacherClass {
  _id: string;
  name: string;
}

interface BehaviourRecord {
  _id: string;
  studentId: Student | string;
  date: string;
  type: BehaviourType;
  category: string;
  description: string;
  severity?: BehaviourSeverity;
  actionTaken?: string;
  parentNotified: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NEGATIVE_CATEGORIES = [
  { value: BehaviourCategory.FIGHTING,   label: "Fighting"   },
  { value: BehaviourCategory.LATENESS,   label: "Lateness"   },
  { value: BehaviourCategory.TRUANCY,    label: "Truancy"    },
  { value: BehaviourCategory.DISRESPECT, label: "Disrespect" },
];

const POSITIVE_CATEGORIES = [
  { value: BehaviourCategory.OUTSTANDING_PERFORMANCE, label: "Outstanding Performance" },
  { value: BehaviourCategory.LEADERSHIP,              label: "Leadership"              },
  { value: BehaviourCategory.AWARD_ACHIEVEMENT,       label: "Award / Achievement"     },
];

const SEVERITY_STYLES: Record<BehaviourSeverity, { label: string; bg: string; text: string; border: string }> = {
  [BehaviourSeverity.LOW]:    { label: "Low",    bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200"  },
  [BehaviourSeverity.MEDIUM]: { label: "Medium", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  [BehaviourSeverity.HIGH]:   { label: "High",   bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"    },
};

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

const EMPTY_FORM = {
  studentId:   "",
  date:        new Date().toISOString().split("T")[0],
  type:        BehaviourType.NEGATIVE as BehaviourType,
  category:    "" as BehaviourCategory | "",
  description: "",
  severity:    "" as BehaviourSeverity | "",
  actionTaken: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherBehaviourLog() {
  const [records, setRecords]         = useState<BehaviourRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [isSaving, setIsSaving]       = useState(false);
  const [typeFilter, setTypeFilter]   = useState("all");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const [allStudents, setAllStudents]               = useState<Student[]>([]);
  const [studentSearch, setStudentSearch]           = useState("");
  const [filteredStudents, setFilteredStudents]     = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents]   = useState(false);
  const [selectedStudent, setSelectedStudent]       = useState<Student | null>(null);
  const searchTimer                                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch records ──
  const fetchRecords = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res  = await fetch(`/api/teacher/behaviour?${params}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
      }
    } catch {
      if (!silent) toast.error("Failed to load records");
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter]);

  // ── Pre-load students ──
  const loadClassStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    try {
      const classRes  = await fetch("/api/teacher/classes");
      const classJson = await classRes.json();
      if (!classJson.success) return;

      const classes: TeacherClass[] = classJson.data ?? [];
      if (classes.length === 0) return;

      const results = await Promise.all(
        classes.map((c) =>
          fetch(`/api/teacher/classes/${c._id}/students`).then((r) => r.json())
        )
      );

      const seen   = new Set<string>();
      const unique = results
        .filter((r) => r.success)
        .flatMap((r) => (r.data ?? []) as Student[])
        .filter((s) => { if (seen.has(s._id)) return false; seen.add(s._id); return true; });

      setAllStudents(unique);
    } catch { /* silent */ } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => { void fetchRecords(true); }, [fetchRecords]);
  useEffect(() => { void loadClassStudents(); }, [loadClassStudents]);

  // ── Student search ──
  function handleStudentSearchChange(value: string) {
    setStudentSearch(value);
    if (selectedStudent && value !== `${selectedStudent.firstName} ${selectedStudent.surname}`) {
      setSelectedStudent(null);
      setForm((f) => ({ ...f, studentId: "" }));
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (value.trim().length < 2) { setFilteredStudents([]); return; }
      const q = value.toLowerCase();
      setFilteredStudents(
        allStudents
          .filter((s) =>
            `${s.firstName} ${s.surname}`.toLowerCase().includes(q) ||
            s.admissionNumber.toLowerCase().includes(q)
          )
          .slice(0, 10)
      );
    }, 200);
  }

  function handleSelectStudent(s: Student) {
    setSelectedStudent(s);
    setForm((f) => ({ ...f, studentId: s._id }));
    setStudentSearch(`${s.firstName} ${s.surname}`);
    setFilteredStudents([]);
  }

  const availableCategories =
    form.type === BehaviourType.NEGATIVE ? NEGATIVE_CATEGORIES : POSITIVE_CATEGORIES;

  function handleTypeSwitch(t: BehaviourType) {
    setForm((f) => ({ ...f, type: t, category: "", severity: "" }));
  }

  function handleOpenForm() {
    setForm(EMPTY_FORM);
    setStudentSearch("");
    setSelectedStudent(null);
    setFilteredStudents([]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.studentId)          return toast.error("Select a student");
    if (!form.category)           return toast.error("Select a category");
    if (!form.description.trim()) return toast.error("Description is required");
    if (form.type === BehaviourType.NEGATIVE && !form.severity)
      return toast.error("Select severity for negative record");

    setIsSaving(true);
    try {
      const res  = await fetch("/api/teacher/behaviour", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:   form.studentId,
          date:        form.date,
          type:        form.type,
          category:    form.category,
          description: form.description.trim(),
          severity:    form.type === BehaviourType.NEGATIVE ? form.severity : undefined,
          actionTaken: form.actionTaken.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Behaviour record logged");
      setShowForm(false);
      await fetchRecords(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">Behaviour Records</h2>
            <p className="text-xs text-gray-400">Records you have logged</p>
          </div>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Log Record
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
        {["all", "negative", "positive"].map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              typeFilter === t
                ? "bg-white text-amber-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "all" ? "All" : t === "negative" ? "⚠ Negative" : "★ Positive"}
          </button>
        ))}
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <ShieldAlert className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No records logged yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r, i) => {
            const isNeg    = r.type === BehaviourType.NEGATIVE;
            const sevStyle = r.severity ? SEVERITY_STYLES[r.severity] : null;
            const catLabel = r.category.replace(/_/g, " ");
            const student  = typeof r.studentId === "object" ? r.studentId : null;

            return (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-3 rounded-xl border bg-white ${
                  isNeg ? "border-red-100" : "border-emerald-100"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                    isNeg ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                  }`}>
                    {isNeg
                      ? <ThumbsDown className="w-3 h-3 text-red-500" />
                      : <ThumbsUp   className="w-3 h-3 text-emerald-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-gray-900">
                        {student ? `${student.firstName} ${student.surname}` : "—"}
                      </span>
                      {student?.admissionNumber && (
                        <span className="text-[10px] text-gray-400">#{student.admissionNumber}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                        isNeg
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                        {catLabel}
                      </span>
                      {sevStyle && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
                          {sevStyle.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{r.description}</p>
                    {r.actionTaken && (
                      <p className="text-[10px] text-gray-400 italic mb-1">Action: {r.actionTaken}</p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(r.date).toLocaleDateString("en-NG")}
                      {r.parentNotified && (
                        <span className="ml-2 text-blue-500">· Parent notified</span>
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
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-gray-400">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Log Modal ── */}
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
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="p-5 space-y-4">
                {/* Modal header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 font-display">Log Behaviour Record</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Type toggle */}
                <div>
                  <label className={LABEL_CLS}>Record Type *</label>
                  <div className="flex gap-2">
                    {[BehaviourType.NEGATIVE, BehaviourType.POSITIVE].map((t) => (
                      <button
                        key={t} type="button" onClick={() => handleTypeSwitch(t)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize border ${
                          form.type === t
                            ? t === BehaviourType.NEGATIVE
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {t === BehaviourType.NEGATIVE
                          ? <><ThumbsDown className="w-3.5 h-3.5" /> Negative</>
                          : <><ThumbsUp   className="w-3.5 h-3.5" /> Positive</>
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student search */}
                <div>
                  <label className={LABEL_CLS}>Student *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    {isLoadingStudents && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-amber-500" />
                    )}
                    <input
                      value={studentSearch}
                      onChange={(e) => handleStudentSearchChange(e.target.value)}
                      placeholder={isLoadingStudents ? "Loading students…" : "Type name or admission number…"}
                      disabled={isLoadingStudents}
                      className={`w-full pl-8 pr-8 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50 border ${
                        selectedStudent
                          ? "border-amber-400 bg-white text-gray-900 ring-2 ring-amber-100"
                          : "border-gray-200 bg-white text-gray-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      }`}
                      style={{ caretColor: "auto" }}
                    />
                  </div>

                  {/* Selected student pill */}
                  {selectedStudent && (
                    <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-fit bg-amber-50 border border-amber-200">
                      <span className="text-[10px] font-semibold text-amber-600">
                        ✓ {selectedStudent.firstName} {selectedStudent.surname} · #{selectedStudent.admissionNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setSelectedStudent(null); setForm((f) => ({ ...f, studentId: "" })); setStudentSearch(""); }}
                        className="text-amber-400 hover:text-amber-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Dropdown */}
                  {filteredStudents.length > 0 && !selectedStudent && (
                    <div className="mt-1.5 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-white border border-gray-200 shadow-lg">
                      {filteredStudents.map((s) => (
                        <button
                          key={s._id} type="button" onClick={() => handleSelectStudent(s)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                            {s.firstName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {s.firstName} {s.surname}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              #{s.admissionNumber}{s.currentClass ? ` · ${s.currentClass.name}` : ""}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {studentSearch.length >= 2 && filteredStudents.length === 0 && !isLoadingStudents && !selectedStudent && (
                    <p className="mt-1.5 text-[10px] px-1 text-gray-400">
                      No students found for &quot;{studentSearch}&quot;
                    </p>
                  )}
                  {studentSearch.length < 2 && !selectedStudent && !isLoadingStudents && (
                    <p className="mt-1.5 text-[10px] px-1 text-gray-400">
                      Type at least 2 characters to search
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className={LABEL_CLS}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={LABEL_CLS}>Category *</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {availableCategories.map(({ value, label }) => (
                      <button
                        key={value} type="button"
                        onClick={() => setForm((f) => ({ ...f, category: value }))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          form.category === value
                            ? form.type === BehaviourType.NEGATIVE
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                {form.type === BehaviourType.NEGATIVE && (
                  <div>
                    <label className={LABEL_CLS}>Severity *</label>
                    <div className="flex gap-2">
                      {Object.values(BehaviourSeverity).map((s) => {
                        const st = SEVERITY_STYLES[s];
                        return (
                          <button
                            key={s} type="button"
                            onClick={() => setForm((f) => ({ ...f, severity: s }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize border ${
                              form.severity === s
                                ? `${st.bg} ${st.text} ${st.border}`
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className={LABEL_CLS}>Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what happened…"
                    rows={3}
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Action taken */}
                <div>
                  <label className={LABEL_CLS}>Action Taken (optional)</label>
                  <input
                    value={form.actionTaken}
                    onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
                    placeholder="e.g. Sent to principal, Parents called…"
                    className={INPUT_CLS}
                  />
                </div>

                {form.type === BehaviourType.NEGATIVE && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs bg-red-50 border border-red-100 text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Parent will be automatically notified when this record is saved.
                  </div>
                )}

                <div className="pb-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Record"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}