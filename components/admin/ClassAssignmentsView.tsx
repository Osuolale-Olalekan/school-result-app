"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Assignment {
  _id: string;
  teacher: { _id: string; surname: string; firstName: string; otherName: string; email: string };
  class: { _id: string; name: string; section: string };
  session: { _id: string; name: string; status: string };
  isActive: boolean;
}

interface Teacher {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  section: string;
}

interface Session {
  _id: string;
  name: string;
  status: string;
}

const SESSION_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};

export default function ClassAssignmentsView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>("active");
  const [form, setForm] = useState({ teacherId: "", classId: "", sessionId: "" });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && sessionFilter === "active") {
      const active = sessions.find((s) => s.status === "active");
      if (active) setSessionFilter(active._id);
    }
  }, [sessions]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [assignRes, teacherRes, classRes, sessionRes] = await Promise.all([
        fetch("/api/admin/class-assignments").then((r) => r.json()),
        fetch("/api/admin/users?role=teacher&limit=100").then((r) => r.json()),
        fetch("/api/admin/classes").then((r) => r.json()),
        fetch("/api/admin/sessions").then((r) => r.json()),
      ]);

      const j1 = assignRes as { success: boolean; data?: Assignment[] };
      const j2 = teacherRes as { success: boolean; data?: Teacher[] };
      const j3 = classRes as { success: boolean; data?: ClassInfo[] };
      const j4 = sessionRes as { success: boolean; data?: Session[] };

      if (j1.success && j1.data) setAssignments(j1.data);
      if (j2.success && j2.data) setTeachers(j2.data);
      if (j3.success && j3.data) setClasses(j3.data);
      if (j4.success && j4.data) setSessions(j4.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.teacherId || !form.classId || !form.sessionId) {
      toast.error("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/class-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Teacher assigned successfully");
        setShowCreate(false);
        setForm({ teacherId: "", classId: "", sessionId: "" });
        fetchAll();
      } else {
        toast.error(json.error ?? "Failed");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/class-assignments?id=${deleteTarget._id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Assignment removed successfully");
        fetchAll();
      } else {
        toast.error(json.error ?? "Failed to remove assignment");
      }
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  }

  const filteredAssignments = sessionFilter
    ? assignments.filter((a) => a.session._id === sessionFilter)
    : assignments;

  const selectedSessionForForm = sessions.find((s) => s._id === form.sessionId);

  const selectClass = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]";

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 truncate">
            Class Assignments
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Assign teachers to classes for each session
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1e3a5f] text-white text-xs sm:text-sm font-semibold hover:bg-[#152847] shrink-0"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Assign Teacher</span>
        </button>
      </div>

      {/* ── Session Filter ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 shrink-0">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Filter by Session:</span>
          </div>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f]"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Warning banner */}
        {sessionFilter && (() => {
          const sel = sessions.find((s) => s._id === sessionFilter);
          if (sel?.status === "active" && filteredAssignments.length === 0 && !loading) {
            return (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs sm:text-sm text-amber-700 font-medium">
                  ⚠️ No teachers assigned to this session yet.
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Teachers won&apos;t be able to enter results until they are assigned. Click &quot;Assign Teacher&quot; to get started.
                </p>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* ── Table (sm+) / Cards (mobile) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Desktop table — hidden on mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Session</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No assignments found</p>
                    {sessionFilter && (
                      <p className="text-xs mt-1">
                        Try selecting a different session or{" "}
                        <button onClick={() => setShowCreate(true)} className="text-[#1e3a5f] font-medium underline">
                          assign a teacher
                        </button>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">
                        {a.teacher.surname} {a.teacher.firstName} {a.teacher.otherName}
                      </p>
                      <p className="text-xs text-gray-400">{a.teacher.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-700">{a.class.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.class.section}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-700">{a.session.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${SESSION_STATUS_COLORS[a.session.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {a.session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setDeleteTarget(a)}
                        disabled={deleting === a._id}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Remove assignment"
                      >
                        {deleting === a._id
                          ? <span className="text-xs text-gray-400">Removing...</span>
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list — shown below sm */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2 animate-pulse">
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-2 mt-1">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <UserCheck className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No assignments found</p>
              {sessionFilter && (
                <p className="text-xs mt-1">
                  Try a different session or{" "}
                  <button onClick={() => setShowCreate(true)} className="text-[#1e3a5f] font-medium underline">
                    assign a teacher
                  </button>
                </p>
              )}
            </div>
          ) : (
            filteredAssignments.map((a) => (
              <div key={a._id} className="p-3 flex items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {a.teacher.surname} {a.teacher.firstName} {a.teacher.otherName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{a.teacher.email}</p>

                  {/* Class · Session */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{a.class.name}</span>
                    <span className="text-gray-300">·</span>
                    <span className="capitalize text-gray-400">{a.class.section}</span>
                    <span className="text-gray-300">·</span>
                    <span>{a.session.name}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${SESSION_STATUS_COLORS[a.session.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {a.session.status}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(a)}
                  disabled={deleting === a._id}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0 mt-0.5"
                  title="Remove assignment"
                >
                  {deleting === a._id
                    ? <span className="text-xs text-gray-400">…</span>
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Create Modal — bottom sheet on mobile ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-base sm:text-lg font-bold text-gray-900">
                Assign Teacher to Class
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Warning */}
              {selectedSessionForForm && selectedSessionForForm.status !== "active" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ You&apos;re assigning to a{" "}
                    <span className="capitalize">{selectedSessionForForm.status}</span> session.
                    Teachers can only submit results for the <strong>active</strong> session.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
                <select value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} className={selectClass}>
                  <option value="">Select session...</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className={selectClass}>
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.surname} {t.firstName} {t.otherName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className={selectClass}>
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50">
                  {creating ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          userName={`${deleteTarget.teacher.surname} ${deleteTarget.teacher.firstName} ${deleteTarget.teacher.otherName} → ${deleteTarget.class.name}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}