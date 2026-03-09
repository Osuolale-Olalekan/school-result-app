"use client";

import { useEffect, useState } from "react";
import { Plus, Beaker, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  _id: string;
  name: string;
  code: string;
  hasPractical: boolean;
  assignedClasses: Array<{ _id: string; name: string }>;
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface SubjectFormData {
  name: string;
  code: string;
  hasPractical: boolean;
  assignedClasses: string[];
}

interface FormFieldsProps {
  form: SubjectFormData;
  classes: Class[];
  onChange: (updated: SubjectFormData) => void;
}

function SubjectFormFields({ form, classes, onChange }: FormFieldsProps) {
  function toggleClass(classId: string) {
    onChange({
      ...form,
      assignedClasses: form.assignedClasses.includes(classId)
        ? form.assignedClasses.filter((id) => id !== classId)
        : [...form.assignedClasses, classId],
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Mathematics"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
          <input
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. MATH"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 uppercase"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="hasPractical"
          checked={form.hasPractical}
          onChange={(e) => onChange({ ...form, hasPractical: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="hasPractical" className="text-sm text-gray-700 cursor-pointer">
          Has practical component (+20 marks)
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Classes</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {classes.map((cls) => (
            <button
              key={cls._id}
              type="button"
              onClick={() => toggleClass(cls._id)}
              className={`text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                form.assignedClasses.includes(cls._id)
                  ? "bg-amber-50 border-amber-300 text-amber-800"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM: SubjectFormData = { name: "", code: "", hasPractical: false, assignedClasses: [] };

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SubjectFormData>(EMPTY_FORM);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState<SubjectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([fetchSubjects(), fetchClasses()]);
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subjects");
      const json = await res.json() as { success: boolean; data?: Subject[] };
      if (json.success && json.data) setSubjects(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClasses() {
    const res = await fetch("/api/admin/classes");
    const json = await res.json() as { success: boolean; data?: Class[] };
    if (json.success && json.data) setClasses(json.data);
  }

  async function handleCreate() {
    if (!form.name || !form.code) { toast.error("Name and code are required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject created");
        setShowCreate(false);
        setForm(EMPTY_FORM);
        fetchSubjects();
      } else {
        toast.error(json.error ?? "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      code: subject.code,
      hasPractical: subject.hasPractical,
      assignedClasses: subject.assignedClasses.map((c) => c._id),
    });
  }

  async function handleEdit() {
    if (!editingSubject) return;
    if (!editForm.name || !editForm.code) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/subjects/${editingSubject._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject updated");
        setEditingSubject(null);
        fetchSubjects();
      } else {
        toast.error(json.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subjects/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject deleted");
        setDeleteTarget(null);
        fetchSubjects();
      } else {
        toast.error(json.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500 text-sm">{subjects.length} subjects created</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-32 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <div key={subject._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-amber-200 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <p className="text-xs font-mono text-gray-400">{subject.code}</p>
                </div>
                <div className="flex items-center gap-1">
                  {subject.hasPractical && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1">
                      <Beaker className="w-3 h-3" />
                      Practical
                    </span>
                  )}
                  <button
                    onClick={() => openEdit(subject)}
                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: subject._id, name: subject.name })}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {subject.assignedClasses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {subject.assignedClasses.map((cls) => (
                    <span key={cls._id} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                      {cls.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold text-gray-900">Create Subject</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <SubjectFormFields form={form} classes={classes} onChange={setForm} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50">
                  {creating ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold text-gray-900">Edit Subject</h2>
              <button onClick={() => setEditingSubject(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <SubjectFormFields form={editForm} classes={classes} onChange={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingSubject(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
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
                <h2 className="font-display text-lg font-bold text-gray-900">Delete Subject?</h2>
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