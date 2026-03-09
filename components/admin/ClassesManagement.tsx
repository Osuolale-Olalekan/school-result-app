"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ClassLevel, Department } from "@/types/enums";
import { toast } from "sonner";

interface ClassInfo {
  _id: string;
  name: ClassLevel;
  section: string;
  department: Department;
  capacity?: number;
  order: number;
  subjects: Array<{ _id: string; name: string }>;
  classTeacher?: { _id: string; surname: string; firstName: string; otherName: string };
}

const SECTION_LABELS = {
  primary: "Primary School",
  jss: "Junior Secondary School",
  sss: "Senior Secondary School",
};

const DEPT_COLORS = {
  [Department.NONE]: "bg-gray-100 text-gray-500",
  [Department.SCIENCE]: "bg-blue-100 text-blue-700",
  [Department.ART]: "bg-purple-100 text-purple-700",
  [Department.COMMERCIAL]: "bg-emerald-100 text-emerald-700",
};

export default function ClassesManagement() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "" as ClassLevel | "", department: Department.NONE, capacity: "" });

  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [editForm, setEditForm] = useState({ name: "" as ClassLevel | "", department: Department.NONE, capacity: "" });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/classes");
      const json = await res.json() as { success: boolean; data?: ClassInfo[] };
      if (json.success && json.data) setClasses(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name) { toast.error("Class name is required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          department: form.department,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Class created");
        setShowCreate(false);
        setForm({ name: "", department: Department.NONE, capacity: "" });
        fetchClasses();
      } else {
        toast.error(json.error ?? "Failed");
      }
    } finally {
      setCreating(false);
    }
  }

  function openEdit(cls: ClassInfo) {
    setEditingClass(cls);
    setEditForm({ name: cls.name, department: cls.department, capacity: cls.capacity?.toString() ?? "" });
  }

  async function handleEdit() {
    if (!editingClass) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${editingClass._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name || undefined,
          department: editForm.department,
          capacity: editForm.capacity ? parseInt(editForm.capacity) : undefined,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Class updated");
        setEditingClass(null);
        fetchClasses();
      } else {
        toast.error(json.error ?? "Failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/classes/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Class deleted");
        setDeleteTarget(null);
        fetchClasses();
      } else {
        toast.error(json.error ?? "Failed");
      }
    } finally {
      setDeleting(false);
    }
  }

  const grouped = classes.reduce((acc, cls) => {
    if (!acc[cls.section]) acc[cls.section] = [];
    acc[cls.section]!.push(cls);
    return acc;
  }, {} as Record<string, ClassInfo[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm">{classes.length} classes configured</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-40 bg-gray-100 rounded mb-3" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((__, j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort(([a], [b]) => {
            const order = { primary: 0, jss: 1, sss: 2 };
            return (order[a as keyof typeof order] ?? 3) - (order[b as keyof typeof order] ?? 3);
          }).map(([section, sectionClasses]) => (
            <div key={section} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-display font-semibold text-gray-700 text-sm">
                  {SECTION_LABELS[section as keyof typeof SECTION_LABELS] ?? section}
                </h3>
              </div>
              <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sectionClasses.map((cls) => (
                  <div key={cls._id} className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                      <div className="flex items-center gap-1">
                        {cls.department !== Department.NONE && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${DEPT_COLORS[cls.department]}`}>
                            {cls.department}
                          </span>
                        )}
                        <button
                          onClick={() => openEdit(cls)}
                          className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-70 group-hover:opacity-100 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: cls._id, name: cls.name })}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-70 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{cls.subjects.length} subjects</p>
                      {cls.capacity && <p>Capacity: {cls.capacity}</p>}
                      {cls.classTeacher && (
                        <p>Teacher: {cls.classTeacher.surname} {cls.classTeacher.firstName} {cls.classTeacher.otherName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-gray-900">Create Class</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value as ClassLevel })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select class...</option>
                  {Object.values(ClassLevel).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value as Department })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                >
                  {Object.values(Department).map((d) => (
                    <option key={d} value={d}>{d === Department.NONE ? "No Department" : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-gray-900">Edit Class</h2>
              <button onClick={() => setEditingClass(null)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <select
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value as ClassLevel })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                >
                  {Object.values(ClassLevel).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value as Department })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                >
                  {Object.values(Department).map((d) => (
                    <option key={d} value={d}>{d === Department.NONE ? "No Department" : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingClass(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-gray-900">Delete Class?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  You`re about to delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}