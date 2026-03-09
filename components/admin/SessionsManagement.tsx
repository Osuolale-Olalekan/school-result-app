"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { SessionStatus, TermStatus } from "@/types/enums";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface TermData {
  _id: string;
  name: string;
  status: TermStatus;
  startDate: string;
  endDate: string;
  resumptionDate?: string;
  schoolDaysOpen: number;
}

interface SessionData {
  _id: string;
  name: string;
  status: SessionStatus;
  startYear: number;
  endYear: number;
  terms: TermData[];
  createdAt: string;
}

interface TermFormData {
  _id: string;
  status: TermStatus;
  startDate: string;
  endDate: string;
  resumptionDate: string;
  schoolDaysOpen: number;
}

interface SessionFormData {
  name: string;
  startYear: number;
  endYear: number;
  terms: TermFormData[];
}

interface CreateTermForm {
  name: string;
  startDate: string;
  endDate: string;
  resumptionDate: string;
  schoolDaysOpen: number;
}

const STATUS_COLORS = {
  [SessionStatus.UPCOMING]: "bg-gray-100 text-gray-600",
  [SessionStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [SessionStatus.COMPLETED]: "bg-blue-100 text-blue-700",
};

const TERM_STATUS_COLORS = {
  [TermStatus.UPCOMING]: "bg-gray-100 text-gray-500",
  [TermStatus.ACTIVE]: "bg-amber-100 text-amber-700",
  [TermStatus.COMPLETED]: "bg-emerald-100 text-emerald-700",
};

const TERM_NAMES = ["first", "second", "third"];

function toDateString(val?: string) {
  return val ? val.split("T")[0] : "";
}

/**
 * Validates session name:
 * - Exactly YYYY/YYYY format, nothing else
 * - Second year must be first year + 1
 * - Both years must be realistic (1900–2100)
 * - Must not duplicate an existing session
 */
function validateSessionName(
  name: string,
  existingNames: string[],
  currentName?: string, // pass when editing to exclude self
): string | null {
  const trimmed = name.trim();

  if (!trimmed) return "Session name is required";

  // Strict format: exactly 4 digits, slash, exactly 4 digits — nothing more
  if (!/^\d{4}\/\d{4}$/.test(trimmed)) {
    return "Format must be YYYY/YYYY — e.g. 2025/2026";
  }

  const [startStr, endStr] = trimmed.split("/");
  const startYear = parseInt(startStr!);
  const endYear = parseInt(endStr!);

  if (startYear < 1900 || startYear > 2100) {
    return "Start year is not valid";
  }

  if (endYear !== startYear + 1) {
    return `Second year must be ${startYear + 1} (exactly one year after ${startYear})`;
  }

  // Duplicate check — skip self when editing
  const isDuplicate = existingNames
    .filter((n) => n !== currentName)
    .some((n) => n.trim().toLowerCase() === trimmed.toLowerCase());

  if (isDuplicate) {
    return `Session "${trimmed}" already exists`;
  }

  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createNameError, setCreateNameError] = useState<string | null>(null);
  const [firstTermStartError, setFirstTermStartError] = useState<string | null>(null);
  const [firstTermEndError, setFirstTermEndError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    startYear: number;
    endYear: number;
    terms: CreateTermForm[];
  }>({
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    terms: [
      { name: "first",  startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
      { name: "second", startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
      { name: "third",  startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
    ],
  });

  // Edit form
  const [editingSession, setEditingSession] = useState<SessionData | null>(null);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormData>({
    name: "",
    startYear: 0,
    endYear: 0,
    terms: [],
  });
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const json = (await res.json()) as { success: boolean; data?: SessionData[] };
      if (json.success && json.data) {
        setSessions(json.data);
        const autoExpand = new Set(
          json.data
            .filter((s) => s.status !== SessionStatus.COMPLETED)
            .map((s) => s._id),
        );
        setExpandedIds(autoExpand);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Derive startYear/endYear from session name as user types ──
  function handleCreateNameChange(value: string) {
    const error = value.trim()
      ? validateSessionName(value, sessions.map((s) => s.name))
      : null;
    setCreateNameError(error);

    // Auto-fill start/end year if name is already valid
    const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
    if (match) {
      setForm((prev) => ({
        ...prev,
        name: value,
        startYear: parseInt(match[1]!),
        endYear: parseInt(match[2]!),
      }));
    } else {
      setForm((prev) => ({ ...prev, name: value }));
    }
  }

  function handleEditNameChange(value: string) {
    const error = value.trim()
      ? validateSessionName(value, sessions.map((s) => s.name), editingSession?.name)
      : null;
    setEditNameError(error);

    const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
    if (match) {
      setSessionForm((prev) => ({
        ...prev,
        name: value,
        startYear: parseInt(match[1]!),
        endYear: parseInt(match[2]!),
      }));
    } else {
      setSessionForm((prev) => ({ ...prev, name: value }));
    }
  }

  async function handleCreate() {
    // Validate session name
    const nameError = validateSessionName(form.name, sessions.map((s) => s.name));
    if (nameError) {
      setCreateNameError(nameError);
      return;
    }

    // Validate first term dates (required before creating)
    let hasTermError = false;
    if (!form.terms[0]?.startDate?.trim()) {
      setFirstTermStartError("First term start date is required");
      hasTermError = true;
    } else {
      setFirstTermStartError(null);
    }
    if (!form.terms[0]?.endDate?.trim()) {
      setFirstTermEndError("First term end date is required");
      hasTermError = true;
    } else {
      setFirstTermEndError(null);
    }
    if (hasTermError) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Session created successfully");
        setShowCreate(false);
        setCreateNameError(null);
        setFirstTermStartError(null);
        setFirstTermEndError(null);
        setForm({
          name: "",
          startYear: new Date().getFullYear(),
          endYear: new Date().getFullYear() + 1,
          terms: [
            { name: "first",  startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
            { name: "second", startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
            { name: "third",  startDate: "", endDate: "", resumptionDate: "", schoolDaysOpen: 0 },
          ],
        });
        fetchSessions();
      } else {
        toast.error(json.error ?? "Failed to create session");
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateSessionStatus(sessionId: string, status: SessionStatus) {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success: boolean };
      if (json.success) {
        toast.success("Session updated");
        fetchSessions();
      }
    } catch {
      toast.error("Failed to update session");
    }
  }

  function openEditSession(session: SessionData) {
    setEditingSession(session);
    setEditNameError(null);
    setSessionForm({
      name: session.name,
      startYear: session.startYear,
      endYear: session.endYear,
      terms: TERM_NAMES.map((termName, i) => {
        const existing = session.terms.find((t) => t.name === termName) ?? session.terms[i];
        return {
          _id: existing?._id ?? "",
          status: existing?.status ?? TermStatus.UPCOMING,
          startDate: toDateString(existing?.startDate),
          endDate: toDateString(existing?.endDate),
          resumptionDate: toDateString(existing?.resumptionDate),
          schoolDaysOpen: existing?.schoolDaysOpen ?? 0,
        };
      }),
    });
  }

  function updateTermField<K extends keyof TermFormData>(index: number, field: K, value: TermFormData[K]) {
    const terms = [...sessionForm.terms];
    if (terms[index]) terms[index] = { ...terms[index], [field]: value };
    setSessionForm({ ...sessionForm, terms });
  }

  async function handleSaveSession() {
    if (!editingSession) return;
    const error = validateSessionName(
      sessionForm.name,
      sessions.map((s) => s.name),
      editingSession.name,
    );
    if (error) {
      setEditNameError(error);
      return;
    }
    setSavingSession(true);
    try {
      const sessionRes = await fetch(`/api/admin/sessions/${editingSession._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionForm.name,
          startYear: sessionForm.startYear,
          endYear: sessionForm.endYear,
        }),
      });
      const sessionJson = (await sessionRes.json()) as { success: boolean; error?: string };
      if (!sessionJson.success) {
        toast.error(sessionJson.error ?? "Failed to update session");
        return;
      }

      for (const term of sessionForm.terms) {
        if (!term._id) {
          await fetch(`/api/admin/sessions/${editingSession._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addTerm: {
                name: TERM_NAMES[sessionForm.terms.indexOf(term)],
                startDate: term.startDate || undefined,
                endDate: term.endDate || undefined,
                resumptionDate: term.resumptionDate || undefined,
                schoolDaysOpen: term.schoolDaysOpen,
                status: term.status,
              },
            }),
          });
        } else {
          await fetch(`/api/admin/sessions/${editingSession._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              termId: term._id,
              termStatus: term.status,
              termData: {
                startDate: term.startDate || undefined,
                endDate: term.endDate || undefined,
                resumptionDate: term.resumptionDate || undefined,
                schoolDaysOpen: term.schoolDaysOpen,
              },
            }),
          });
        }
      }

      toast.success("Session updated");
      setEditingSession(null);
      setEditNameError(null);
      fetchSessions();
    } finally {
      setSavingSession(false);
    }
  }

  const activeSessions = sessions.filter((s) => s.status === SessionStatus.ACTIVE);
  const upcomingSessions = sessions.filter((s) => s.status === SessionStatus.UPCOMING);
  const completedSessions = sessions.filter((s) => s.status === SessionStatus.COMPLETED);

  const inputClass = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400";
  const dateInputClass = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400";
  const errorInputClass = "w-full px-3 py-2 rounded-xl border border-red-300 text-sm focus:outline-none focus:border-red-400 bg-red-50";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 truncate">
            Academic Sessions
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Manage academic years and terms</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1e3a5f] text-white text-xs sm:text-sm font-semibold hover:bg-[#152847] shrink-0"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-40 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 text-sm">No sessions created yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {[...activeSessions, ...upcomingSessions].map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              isExpanded={expandedIds.has(session._id)}
              onToggle={() => toggleExpanded(session._id)}
              onEdit={() => openEditSession(session)}
              onUpdateStatus={updateSessionStatus}
            />
          ))}

          {completedSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                Completed Sessions ({completedSessions.length})
              </p>
              {completedSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isExpanded={expandedIds.has(session._id)}
                  onToggle={() => toggleExpanded(session._id)}
                  onEdit={() => openEditSession(session)}
                  onUpdateStatus={updateSessionStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-base sm:text-lg font-bold text-gray-900">
                Create Academic Session
              </h2>
              <button
                onClick={() => { setShowCreate(false); setCreateNameError(null); setFirstTermStartError(null); setFirstTermEndError(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Session Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => handleCreateNameChange(e.target.value)}
                  placeholder="e.g. 2025/2026"
                  maxLength={9}
                  className={createNameError ? errorInputClass : inputClass}
                />
                {createNameError ? (
                  <p className="text-red-500 text-xs mt-1">{createNameError}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">
                    Format: YYYY/YYYY — second year must follow immediately (e.g. 2025/2026)
                  </p>
                )}
              </div>

              {/* Terms */}
              {["First", "Second", "Third"].map((termName, i) => {
                const isFirst = i === 0;
                const startErr = isFirst ? firstTermStartError : null;
                const endErr = isFirst ? firstTermEndError : null;
                return (
                  <div key={termName} className="border border-gray-100 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium text-gray-900 text-sm">{termName} Term</h4>
                      {isFirst && (
                        <span className="text-xs text-red-400 font-medium">* Required</span>
                      )}
                      {!isFirst && (
                        <span className="text-xs text-gray-400">(optional — can be set later)</span>
                      )}
                    </div>
                    <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date{isFirst ? " *" : ""}</label>
                        <input
                          type="date"
                          value={form.terms[i]?.startDate ?? ""}
                          onChange={(e) => {
                            const terms = [...form.terms];
                            if (terms[i]) terms[i].startDate = e.target.value;
                            setForm({ ...form, terms });
                            if (isFirst && e.target.value.trim()) setFirstTermStartError(null);
                          }}
                          className={startErr
                            ? "w-full px-2 py-1.5 rounded-lg border border-red-300 text-sm focus:outline-none focus:border-red-400 bg-red-50"
                            : dateInputClass}
                        />
                        {startErr && <p className="text-red-500 text-xs mt-1">{startErr}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date{isFirst ? " *" : ""}</label>
                        <input
                          type="date"
                          value={form.terms[i]?.endDate ?? ""}
                          onChange={(e) => {
                            const terms = [...form.terms];
                            if (terms[i]) terms[i].endDate = e.target.value;
                            setForm({ ...form, terms });
                            if (isFirst && e.target.value.trim()) setFirstTermEndError(null);
                          }}
                          className={endErr
                            ? "w-full px-2 py-1.5 rounded-lg border border-red-300 text-sm focus:outline-none focus:border-red-400 bg-red-50"
                            : dateInputClass}
                        />
                        {endErr && <p className="text-red-500 text-xs mt-1">{endErr}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Next Resumption</label>
                        <input
                          type="date"
                          value={form.terms[i]?.resumptionDate ?? ""}
                          onChange={(e) => {
                            const terms = [...form.terms];
                            if (terms[i]) terms[i].resumptionDate = e.target.value;
                            setForm({ ...form, terms });
                          }}
                          className={dateInputClass}
                        />
                      </div>
                    </div>
                    {/* School Days Open */}
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">School Days Open</label>
                      <input
                        type="number"
                        min={0}
                        value={form.terms[i]?.schoolDaysOpen ?? 0}
                        onChange={(e) => {
                          const terms = [...form.terms];
                          if (terms[i]) terms[i].schoolDaysOpen = parseInt(e.target.value) || 0;
                          setForm({ ...form, terms });
                        }}
                        className="w-full sm:w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowCreate(false); setCreateNameError(null); setFirstTermStartError(null); setFirstTermEndError(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !!createNameError || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-base sm:text-lg font-bold text-gray-900">Edit Session</h2>
              <button
                onClick={() => { setEditingSession(null); setEditNameError(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Session Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name *
                </label>
                <input
                  value={sessionForm.name}
                  onChange={(e) => handleEditNameChange(e.target.value)}
                  placeholder="e.g. 2025/2026"
                  maxLength={9}
                  className={editNameError ? errorInputClass : inputClass}
                />
                {editNameError ? (
                  <p className="text-red-500 text-xs mt-1">{editNameError}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">
                    Format: YYYY/YYYY — second year must follow immediately (e.g. 2025/2026)
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Terms</h3>
                {sessionForm.terms.map((term, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize text-sm">{TERM_NAMES[i]} Term</h4>
                      <select
                        value={term.status}
                        onChange={(e) => updateTermField(i, "status", e.target.value as TermStatus)}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                      >
                        {Object.values(TermStatus).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input type="date" value={term.startDate} onChange={(e) => updateTermField(i, "startDate", e.target.value)} className={dateInputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input type="date" value={term.endDate} onChange={(e) => updateTermField(i, "endDate", e.target.value)} className={dateInputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Next Resumption</label>
                        <input type="date" value={term.resumptionDate} onChange={(e) => updateTermField(i, "resumptionDate", e.target.value)} className={dateInputClass} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">School Days Open</label>
                      <input
                        type="number"
                        min={0}
                        value={term.schoolDaysOpen}
                        onChange={(e) => updateTermField(i, "schoolDaysOpen", parseInt(e.target.value) || 0)}
                        className="w-full sm:w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEditingSession(null); setEditNameError(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={savingSession || !!editNameError || !sessionForm.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingSession ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SessionCard ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionData;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdateStatus: (id: string, status: SessionStatus) => void;
}

function SessionCard({ session, isExpanded, onToggle, onEdit, onUpdateStatus }: SessionCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
      session.status === SessionStatus.COMPLETED ? "border-gray-100 opacity-80" : "border-gray-100"
    }`}>
      <div className="p-3 sm:p-5 flex items-center gap-2">
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 min-w-0 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-sm sm:text-lg font-bold text-gray-900 truncate">
                {session.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[session.status]}`}>
                {session.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{session.startYear} – {session.endYear}</p>
          </div>
          <div className="shrink-0 text-gray-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Edit session"
          >
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {session.status === SessionStatus.UPCOMING && (
            <button
              onClick={() => onUpdateStatus(session._id, SessionStatus.ACTIVE)}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 whitespace-nowrap"
            >
              Activate
            </button>
          )}
          {session.status === SessionStatus.ACTIVE && (
            <button
              onClick={() => onUpdateStatus(session._id, SessionStatus.COMPLETED)}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Mark Complete</span>
              <span className="sm:hidden">Complete</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-50">
          <div className="divide-y sm:divide-y-0 sm:grid sm:grid-cols-3 sm:divide-x divide-gray-50">
            {session.terms.map((term) => (
              <div key={term._id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 capitalize">{term.name} Term</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TERM_STATUS_COLORS[term.status]}`}>
                    {term.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1 text-xs text-gray-500">
                  {term.startDate && <p>Start: <span className="text-gray-700">{formatDate(term.startDate)}</span></p>}
                  {term.endDate && <p>End: <span className="text-gray-700">{formatDate(term.endDate)}</span></p>}
                  {term.resumptionDate && (
                    <p className="col-span-2 sm:col-span-1 text-amber-600">
                      Resumes: {formatDate(term.resumptionDate)}
                    </p>
                  )}
                  <p className="col-span-2 sm:col-span-1">
                    School days: <span className="font-medium text-gray-700">{term.schoolDaysOpen}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { Calendar, Plus, Pencil } from "lucide-react";
// import { SessionStatus, TermStatus } from "@/types/enums";
// import { toast } from "sonner";
// import { formatDate } from "@/lib/utils";

// interface TermData {
//   _id: string;
//   name: string;
//   status: TermStatus;
//   startDate: string;
//   endDate: string;
//   resumptionDate?: string;
//   schoolDaysOpen: number;
// }

// interface SessionData {
//   _id: string;
//   name: string;
//   status: SessionStatus;
//   startYear: number;
//   endYear: number;
//   terms: TermData[];
//   createdAt: string;
// }

// interface TermFormData {
//   _id: string;
//   status: TermStatus;
//   startDate: string;
//   endDate: string;
//   resumptionDate: string;
//   schoolDaysOpen: number;
// }

// interface SessionFormData {
//   name: string;
//   startYear: number;
//   endYear: number;
//   terms: TermFormData[];
// }

// const STATUS_COLORS = {
//   [SessionStatus.UPCOMING]: "bg-gray-100 text-gray-600",
//   [SessionStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
//   [SessionStatus.COMPLETED]: "bg-blue-100 text-blue-700",
// };

// const TERM_STATUS_COLORS = {
//   [TermStatus.UPCOMING]: "bg-gray-100 text-gray-500",
//   [TermStatus.ACTIVE]: "bg-amber-100 text-amber-700",
//   [TermStatus.COMPLETED]: "bg-emerald-100 text-emerald-700",
// };

// const TERM_NAMES = ["first", "second", "third"];

// function toDateString(val?: string) {
//   return val ? val.split("T")[0] : "";
// }

// export default function SessionsManagement() {
//   const [sessions, setSessions] = useState<SessionData[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Create
//   const [showCreate, setShowCreate] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [form, setForm] = useState({
//     name: "",
//     startYear: new Date().getFullYear(),
//     endYear: new Date().getFullYear() + 1,
//     terms: [
//       { name: "first", startDate: "", endDate: "", resumptionDate: "" },
//       { name: "second", startDate: "", endDate: "", resumptionDate: "" },
//       { name: "third", startDate: "", endDate: "", resumptionDate: "" },
//     ],
//   });

//   // Edit session
//   const [editingSession, setEditingSession] = useState<SessionData | null>(
//     null,
//   );
//   const [sessionForm, setSessionForm] = useState<SessionFormData>({
//     name: "",
//     startYear: 0,
//     endYear: 0,
//     terms: [],
//   });
//   const [savingSession, setSavingSession] = useState(false);

//   useEffect(() => {
//     fetchSessions();
//   }, []);

//   async function fetchSessions() {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/admin/sessions");
//       const json = (await res.json()) as {
//         success: boolean;
//         data?: SessionData[];
//       };
//       if (json.success && json.data) setSessions(json.data);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleCreate() {
//     if (!form.name) {
//       toast.error("Session name is required");
//       return;
//     }
//     setCreating(true);
//     try {
//       const res = await fetch("/api/admin/sessions", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       });
//       const json = (await res.json()) as { success: boolean; error?: string };
//       if (json.success) {
//         toast.success("Session created successfully");
//         setShowCreate(false);
//         fetchSessions();
//       } else {
//         toast.error(json.error ?? "Failed to create session");
//       }
//     } finally {
//       setCreating(false);
//     }
//   }

//   async function updateSessionStatus(sessionId: string, status: SessionStatus) {
//     try {
//       const res = await fetch(`/api/admin/sessions/${sessionId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status }),
//       });
//       const json = (await res.json()) as { success: boolean };
//       if (json.success) {
//         toast.success("Session updated");
//         fetchSessions();
//       }
//     } catch {
//       toast.error("Failed to update session");
//     }
//   }

//   // function openEditSession(session: SessionData) {
//   //   setEditingSession(session);
//   //   setSessionForm({
//   //     name: session.name,
//   //     startYear: session.startYear,
//   //     endYear: session.endYear,
//   //     terms: session.terms.map((t) => ({
//   //       _id: t._id,
//   //       status: t.status,
//   //       startDate: toDateString(t.startDate),
//   //       endDate: toDateString(t.endDate),
//   //       resumptionDate: toDateString(t.resumptionDate),
//   //       schoolDaysOpen: t.schoolDaysOpen,
//   //     })),
//   //   });
//   // }

//   function openEditSession(session: SessionData) {
//     setEditingSession(session);
//     setSessionForm({
//       name: session.name,
//       startYear: session.startYear,
//       endYear: session.endYear,
//       terms: TERM_NAMES.map((termName, i) => {
//         const existing =
//           session.terms.find((t) => t.name === termName) ?? session.terms[i];
//         return {
//           _id: existing?._id ?? "",
//           status: existing?.status ?? TermStatus.UPCOMING,
//           startDate: toDateString(existing?.startDate),
//           endDate: toDateString(existing?.endDate),
//           resumptionDate: toDateString(existing?.resumptionDate),
//           schoolDaysOpen: existing?.schoolDaysOpen ?? 0,
//         };
//       }),
//     });
//   }

//   function updateTermField<K extends keyof TermFormData>(
//     index: number,
//     field: K,
//     value: TermFormData[K],
//   ) {
//     const terms = [...sessionForm.terms];
//     if (terms[index]) terms[index] = { ...terms[index], [field]: value };
//     setSessionForm({ ...sessionForm, terms });
//   }

//   async function handleSaveSession() {
//     if (!editingSession) return;
//     if (!sessionForm.name) {
//       toast.error("Session name is required");
//       return;
//     }
//     setSavingSession(true);
//     try {
//       // Update session name/years
//       const sessionRes = await fetch(
//         `/api/admin/sessions/${editingSession._id}`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             name: sessionForm.name,
//             startYear: sessionForm.startYear,
//             endYear: sessionForm.endYear,
//           }),
//         },
//       );
//       const sessionJson = (await sessionRes.json()) as {
//         success: boolean;
//         error?: string;
//       };
//       if (!sessionJson.success) {
//         toast.error(sessionJson.error ?? "Failed to update session");
//         return;
//       }

//       // Update each term
//       // for (const term of sessionForm.terms) {
//       //   await fetch(`/api/admin/sessions/${editingSession._id}`, {
//       //     method: "PATCH",
//       //     headers: { "Content-Type": "application/json" },
//       //     body: JSON.stringify({
//       //       termId: term._id,
//       //       termStatus: term.status,
//       //       termData: {
//       //         startDate: term.startDate,
//       //         endDate: term.endDate,
//       //         resumptionDate: term.resumptionDate || undefined,
//       //         schoolDaysOpen: term.schoolDaysOpen,
//       //       },
//       //     }),
//       //   });
//       // }

//       // with the new version that handles both cases
//       for (const term of sessionForm.terms) {
//         if (!term._id) {
//           await fetch(`/api/admin/sessions/${editingSession._id}`, {
//             method: "PATCH",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               addTerm: {
//                 name: TERM_NAMES[sessionForm.terms.indexOf(term)],
//                 startDate: term.startDate || undefined,
//                 endDate: term.endDate || undefined,
//                 resumptionDate: term.resumptionDate || undefined,
//                 schoolDaysOpen: term.schoolDaysOpen,
//                 status: term.status,
//               },
//             }),
//           });
//         } else {
//           await fetch(`/api/admin/sessions/${editingSession._id}`, {
//             method: "PATCH",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               termId: term._id,
//               termStatus: term.status,
//               termData: {
//                 startDate: term.startDate || undefined,
//                 endDate: term.endDate || undefined,
//                 resumptionDate: term.resumptionDate || undefined,
//                 schoolDaysOpen: term.schoolDaysOpen,
//               },
//             }),
//           });
//         }
//       }

//       toast.success("Session updated");
//       setEditingSession(null);
//       fetchSessions();
//     } finally {
//       setSavingSession(false);
//     }
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-bold text-gray-900">
//             Academic Sessions
//           </h1>
//           <p className="text-gray-500 text-sm">
//             Manage academic years and terms
//           </p>
//         </div>
//         <button
//           onClick={() => setShowCreate(true)}
//           className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847]"
//         >
//           <Plus className="w-4 h-4" />
//           New Session
//         </button>
//       </div>

//       {loading ? (
//         <div className="space-y-3">
//           {Array.from({ length: 3 }).map((_, i) => (
//             <div
//               key={i}
//               className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
//             >
//               <div className="h-5 w-48 bg-gray-100 rounded mb-3" />
//               <div className="h-4 w-32 bg-gray-100 rounded" />
//             </div>
//           ))}
//         </div>
//       ) : sessions.length === 0 ? (
//         <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
//           <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
//           <p className="text-gray-500">No sessions created yet</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {sessions.map((session) => (
//             <div
//               key={session._id}
//               className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
//             >
//               <div className="p-5 flex items-start justify-between">
//                 <div>
//                   <div className="flex items-center gap-3 mb-1">
//                     <h3 className="font-display text-lg font-bold text-gray-900">
//                       {session.name}
//                     </h3>
//                     <span
//                       className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[session.status]}`}
//                     >
//                       {session.status}
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-500">
//                     {session.startYear} – {session.endYear}
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => openEditSession(session)}
//                     className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
//                   >
//                     <Pencil className="w-4 h-4" />
//                   </button>
//                   {session.status === SessionStatus.UPCOMING && (
//                     <button
//                       onClick={() =>
//                         updateSessionStatus(session._id, SessionStatus.ACTIVE)
//                       }
//                       className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200"
//                     >
//                       Activate
//                     </button>
//                   )}
//                   {session.status === SessionStatus.ACTIVE && (
//                     <button
//                       onClick={() =>
//                         updateSessionStatus(
//                           session._id,
//                           SessionStatus.COMPLETED,
//                         )
//                       }
//                       className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200"
//                     >
//                       Mark Complete
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Terms */}
//               <div className="border-t border-gray-50">
//                 <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
//                   {session.terms.map((term) => (
//                     <div key={term._id} className="p-4">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="text-sm font-semibold text-gray-700 capitalize">
//                           {term.name} Term
//                         </span>
//                         <span
//                           className={`px-2 py-0.5 rounded-full text-xs font-medium ${TERM_STATUS_COLORS[term.status]}`}
//                         >
//                           {term.status}
//                         </span>
//                       </div>
//                       <div className="space-y-1 text-xs text-gray-500">
//                         {term.startDate && (
//                           <p>Start: {formatDate(term.startDate)}</p>
//                         )}
//                         {term.endDate && <p>End: {formatDate(term.endDate)}</p>}
//                         {term.resumptionDate && (
//                           <p className="text-amber-600">
//                             Resumes: {formatDate(term.resumptionDate)}
//                           </p>
//                         )}
//                         <p>
//                           School days:{" "}
//                           <span className="font-medium text-gray-700">
//                             {term.schoolDaysOpen}
//                           </span>
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Create Session Modal */}
//       {showCreate && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
//             <div className="flex items-center justify-between p-6 border-b border-gray-100">
//               <h2 className="font-display text-lg font-bold text-gray-900">
//                 Create Academic Session
//               </h2>
//               <button
//                 onClick={() => setShowCreate(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="col-span-1">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Session Name *
//                   </label>
//                   <input
//                     value={form.name}
//                     onChange={(e) => setForm({ ...form, name: e.target.value })}
//                     placeholder="e.g. 2024/2025"
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Start Year
//                   </label>
//                   <input
//                     type="number"
//                     value={form.startYear}
//                     onChange={(e) =>
//                       setForm({ ...form, startYear: parseInt(e.target.value) })
//                     }
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     End Year
//                   </label>
//                   <input
//                     type="number"
//                     value={form.endYear}
//                     onChange={(e) =>
//                       setForm({ ...form, endYear: parseInt(e.target.value) })
//                     }
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//               </div>

//               {["First", "Second", "Third"].map((termName, i) => (
//                 <div
//                   key={termName}
//                   className="border border-gray-100 rounded-xl p-4"
//                 >
//                   <h4 className="font-medium text-gray-900 mb-3">
//                     {termName} Term
//                   </h4>
//                   <div className="grid sm:grid-cols-3 gap-3">
//                     <div>
//                       <label className="block text-xs text-gray-500 mb-1">
//                         Start Date
//                       </label>
//                       <input
//                         type="date"
//                         value={form.terms[i]?.startDate ?? ""}
//                         onChange={(e) => {
//                           const terms = [...form.terms];
//                           if (terms[i]) terms[i].startDate = e.target.value;
//                           setForm({ ...form, terms });
//                         }}
//                         className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs text-gray-500 mb-1">
//                         End Date
//                       </label>
//                       <input
//                         type="date"
//                         value={form.terms[i]?.endDate ?? ""}
//                         onChange={(e) => {
//                           const terms = [...form.terms];
//                           if (terms[i]) terms[i].endDate = e.target.value;
//                           setForm({ ...form, terms });
//                         }}
//                         className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs text-gray-500 mb-1">
//                         Next Resumption
//                       </label>
//                       <input
//                         type="date"
//                         value={form.terms[i]?.resumptionDate ?? ""}
//                         onChange={(e) => {
//                           const terms = [...form.terms];
//                           if (terms[i])
//                             terms[i].resumptionDate = e.target.value;
//                           setForm({ ...form, terms });
//                         }}
//                         className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ))}

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={() => setShowCreate(false)}
//                   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreate}
//                   disabled={creating}
//                   className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
//                 >
//                   {creating ? "Creating..." : "Create Session"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Session Modal */}
//       {editingSession && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
//             <div className="flex items-center justify-between p-6 border-b border-gray-100">
//               <h2 className="font-display text-lg font-bold text-gray-900">
//                 Edit Session
//               </h2>
//               <button
//                 onClick={() => setEditingSession(null)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               {/* Session info */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="col-span-1">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Session Name *
//                   </label>
//                   <input
//                     value={sessionForm.name}
//                     onChange={(e) =>
//                       setSessionForm({ ...sessionForm, name: e.target.value })
//                     }
//                     placeholder="e.g. 2024/2025"
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Start Year
//                   </label>
//                   <input
//                     type="number"
//                     value={sessionForm.startYear}
//                     onChange={(e) =>
//                       setSessionForm({
//                         ...sessionForm,
//                         startYear: parseInt(e.target.value),
//                       })
//                     }
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     End Year
//                   </label>
//                   <input
//                     type="number"
//                     value={sessionForm.endYear}
//                     onChange={(e) =>
//                       setSessionForm({
//                         ...sessionForm,
//                         endYear: parseInt(e.target.value),
//                       })
//                     }
//                     className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                   />
//                 </div>
//               </div>

//               {/* Terms */}
//               <div className="space-y-3">
//                 <h3 className="text-sm font-semibold text-gray-700">Terms</h3>
//                 {sessionForm.terms.map((term, i) => (
//                   <div
//                     // key={term._id}
//                     key={i}
//                     className="border border-gray-100 rounded-xl p-4"
//                   >
//                     <div className="flex items-center justify-between mb-3">
//                       <h4 className="font-medium text-gray-900 capitalize">
//                         {/* {editingSession.terms[i]?.name} Term */}
//                         {TERM_NAMES[i]} Term
//                       </h4>
//                       <select
//                         value={term.status}
//                         onChange={(e) =>
//                           updateTermField(
//                             i,
//                             "status",
//                             e.target.value as TermStatus,
//                           )
//                         }
//                         className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-amber-400"
//                       >
//                         {Object.values(TermStatus).map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="grid grid-cols-3 gap-3">
//                       <div>
//                         <label className="block text-xs text-gray-500 mb-1">
//                           Start Date
//                         </label>
//                         <input
//                           type="date"
//                           value={term.startDate}
//                           onChange={(e) =>
//                             updateTermField(i, "startDate", e.target.value)
//                           }
//                           className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-xs text-gray-500 mb-1">
//                           End Date
//                         </label>
//                         <input
//                           type="date"
//                           value={term.endDate}
//                           onChange={(e) =>
//                             updateTermField(i, "endDate", e.target.value)
//                           }
//                           className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-xs text-gray-500 mb-1">
//                           Next Resumption
//                         </label>
//                         <input
//                           type="date"
//                           value={term.resumptionDate}
//                           onChange={(e) =>
//                             updateTermField(i, "resumptionDate", e.target.value)
//                           }
//                           className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                         />
//                       </div>
//                     </div>
//                     <div className="mt-3">
//                       <label className="block text-xs text-gray-500 mb-1">
//                         School Days Open
//                       </label>
//                       <input
//                         type="number"
//                         value={term.schoolDaysOpen}
//                         onChange={(e) =>
//                           updateTermField(
//                             i,
//                             "schoolDaysOpen",
//                             parseInt(e.target.value) || 0,
//                           )
//                         }
//                         className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={() => setEditingSession(null)}
//                   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveSession}
//                   disabled={savingSession}
//                   className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
//                 >
//                   {savingSession ? "Saving..." : "Save Changes"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
