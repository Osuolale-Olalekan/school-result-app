"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Pencil } from "lucide-react";
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

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    terms: [
      { name: "first", startDate: "", endDate: "", resumptionDate: "" },
      { name: "second", startDate: "", endDate: "", resumptionDate: "" },
      { name: "third", startDate: "", endDate: "", resumptionDate: "" },
    ],
  });

  // Edit session
  const [editingSession, setEditingSession] = useState<SessionData | null>(
    null,
  );
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
      const json = (await res.json()) as {
        success: boolean;
        data?: SessionData[];
      };
      if (json.success && json.data) setSessions(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name) {
      toast.error("Session name is required");
      return;
    }
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

  // function openEditSession(session: SessionData) {
  //   setEditingSession(session);
  //   setSessionForm({
  //     name: session.name,
  //     startYear: session.startYear,
  //     endYear: session.endYear,
  //     terms: session.terms.map((t) => ({
  //       _id: t._id,
  //       status: t.status,
  //       startDate: toDateString(t.startDate),
  //       endDate: toDateString(t.endDate),
  //       resumptionDate: toDateString(t.resumptionDate),
  //       schoolDaysOpen: t.schoolDaysOpen,
  //     })),
  //   });
  // }

  function openEditSession(session: SessionData) {
    setEditingSession(session);
    setSessionForm({
      name: session.name,
      startYear: session.startYear,
      endYear: session.endYear,
      terms: TERM_NAMES.map((termName, i) => {
        const existing =
          session.terms.find((t) => t.name === termName) ?? session.terms[i];
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

  function updateTermField<K extends keyof TermFormData>(
    index: number,
    field: K,
    value: TermFormData[K],
  ) {
    const terms = [...sessionForm.terms];
    if (terms[index]) terms[index] = { ...terms[index], [field]: value };
    setSessionForm({ ...sessionForm, terms });
  }

  async function handleSaveSession() {
    if (!editingSession) return;
    if (!sessionForm.name) {
      toast.error("Session name is required");
      return;
    }
    setSavingSession(true);
    try {
      // Update session name/years
      const sessionRes = await fetch(
        `/api/admin/sessions/${editingSession._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sessionForm.name,
            startYear: sessionForm.startYear,
            endYear: sessionForm.endYear,
          }),
        },
      );
      const sessionJson = (await sessionRes.json()) as {
        success: boolean;
        error?: string;
      };
      if (!sessionJson.success) {
        toast.error(sessionJson.error ?? "Failed to update session");
        return;
      }

      // Update each term
      // for (const term of sessionForm.terms) {
      //   await fetch(`/api/admin/sessions/${editingSession._id}`, {
      //     method: "PATCH",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       termId: term._id,
      //       termStatus: term.status,
      //       termData: {
      //         startDate: term.startDate,
      //         endDate: term.endDate,
      //         resumptionDate: term.resumptionDate || undefined,
      //         schoolDaysOpen: term.schoolDaysOpen,
      //       },
      //     }),
      //   });
      // }

      // with the new version that handles both cases
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
      fetchSessions();
    } finally {
      setSavingSession(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Academic Sessions
          </h1>
          <p className="text-gray-500 text-sm">
            Manage academic years and terms
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847]"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-5 w-48 bg-gray-100 rounded mb-3" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No sessions created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-lg font-bold text-gray-900">
                      {session.name}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[session.status]}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.startYear} – {session.endYear}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditSession(session)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {session.status === SessionStatus.UPCOMING && (
                    <button
                      onClick={() =>
                        updateSessionStatus(session._id, SessionStatus.ACTIVE)
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200"
                    >
                      Activate
                    </button>
                  )}
                  {session.status === SessionStatus.ACTIVE && (
                    <button
                      onClick={() =>
                        updateSessionStatus(
                          session._id,
                          SessionStatus.COMPLETED,
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="border-t border-gray-50">
                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                  {session.terms.map((term) => (
                    <div key={term._id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                          {term.name} Term
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${TERM_STATUS_COLORS[term.status]}`}
                        >
                          {term.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        {term.startDate && (
                          <p>Start: {formatDate(term.startDate)}</p>
                        )}
                        {term.endDate && <p>End: {formatDate(term.endDate)}</p>}
                        {term.resumptionDate && (
                          <p className="text-amber-600">
                            Resumes: {formatDate(term.resumptionDate)}
                          </p>
                        )}
                        <p>
                          School days:{" "}
                          <span className="font-medium text-gray-700">
                            {term.schoolDaysOpen}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold text-gray-900">
                Create Academic Session
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. 2024/2025"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={form.startYear}
                    onChange={(e) =>
                      setForm({ ...form, startYear: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={form.endYear}
                    onChange={(e) =>
                      setForm({ ...form, endYear: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {["First", "Second", "Third"].map((termName, i) => (
                <div
                  key={termName}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-3">
                    {termName} Term
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={form.terms[i]?.startDate ?? ""}
                        onChange={(e) => {
                          const terms = [...form.terms];
                          if (terms[i]) terms[i].startDate = e.target.value;
                          setForm({ ...form, terms });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={form.terms[i]?.endDate ?? ""}
                        onChange={(e) => {
                          const terms = [...form.terms];
                          if (terms[i]) terms[i].endDate = e.target.value;
                          setForm({ ...form, terms });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Next Resumption
                      </label>
                      <input
                        type="date"
                        value={form.terms[i]?.resumptionDate ?? ""}
                        onChange={(e) => {
                          const terms = [...form.terms];
                          if (terms[i])
                            terms[i].resumptionDate = e.target.value;
                          setForm({ ...form, terms });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold text-gray-900">
                Edit Session
              </h2>
              <button
                onClick={() => setEditingSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Session info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name *
                  </label>
                  <input
                    value={sessionForm.name}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, name: e.target.value })
                    }
                    placeholder="e.g. 2024/2025"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={sessionForm.startYear}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        startYear: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={sessionForm.endYear}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        endYear: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Terms</h3>
                {sessionForm.terms.map((term, i) => (
                  <div
                    // key={term._id}
                    key={i}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {/* {editingSession.terms[i]?.name} Term */}
                        {TERM_NAMES[i]} Term
                      </h4>
                      <select
                        value={term.status}
                        onChange={(e) =>
                          updateTermField(
                            i,
                            "status",
                            e.target.value as TermStatus,
                          )
                        }
                        className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        {Object.values(TermStatus).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={term.startDate}
                          onChange={(e) =>
                            updateTermField(i, "startDate", e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={term.endDate}
                          onChange={(e) =>
                            updateTermField(i, "endDate", e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Next Resumption
                        </label>
                        <input
                          type="date"
                          value={term.resumptionDate}
                          onChange={(e) =>
                            updateTermField(i, "resumptionDate", e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        School Days Open
                      </label>
                      <input
                        type="number"
                        value={term.schoolDaysOpen}
                        onChange={(e) =>
                          updateTermField(
                            i,
                            "schoolDaysOpen",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingSession(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={savingSession}
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
