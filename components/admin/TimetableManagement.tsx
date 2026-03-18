"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, Loader2, X, Save,
  Trash2, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

interface Period {
  _id?:         string;
  day:          Day;
  periodNumber: number;
  startTime:    string;
  endTime:      string;
  subjectId:    string | { _id: string; name: string };
  teacherId:    string | { _id: string; firstName: string; surname: string };
  room?:        string;
}

interface Timetable {
  _id:       string;
  classId:   { _id: string; name: string; section?: string } | string;
  sessionId: { _id: string; name: string } | string;
  termId:    { _id: string; name: string } | string;
  periods:   Period[];
}

interface ClassDoc   { _id: string; name: string; section?: string }
interface SessionDoc { _id: string; name: string; status?: string }
interface TermDoc    { _id: string; name: string }
interface SubjectDoc { _id: string; name: string }
interface TeacherDoc { _id: string; firstName: string; surname: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: Day; label: string }[] = [
  { key: "monday",    label: "Mon" },
  { key: "tuesday",   label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday",  label: "Thu" },
  { key: "friday",    label: "Fri" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:00", end: "08:45" },
  2: { start: "08:45", end: "09:30" },
  3: { start: "09:30", end: "10:15" },
  4: { start: "10:30", end: "11:15" },
  5: { start: "11:15", end: "12:00" },
  6: { start: "13:00", end: "13:45" },
  7: { start: "13:45", end: "14:30" },
  8: { start: "14:30", end: "15:15" },
};

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

const DAY_COLORS: Record<Day, { bg: string; text: string; border: string; activeBg: string; activeText: string; activeBorder: string }> = {
  monday:    { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",   activeBg: "bg-blue-50",   activeText: "text-blue-700",   activeBorder: "border-blue-300"   },
  tuesday:   { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", activeBg: "bg-purple-50", activeText: "text-purple-700", activeBorder: "border-purple-300" },
  wednesday: { bg: "bg-emerald-50",text: "text-emerald-600",border: "border-emerald-200",activeBg: "bg-emerald-50",activeText: "text-emerald-700",activeBorder: "border-emerald-300"},
  thursday:  { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", activeBg: "bg-orange-50", activeText: "text-orange-700", activeBorder: "border-orange-300" },
  friday:    { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200",  activeBg: "bg-amber-50",  activeText: "text-amber-700",  activeBorder: "border-amber-300"  },
};

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.2 }}
        className="w-full sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimetableManagement() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes,    setClasses]    = useState<ClassDoc[]>([]);
  const [sessions,   setSessions]   = useState<SessionDoc[]>([]);
  const [terms,      setTerms]      = useState<TermDoc[]>([]);
  const [subjects,   setSubjects]   = useState<SubjectDoc[]>([]);
  const [teachers,   setTeachers]   = useState<TeacherDoc[]>([]);

  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [selected,   setSelected]   = useState<Timetable | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewDay,    setViewDay]    = useState<Day>("monday");

  const [editingPeriod, setEditingPeriod] = useState<{
    day: Day; periodNumber: number; existing?: Period;
  } | null>(null);
  const [periodForm, setPeriodForm] = useState({
    subjectId: "", teacherId: "", room: "", startTime: "", endTime: "",
  });

  const [createForm, setCreateForm] = useState({
    classId: "", sessionId: "", termId: "",
  });

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [ttRes, clRes, seRes, teRes, suRes] = await Promise.all([
        fetch("/api/admin/timetable"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/sessions"),
        fetch("/api/admin/users?role=teacher&limit=100"),
        fetch("/api/admin/subjects"),
      ]);
      const [tt, cl, se, te, su] = await Promise.all([
        ttRes.json(), clRes.json(), seRes.json(), teRes.json(), suRes.json(),
      ]);
      if (tt.success) setTimetables(tt.data ?? []);
      if (cl.success) setClasses(cl.data ?? []);
      if (se.success) {
        setSessions(se.data ?? []);
        const active = (se.data ?? []).find((s: SessionDoc) => s.status === "active");
        if (active) {
          const trRes  = await fetch(`/api/admin/sessions/${active._id}`);
          const trJson = await trRes.json();
          if (trJson.success) setTerms(trJson.data?.terms ?? []);
        }
      }
      if (te.success) setTeachers(te.data ?? []);
      if (su.success) setSubjects(su.data ?? []);
    } catch {
      if (!silent) toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(true); }, [fetchAll]);

  async function handleCreate() {
    if (!createForm.classId || !createForm.sessionId || !createForm.termId)
      return toast.error("Select class, session and term");
    setIsSaving(true);
    try {
      const res  = await fetch("/api/admin/timetable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Timetable created");
      setShowCreate(false);
      setCreateForm({ classId: "", sessionId: "", termId: "" });
      await fetchAll(false);
      setSelected(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this timetable? This cannot be undone.")) return;
    try {
      const res  = await fetch(`/api/admin/timetable/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Timetable deleted");
      setSelected(null);
      await fetchAll(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  function openPeriodEditor(day: Day, periodNumber: number) {
    if (!selected) return;
    const existing = selected.periods.find(
      (p) => p.day === day && p.periodNumber === periodNumber
    );
    setEditingPeriod({ day, periodNumber, existing });
    setPeriodForm({
      subjectId: existing ? (typeof existing.subjectId === "object" ? existing.subjectId._id : existing.subjectId) : "",
      teacherId: existing ? (typeof existing.teacherId === "object" ? existing.teacherId._id : existing.teacherId) : "",
      room:      existing?.room ?? "",
      startTime: existing?.startTime ?? DEFAULT_TIMES[periodNumber]?.start ?? "",
      endTime:   existing?.endTime   ?? DEFAULT_TIMES[periodNumber]?.end   ?? "",
    });
  }

  async function handleSavePeriod() {
    if (!selected || !editingPeriod) return;
    if (!periodForm.subjectId || !periodForm.teacherId)
      return toast.error("Select subject and teacher");
    if (!periodForm.startTime || !periodForm.endTime)
      return toast.error("Enter start and end times");

    const newPeriod: Period = {
      day:          editingPeriod.day,
      periodNumber: editingPeriod.periodNumber,
      startTime:    periodForm.startTime,
      endTime:      periodForm.endTime,
      subjectId:    periodForm.subjectId,
      teacherId:    periodForm.teacherId,
      room:         periodForm.room || undefined,
    };

    const updated = selected.periods.filter(
      (p) => !(p.day === editingPeriod.day && p.periodNumber === editingPeriod.periodNumber)
    );
    updated.push(newPeriod);

    setIsSaving(true);
    try {
      const res  = await fetch(`/api/admin/timetable/${selected._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: updated }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Period saved");
      setEditingPeriod(null);
      setSelected((prev) => prev ? { ...prev, periods: updated } : prev);
      await fetchAll(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemovePeriod(day: Day, periodNumber: number) {
    if (!selected) return;
    const updated = selected.periods.filter(
      (p) => !(p.day === day && p.periodNumber === periodNumber)
    );
    setIsSaving(true);
    try {
      const res  = await fetch(`/api/admin/timetable/${selected._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: updated }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Period removed");
      setSelected((prev) => prev ? { ...prev, periods: updated } : prev);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  }

  function getPeriod(day: Day, pNum: number) {
    return selected?.periods.find((p) => p.day === day && p.periodNumber === pNum);
  }

  function subjectName(id: string | { _id: string; name: string }) {
    if (typeof id === "object") return id.name;
    return subjects.find((s) => s._id === id)?.name ?? "—";
  }

  function teacherName(id: string | { _id: string; firstName: string; surname: string }) {
    if (typeof id === "object") return `${id.firstName} ${id.surname}`;
    const t = teachers.find((t) => t._id === id);
    return t ? `${t.firstName} ${t.surname}` : "—";
  }

  function getClassName(t: Timetable) {
    if (typeof t.classId === "object") return `${t.classId.name}${t.classId.section ? ` (${t.classId.section})` : ""}`;
    return classes.find((c) => c._id === t.classId)?.name ?? "—";
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">Timetables</h1>
            <p className="text-xs text-gray-400">{timetables.length} timetables</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Timetable
        </button>
      </div>

      {/* Timetable cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : timetables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <CalendarDays className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No timetables yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {timetables.map((t, i) => (
            <motion.button
              key={t._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { setSelected(t); setViewDay("monday"); }}
              className={`p-4 rounded-2xl text-left transition-all bg-white border shadow-sm hover:shadow-md ${
                selected?._id === t._id
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-gray-100 hover:border-amber-200"
              }`}
            >
              <p className="text-sm font-bold text-gray-900 mb-1">{getClassName(t)}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                <span>{typeof t.sessionId === "object" ? t.sessionId.name : "—"}</span>
                <span>·</span>
                <span>{typeof t.termId === "object" ? t.termId.name : "—"}</span>
                <span>·</span>
                <span>{t.periods.length} periods</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Timetable Editor ── */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 space-y-4">
          {/* Editor header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">
                {getClassName(selected)}
              </h3>
              <p className="text-xs text-gray-400">
                {typeof selected.termId === "object" ? selected.termId.name : ""}
                {typeof selected.sessionId === "object" ? ` · ${selected.sessionId.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(selected._id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
            {DAYS.map(({ key, label }) => {
              const c = DAY_COLORS[key];
              return (
                <button
                  key={key}
                  onClick={() => setViewDay(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    viewDay === key
                      ? `${c.activeBg} ${c.activeText} ${c.activeBorder} shadow-sm`
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Period rows */}
          <div className="space-y-2">
            {PERIODS.map((pNum) => {
              const period = getPeriod(viewDay, pNum);
              const dc     = DAY_COLORS[viewDay];

              return (
                <div
                  key={pNum}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    period
                      ? "bg-white border-gray-100"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  {/* Period number badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${dc.bg} ${dc.text} ${dc.border}`}>
                    {pNum}
                  </div>

                  <div className="flex-1 min-w-0">
                    {period ? (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-gray-900">
                            {subjectName(period.subjectId)}
                          </span>
                          {period.room && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {period.room}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" /> {teacherName(period.teacherId)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {period.startTime} – {period.endTime}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300">
                        {DEFAULT_TIMES[pNum]
                          ? `${DEFAULT_TIMES[pNum].start} – ${DEFAULT_TIMES[pNum].end} · Empty`
                          : "Empty period"}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openPeriodEditor(viewDay, pNum)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                        period
                          ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {period ? "Edit" : "Add"}
                    </button>
                    {period && (
                      <button
                        onClick={() => handleRemovePeriod(viewDay, pNum)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="New Timetable" onClose={() => setShowCreate(false)}>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Class *</label>
                <select
                  value={createForm.classId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, classId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.section ? ` (${c.section})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Session *</label>
                <select
                  value={createForm.sessionId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sessionId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select session…</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Term *</label>
                <select
                  value={createForm.termId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select term…</option>
                  {terms.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate} disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Period Editor Modal ── */}
      <AnimatePresence>
        {editingPeriod && (
          <Modal
            title={editingPeriod.existing ? "Edit Period" : "Add Period"}
            subtitle={`${editingPeriod.day} · Period ${editingPeriod.periodNumber}`}
            onClose={() => setEditingPeriod(null)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Start Time *</label>
                  <input
                    type="time" value={periodForm.startTime}
                    onChange={(e) => setPeriodForm((f) => ({ ...f, startTime: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>End Time *</label>
                  <input
                    type="time" value={periodForm.endTime}
                    onChange={(e) => setPeriodForm((f) => ({ ...f, endTime: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Subject *</label>
                <select
                  value={periodForm.subjectId}
                  onChange={(e) => setPeriodForm((f) => ({ ...f, subjectId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Teacher *</label>
                <select
                  value={periodForm.teacherId}
                  onChange={(e) => setPeriodForm((f) => ({ ...f, teacherId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select teacher…</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.surname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Room (optional)</label>
                <input
                  value={periodForm.room}
                  onChange={(e) => setPeriodForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="e.g. Lab 1, Hall A…"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingPeriod(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePeriod} disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Save className="w-3.5 h-3.5" /> Save Period</>
                  }
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}