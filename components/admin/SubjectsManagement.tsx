"use client";

import { useEffect, useState } from "react";
import { Plus, Beaker, Pencil, Trash2, AlertTriangle, BookOpen, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  _id: string;
  name: string;
  code: string;
  hasPractical: boolean;
  department: string;
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
  department: string;
  assignedClasses: string[];
}

const EMPTY_FORM: SubjectFormData = {
  name: "", code: "", hasPractical: false, department: "general", assignedClasses: [],
};

const DEPT_OPTIONS = [
  { value: "general",    label: "General"    },
  { value: "science",    label: "Science"    },
  { value: "art",        label: "Art"        },
  { value: "commercial", label: "Commercial" },
];

const DEPT_BADGE: Record<string, string> = {
  science:    "bg-blue-50 text-blue-600 border-blue-200",
  art:        "bg-purple-50 text-purple-600 border-purple-200",
  commercial: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-900 bg-white " +
  "focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder-gray-400";

const LABEL_CLS = "block text-xs font-medium text-gray-500 mb-1.5";

// ─── Form fields ──────────────────────────────────────────────────────────────

function SubjectFormFields({
  form, classes, onChange,
}: {
  form: SubjectFormData;
  classes: Class[];
  onChange: (v: SubjectFormData) => void;
}) {
  function toggleClass(id: string) {
    onChange({
      ...form,
      assignedClasses: form.assignedClasses.includes(id)
        ? form.assignedClasses.filter((c) => c !== id)
        : [...form.assignedClasses, id],
    });
  }

  return (
    <div className="space-y-5">
      {/* Name + Code */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Subject Name *</label>
          <input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Mathematics"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Code *</label>
          <input
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. MATH"
            className={`${INPUT_CLS} uppercase`}
          />
        </div>
      </div>

      {/* Practical toggle */}
      <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
        <input
          type="checkbox"
          checked={form.hasPractical}
          onChange={(e) => onChange({ ...form, hasPractical: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 accent-amber-500"
        />
        <div>
          <p className="text-sm font-medium text-gray-700">Has practical component</p>
          <p className="text-xs text-gray-400">Adds 20 extra marks to the total</p>
        </div>
      </label>

      {/* Department */}
      <div>
        <label className={LABEL_CLS}>Department</label>
        <div className="flex flex-wrap gap-2">
          {DEPT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...form, department: opt.value })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                form.department === opt.value
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.department === "general" && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            Visible to all students regardless of department.
          </p>
        )}
      </div>

      {/* Classes */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL_CLS + " mb-0"}>Assign to Classes</label>
          {form.assignedClasses.length > 0 && (
            <span className="text-[10px] text-amber-600 font-medium">
              {form.assignedClasses.length} selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
          {classes.map((cls) => (
            <button
              key={cls._id}
              type="button"
              onClick={() => toggleClass(cls._id)}
              className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                form.assignedClasses.includes(cls._id)
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
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

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl bg-white border border-gray-100 shadow-xl overflow-y-auto" style={{ maxHeight: "92dvh" }}>
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 font-display">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubjectsManagement() {
  const [subjects, setSubjects]           = useState<Subject[]>([]);
  const [classes, setClasses]             = useState<Class[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [creating, setCreating]           = useState(false);
  const [form, setForm]                   = useState<SubjectFormData>(EMPTY_FORM);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm]           = useState<SubjectFormData>(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    void Promise.all([fetchSubjects(), fetchClasses()]);
  }, []);

  async function fetchSubjects() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/subjects");
      const json = await res.json() as { success: boolean; data?: Subject[] };
      if (json.success && json.data) setSubjects(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClasses() {
    const res  = await fetch("/api/admin/classes");
    const json = await res.json() as { success: boolean; data?: Class[] };
    if (json.success && json.data) setClasses(json.data);
  }

  async function handleCreate() {
    if (!form.name || !form.code) { toast.error("Name and code are required"); return; }
    setCreating(true);
    try {
      const res  = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject created");
        setShowCreate(false);
        setForm(EMPTY_FORM);
        void fetchSubjects();
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
      name:            subject.name,
      code:            subject.code,
      hasPractical:    subject.hasPractical,
      department:      subject.department ?? "general",
      assignedClasses: subject.assignedClasses.map((c) => c._id),
    });
  }

  async function handleEdit() {
    if (!editingSubject) return;
    if (!editForm.name || !editForm.code) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`/api/admin/subjects/${editingSubject._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject updated");
        setEditingSubject(null);
        void fetchSubjects();
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
      const res  = await fetch(`/api/admin/subjects/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Subject deleted");
        setDeleteTarget(null);
        void fetchSubjects();
      } else {
        toast.error(json.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">Subjects</h1>
            <p className="text-xs text-gray-400">{subjects.length} subjects</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded mb-4" />
              <div className="flex gap-1.5">
                <div className="h-5 w-14 bg-gray-100 rounded-full" />
                <div className="h-5 w-14 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <BookOpen className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No subjects yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Create your first subject →
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <div
              key={subject._id}
              className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all"
            >
              {/* Card top: name + action buttons */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                    {subject.name}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">{subject.code}</p>
                </div>
                {/* Actions — always visible, subtle until hover */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(subject)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: subject._id, name: subject.name })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {subject.hasPractical && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-semibold">
                    <Beaker className="w-2.5 h-2.5" /> Practical
                  </span>
                )}
                {subject.department && subject.department !== "general" && (
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${DEPT_BADGE[subject.department] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {subject.department.charAt(0).toUpperCase() + subject.department.slice(1)}
                  </span>
                )}
              </div>

              {/* Assigned classes */}
              {subject.assignedClasses.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-50">
                  {subject.assignedClasses.slice(0, 4).map((cls) => (
                    <span key={cls._id} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">
                      {cls.name}
                    </span>
                  ))}
                  {subject.assignedClasses.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px]">
                      +{subject.assignedClasses.length - 4} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-300 pt-3 border-t border-gray-50">
                  No classes assigned
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="Add Subject" onClose={() => setShowCreate(false)}>
          <div className="space-y-5">
            <SubjectFormFields form={form} classes={classes} onChange={setForm} />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Subject"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editingSubject && (
        <Modal title="Edit Subject" onClose={() => setEditingSubject(null)}>
          <div className="space-y-5">
            <SubjectFormFields form={editForm} classes={classes} onChange={setEditForm} />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditingSubject(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-xl p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-gray-900">Delete Subject?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">{deleteTarget.name}</span> will be permanently removed. This can&apos;t be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}