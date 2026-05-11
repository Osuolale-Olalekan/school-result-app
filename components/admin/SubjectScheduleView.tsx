"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookMarked,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Save,
  Info,
} from "lucide-react";
import { TermName, SessionStatus } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  _id: string;
  name: string;
  code: string;
  hasPractical: boolean;
  department: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  section: string;
  department: string;
  subjects: Subject[];
}

interface SessionInfo {
  _id: string;
  name: string;
  status: string;
  terms: Array<{ _id: string; name: string; status: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  primary: "Primary",
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

const DEPT_COLORS: Record<string, string> = {
  general:    "bg-gray-100 text-gray-600",
  science:    "bg-blue-100 text-blue-700",
  art:        "bg-purple-100 text-purple-700",
  commercial: "bg-emerald-100 text-emerald-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubjectScheduleView() {
  const [sessions, setSessions]             = useState<SessionInfo[]>([]);
  const [classes, setClasses]               = useState<ClassInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedTerm, setSelectedTerm]     = useState<TermName>(TermName.FIRST);
  const [selectedClass, setSelectedClass]   = useState<string>("");
  const [subjects, setSubjects]             = useState<Subject[]>([]);
  const [excluded, setExcluded]             = useState<Set<string>>(new Set());
  const [teacherExcluded, setTeacherExcluded] = useState<Set<string>>(new Set()); // teacher overrides (read-only display)
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [saved, setSaved]                   = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // ── Fetch sessions on mount ───────────────────────────────────────────────

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res  = await fetch("/api/sessions");
        const json = (await res.json()) as { success: boolean; data?: SessionInfo[] };
        if (json.success && json.data) {
          setSessions(json.data);
          const active = json.data.find((s) => s.status === SessionStatus.ACTIVE) ?? json.data[0];
          if (active) {
            setSelectedSession(active._id);
            // Auto-select current term by date
            const today = new Date();
            const currentTerm = active.terms.find((t) => {
              // We don't have dates here — just pick "active" or first
              return t.status === "active";
            }) ?? active.terms[0];
            if (currentTerm) setSelectedTerm(currentTerm.name as TermName);
          }
        }
      } catch {
        setError("Failed to load sessions");
      }
    }
    void fetchSessions();
  }, []);

  // ── Fetch classes on mount ────────────────────────────────────────────────

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res  = await fetch("/api/admin/classes");
        const json = (await res.json()) as { success: boolean; data?: ClassInfo[] };
        if (json.success && json.data) {
          // Only classes that have subjects
          const withSubjects = json.data.filter((c) => c.subjects.length > 0);
          setClasses(withSubjects);
          if (withSubjects.length > 0 && withSubjects[0]) {
            setSelectedClass(withSubjects[0]._id);
          }
        }
      } catch {
        setError("Failed to load classes");
      }
    }
    void fetchClasses();
  }, []);

  // ── Fetch subject schedule when class/session/term changes ────────────────

  const fetchSchedule = useCallback(async () => {
    if (!selectedClass || !selectedSession || !selectedTerm) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res  = await fetch(
        `/api/admin/subject-schedule?classId=${selectedClass}&sessionId=${selectedSession}&term=${selectedTerm}`
      );
      const json = (await res.json()) as {
        success: boolean;
        data?: { subjects: Subject[]; excludedSubjectIds: string[] };
        error?: string;
      };
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load");
      setSubjects(json.data.subjects);
      setExcluded(new Set(json.data.excludedSubjectIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSession, selectedTerm]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  // ── Toggle subject exclusion ──────────────────────────────────────────────

  function toggleSubject(subjectId: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
    setSaved(false);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedClass || !selectedSession || !selectedTerm) return;
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/subject-schedule", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          classId:            selectedClass,
          sessionId:          selectedSession,
          term:               selectedTerm,
          excludedSubjectIds: Array.from(excluded),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const currentSession   = sessions.find((s) => s._id === selectedSession);
  const currentClass     = classes.find((c) => c._id === selectedClass);
  const activeCount      = subjects.filter((s) => !excluded.has(s._id)).length;
  const excludedCount    = excluded.size;

  // Group classes by section for the selector
  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.section]) acc[cls.section] = [];
    acc[cls.section]!.push(cls);
    return acc;
  }, {} as Record<string, ClassInfo[]>);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Subject Schedule</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configure which subjects are offered per class per term. Excluded subjects are removed from grading and totals.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-0.5">How this works</p>
          <p className="text-xs text-blue-600">
            Subjects marked as <strong>Not offered</strong> are completely excluded from report card calculations —
            they won&apost appear in the student&aposs score sheet, total obtainable, or grade. Teachers can also exclude
            individual subjects when entering results. Admin settings apply to the whole class; teacher overrides
            apply per report.
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Session selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Session</label>
          <div className="relative">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 appearance-none pr-8"
            >
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Term selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Term</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            {(["first", "second", "third"] as TermName[]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                  selectedTerm === t
                    ? "bg-[#1e3a5f] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Class selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Class</label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 appearance-none pr-8"
            >
              {Object.entries(groupedClasses)
                .sort(([a], [b]) => {
                  const order = { primary: 0, jss: 1, sss: 2 };
                  return (order[a as keyof typeof order] ?? 9) - (order[b as keyof typeof order] ?? 9);
                })
                .map(([section, sectionClasses]) => (
                  <optgroup key={section} label={SECTION_LABELS[section] ?? section}>
                    {sectionClasses.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}{cls.department !== "none" ? ` (${cls.department})` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Subject list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
          <span className="ml-3 text-sm text-gray-400">Loading subjects...</span>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">No subjects assigned to this class</p>
          <p className="text-sm mt-1">Assign subjects to this class first via Classes management.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {currentClass?.name} — {selectedTerm} Term
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeCount} offered · {excludedCount} excluded
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick actions */}
              <button
                onClick={() => setExcluded(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                All offered
              </button>
              <button
                onClick={() => setExcluded(new Set(subjects.map((s) => s._id)))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Exclude all
              </button>
            </div>
          </div>

          {/* Subject rows */}
          <div className="divide-y divide-gray-50">
            {subjects.map((subject) => {
              const isExcluded = excluded.has(subject._id);
              return (
                <div
                  key={subject._id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    isExcluded ? "bg-gray-50/80 opacity-60" : "bg-white hover:bg-gray-50/40"
                  }`}
                >
                  {/* Subject info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${isExcluded ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {subject.name}
                      </p>
                      <span className="text-xs font-mono text-gray-400">{subject.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${DEPT_COLORS[subject.department] ?? DEPT_COLORS.general}`}>
                        {subject.department}
                      </span>
                      {subject.hasPractical && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Has practical
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + toggle */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold ${isExcluded ? "text-red-500" : "text-emerald-600"}`}>
                      {isExcluded ? "Not offered" : "Offered"}
                    </span>

                    <button
                      onClick={() => toggleSubject(subject._id)}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                        isExcluded ? "bg-gray-200" : "bg-emerald-500"
                      }`}
                      title={isExcluded ? "Click to mark as offered" : "Click to exclude"}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          isExcluded ? "translate-x-0" : "translate-x-6"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between gap-3">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Saved successfully
              </div>
            )}
            {!error && !saved && (
              <p className="text-xs text-gray-400">
                Changes apply to new report cards only. Existing approved reports are unaffected.
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50 transition-colors ml-auto"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save Schedule</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}