"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Assignment {
  _id: string;
  teacher: { _id: string; firstName: string; lastName: string; email: string };
  class: { _id: string; name: string; section: string };
  session: { _id: string; name: string; status: string };
  isActive: boolean;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
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

export default function ClassAssignmentsView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    sessionId: "",
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

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
      const res = await fetch(
        `/api/admin/class-assignments?id=${deleteTarget._id}`,
        { method: "DELETE" },
      );
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Class Assignments
          </h1>
          <p className="text-gray-500 text-sm">
            Assign teachers to classes for each session
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Assign Teacher
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Teacher
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Class
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Session
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No assignments yet</p>
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">
                        {a.teacher.firstName} {a.teacher.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{a.teacher.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-700">{a.class.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {a.class.section}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {a.session.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                      >
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
                        {deleting === a._id ? (
                          <span className="text-xs text-gray-400">
                            Removing...
                          </span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-gray-900">
                Assign Teacher to Class
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher *
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm({ ...form, teacherId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  value={form.classId}
                  onChange={(e) =>
                    setForm({ ...form, classId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session *
                </label>
                <select
                  value={form.sessionId}
                  onChange={(e) =>
                    setForm({ ...form, sessionId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select session...</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          userName={`${deleteTarget.teacher.firstName} ${deleteTarget.teacher.lastName} → ${deleteTarget.class.name}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}