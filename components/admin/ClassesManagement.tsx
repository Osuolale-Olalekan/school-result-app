"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, AlertTriangle, X,
  Users, BookOpen, ChevronRight, Loader2,
  GraduationCap, CheckCircle, Clock, XCircle, FileText,
} from "lucide-react";
import { ClassLevel, Department } from "@/types/enums";
import { toast } from "sonner";

interface ClassInfo {
  _id: string;
  name: ClassLevel;
  section: string;
  department: Department;
  capacity?: number;
  order: number;
  subjects: Array<{ _id: string; name: string; code: string; hasPractical?: boolean }>;
  classTeacher?: { _id: string; surname: string; firstName: string; otherName: string };
}

interface StudentInClass {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  gender: string;
  department?: string;
  latestReport: {
    status: string;
    termName: string;
    sessionName: string;
  } | null;
}

interface ClassDetail extends ClassInfo {
  students: StudentInClass[];
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

const REPORT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  submitted: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-500", icon: FileText },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function ClassesManagement() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail panel
  const [selectedClass, setSelectedClass] = useState<ClassDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "" as ClassLevel | "", department: Department.NONE, capacity: "" });

  // Edit
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [editForm, setEditForm] = useState({ name: "" as ClassLevel | "", department: Department.NONE, capacity: "" });
  const [saving, setSaving] = useState(false);

  // Delete
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

  async function viewClass(cls: ClassInfo) {
    setLoadingDetail(true);
    setSelectedClass(null);
    try {
      const res = await fetch(`/api/admin/classes/${cls._id}`);
      const json = await res.json() as { success: boolean; data?: ClassDetail };
      if (json.success && json.data) {
        setSelectedClass(json.data);
      } else {
        toast.error("Failed to load class details");
      }
    } finally {
      setLoadingDetail(false);
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

  function openEdit(cls: ClassInfo, e: React.MouseEvent) {
    e.stopPropagation();
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

  // ── Detail Panel ────────────────────────────────────────────────────────────
  if (loadingDetail || selectedClass) {
    return (
      <div className="space-y-5">
        {/* Back button */}
        <button
          onClick={() => setSelectedClass(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Classes
        </button>

        {loadingDetail ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading class details...</p>
          </div>
        ) : selectedClass ? (
          <>
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display text-2xl font-bold text-gray-900">{selectedClass.name}</h1>
                    {selectedClass.department !== Department.NONE && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${DEPT_COLORS[selectedClass.department]}`}>
                        {selectedClass.department}
                      </span>
                    )}
                  </div>
                  {selectedClass.classTeacher && (
                    <p className="text-sm text-gray-500">
                      Class Teacher: <span className="font-medium text-gray-700">
                        {selectedClass.classTeacher.surname} {selectedClass.classTeacher.firstName} {selectedClass.classTeacher.otherName}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-700">{selectedClass.students.length}</p>
                  <p className="text-xs font-medium text-blue-600 mt-0.5">Total Students</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-purple-700">{selectedClass.subjects.length}</p>
                  <p className="text-xs font-medium text-purple-600 mt-0.5">Subjects</p>
                </div>
                {selectedClass.capacity && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-amber-700">{selectedClass.capacity}</p>
                    <p className="text-xs font-medium text-amber-600 mt-0.5">Capacity</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {/* Subjects */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">Subjects</h3>
                </div>
                <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
                  {selectedClass.subjects.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No subjects assigned</p>
                  ) : (
                    selectedClass.subjects.map((s) => (
                      <div key={s._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-700">{s.name}</span>
                        {s.hasPractical && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Prac</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Students */}
              <div className="sm:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">
                    Students ({selectedClass.students.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                  {selectedClass.students.length === 0 ? (
                    <div className="py-12 text-center">
                      <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No students in this class</p>
                    </div>
                  ) : (
                    selectedClass.students.map((student) => {
                      const statusCfg = student.latestReport
                        ? REPORT_STATUS_CONFIG[student.latestReport.status] ?? REPORT_STATUS_CONFIG.draft
                        : null;
                      return (
                        <div key={student._id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] shrink-0">
                            {student.surname.charAt(0)}{student.firstName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {student.surname} {student.firstName} {student.otherName}
                            </p>
                            <p className="text-xs text-gray-400">{student.admissionNumber}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {statusCfg && student.latestReport ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                <statusCfg.icon className="w-3 h-3" />
                                {statusCfg.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">No report</span>
                            )}
                            {student.latestReport && (
                              <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                {student.latestReport.termName} · {student.latestReport.sessionName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ── Main Classes Grid ───────────────────────────────────────────────────────
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
                  <div
                    key={cls._id}
                    onClick={() => viewClass(cls)}
                    className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                      <div className="flex items-center gap-1">
                        {cls.department !== Department.NONE && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${DEPT_COLORS[cls.department]}`}>
                            {cls.department}
                          </span>
                        )}
                        <button
                          onClick={(e) => openEdit(cls, e)}
                          className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-70 group-hover:opacity-100 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: cls._id, name: cls.name }); }}
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
                        <p>Teacher: {cls.classTeacher.surname} {cls.classTeacher.firstName}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-end mt-2 text-gray-300 group-hover:text-amber-400 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
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
              <button onClick={() => setShowCreate(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value as ClassLevel })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black">
                  <option value="">Select class...</option>
                  {Object.values(ClassLevel).map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as Department })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black">
                  {Object.values(Department).map((d) => <option key={d} value={d}>{d === Department.NONE ? "No Department" : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (optional)</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black" />
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
              <button onClick={() => setEditingClass(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Class Name</label>
                <select value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value as ClassLevel })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black">
                  {Object.values(ClassLevel).map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Department</label>
                <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value as Department })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black">
                  {Object.values(Department).map((d) => <option key={d} value={d}>{d === Department.NONE ? "No Department" : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Capacity (optional)</label>
                <input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-amber-400 text-black" />
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

      {/* Delete Modal */}
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
                  You&apos;re about to delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}