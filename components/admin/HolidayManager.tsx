"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  PartyPopper,
  Coffee,
  School,
  HelpCircle,
  X,
} from "lucide-react";
import { TermName } from "@/types/enums";

// ─── Types ───────────────────────────────────────────────────────────────────

type CalendarEventType = "public_holiday" | "mid_term_break" | "school_event" | "other";

interface CalendarEvent {
  _id: string;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  blocksAttendance: boolean;
}

interface Session {
  _id: string;
  name: string;
  status: string;
  terms: Array<{ _id: string; name: string; status: string }>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  public_holiday: {
    label: "Public Holiday",
    icon: <PartyPopper className="w-4 h-4" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  mid_term_break: {
    label: "Mid-Term Break",
    icon: <Coffee className="w-4 h-4" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  school_event: {
    label: "School Event",
    icon: <School className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  other: {
    label: "Other",
    icon: <HelpCircle className="w-4 h-4" />,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString("en-NG", opts);
  }
  return `${s.toLocaleDateString("en-NG", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-NG", opts)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HolidayManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<TermName>(TermName.FIRST);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    type: "public_holiday" as CalendarEventType,
    startDate: "",
    endDate: "",
    blocksAttendance: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Fetch sessions ───────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions");
        const json = await res.json() as { success: boolean; data?: Session[] };
        if (json.success && json.data) {
          setSessions(json.data);
          // Auto-select active session
          const active = json.data.find((s) => s.status === "active") ?? json.data[0];
          if (active) {
            setSelectedSession(active._id);
            const activeTerm = active.terms.find((t) => t.status === "active");
            if (activeTerm) setSelectedTerm(activeTerm.name as TermName);
          }
        }
      } catch {
        setError("Failed to load sessions");
      }
    }
    void fetchSessions();
  }, []);

  // ─── Fetch events ─────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!selectedSession || !selectedTerm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/school-calendar?sessionId=${selectedSession}&term=${selectedTerm}`
      );
      const json = await res.json() as { success: boolean; data?: CalendarEvent[]; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      setEvents(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [selectedSession, selectedTerm]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // ─── Submit form ──────────────────────────────────────────────────────────

  async function handleSubmit() {
    setFormError(null);
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    if (!form.startDate) { setFormError("Start date is required"); return; }
    if (!form.endDate) { setFormError("End date is required"); return; }
    if (form.endDate < form.startDate) { setFormError("End date cannot be before start date"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/school-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession,
          term: selectedTerm,
          ...form,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");

      // Reset form and refresh
      setForm({ title: "", type: "public_holiday", startDate: "", endDate: "", blocksAttendance: true });
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Delete event ─────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/school-calendar?id=${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean };
      if (json.success) await fetchEvents();
    } finally {
      setDeleting(null);
    }
  }

  // ─── Current session's terms ──────────────────────────────────────────────

  const currentSession = sessions.find((s) => s._id === selectedSession);
  const availableTerms = currentSession?.terms ?? [];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">School Calendar</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage holidays and break days. Teachers cannot mark attendance on blocked dates.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holiday / Break
        </button>
      </div>

      {/* Session + Term filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
        >
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {(["first", "second", "third"] as TermName[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTerm(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedTerm === t
                  ? "bg-[#1e3a5f] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t} Term
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,20,40,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-gray-900">Add Holiday / Break</h2>
              <button onClick={() => { setShowForm(false); setFormError(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
              <input
                type="text"
                placeholder="e.g. Eid-el-Fitr, Mid-Term Break"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CalendarEventType }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              >
                <option value="public_holiday">Public Holiday</option>
                <option value="mid_term_break">Mid-Term Break</option>
                <option value="school_event">School Event (school open)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value, endDate: p.endDate || e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                />
              </div>
            </div>

            {/* Blocks attendance toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-700">Block attendance marking</p>
                <p className="text-xs text-gray-400">Teachers cannot mark attendance on these dates</p>
              </div>
              <button
                onClick={() => setForm((p) => ({ ...p, blocksAttendance: !p.blocksAttendance }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.blocksAttendance ? "bg-[#1e3a5f]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.blocksAttendance ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
          <span className="ml-3 text-gray-400 text-sm">Loading calendar...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No holidays or breaks added yet</p>
          <p className="text-xs mt-1">Use the button above to add public holidays, mid-term breaks, and other non-school days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const cfg = TYPE_CONFIG[event.type];
            return (
              <div
                key={event._id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
              >
                <div className={`flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${cfg.color}`}>{event.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">{formatDateRange(event.startDate, event.endDate)}</span>
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    {event.blocksAttendance && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Blocks attendance
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event._id)}
                  disabled={deleting === event._id}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-white/60 transition-colors text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  {deleting === event._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}