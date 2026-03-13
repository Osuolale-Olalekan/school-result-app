"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Send,
  Archive,
  Loader2,
  X,
  AlertTriangle,
  Globe,
  Users,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementStatus,
  UserRole,
} from "@/types/enums";
import type { IAnnouncement, IClass } from "@/types";

// ─── Style constants ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  AnnouncementStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  [AnnouncementStatus.DRAFT]: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  },
  [AnnouncementStatus.PUBLISHED]: {
    label: "Published",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  [AnnouncementStatus.ARCHIVED]: {
    label: "Archived",
    bg: "bg-orange-50",
    text: "text-orange-500",
    border: "border-orange-200",
  },
};

const PRIORITY_STYLES: Record<
  AnnouncementPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  [AnnouncementPriority.NORMAL]: {
    label: "Normal",
    bg: "bg-blue-50",
    text: "text-blue-500",
    border: "border-blue-200",
  },
  [AnnouncementPriority.URGENT]: {
    label: "Urgent",
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-200",
  },
};

const AUDIENCE_ICONS = {
  [AnnouncementAudience.ALL]: Globe,
  [AnnouncementAudience.ROLE]: Users,
  [AnnouncementAudience.CLASS]: BookOpen,
};

const ROLE_OPTIONS = [
  { value: UserRole.STUDENT, label: "Students" },
  { value: UserRole.TEACHER, label: "Teachers" },
  { value: UserRole.PARENT, label: "Parents" },
  { value: UserRole.ADMIN, label: "Admins" },
];

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnnouncementForm {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  targetRoles: UserRole[];
  targetClassIds: string[];
  priority: AnnouncementPriority;
  expiresAt: string;
}

const EMPTY_FORM: AnnouncementForm = {
  title: "",
  body: "",
  audience: AnnouncementAudience.ALL,
  targetRoles: [],
  targetClassIds: [],
  priority: AnnouncementPriority.NORMAL,
  expiresAt: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IAnnouncement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
        const res = await fetch(`/api/admin/announcements${params}`);
        const json = await res.json();
        if (json.success) {
          setAnnouncements(json.data ?? []);
        } else if (!silent) {
          toast.error("Failed to load announcements");
        }
      } catch {
        if (!silent) toast.error("Failed to load announcements");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/classes");
      const json = await res.json();
      if (json.success) setClasses(json.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void fetchAnnouncements(true); }, [fetchAnnouncements]);
  useEffect(() => { void fetchClasses(); }, [fetchClasses]);

  // ── Form helpers ──
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(a: IAnnouncement) {
    setEditingId(a._id);
    setForm({
      title: a.title,
      body: a.body,
      audience: a.audience,
      targetRoles: a.targetRoles ?? [],
      targetClassIds: a.targetClassIds ?? [],
      priority: a.priority,
      expiresAt: a.expiresAt
        ? new Date(a.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function toggleRole(role: UserRole) {
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter((r) => r !== role)
        : [...f.targetRoles, role],
    }));
  }

  function toggleClass(classId: string) {
    setForm((f) => ({
      ...f,
      targetClassIds: f.targetClassIds.includes(classId)
        ? f.targetClassIds.filter((c) => c !== classId)
        : [...f.targetClassIds, classId],
    }));
  }

  // ── Save ──
  async function handleSave(publishNow?: boolean) {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    if (form.audience === AnnouncementAudience.ROLE && form.targetRoles.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    if (form.audience === AnnouncementAudience.CLASS && form.targetClassIds.length === 0) {
      toast.error("Select at least one class");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        status: publishNow ? AnnouncementStatus.PUBLISHED : AnnouncementStatus.DRAFT,
        expiresAt: form.expiresAt || undefined,
      };

      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : "/api/admin/announcements";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");

      toast.success(
        publishNow
          ? "Announcement published! Notifications sent."
          : editingId
          ? "Announcement updated"
          : "Announcement saved as draft"
      );
      closeForm();
      await fetchAnnouncements(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish(a: IAnnouncement) {
    try {
      const res = await fetch(`/api/admin/announcements/${a._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: AnnouncementStatus.PUBLISHED }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Announcement published! Notifications sent.");
      await fetchAnnouncements(false);
    } catch {
      toast.error("Failed to publish");
    }
  }

  async function handleArchive(a: IAnnouncement) {
    try {
      const res = await fetch(`/api/admin/announcements/${a._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: AnnouncementStatus.ARCHIVED }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Announcement archived");
      await fetchAnnouncements(false);
    } catch {
      toast.error("Failed to archive");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/announcements/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Announcement deleted");
      setDeleteTarget(null);
      await fetchAnnouncements(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = announcements.filter(
    (a) => statusFilter === "all" || a.status === statusFilter
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 w-full min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate font-display">
              Announcements
            </h2>
            <p className="text-xs text-gray-400">
              {announcements.length} total
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New </span>Announcement
        </button>
      </div>

      {/* ── Status filter ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto">
        {["all", "draft", "published", "archived"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? "bg-white text-amber-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <Megaphone className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const statusStyle = STATUS_STYLES[a.status];
            const priorityStyle = PRIORITY_STYLES[a.priority];
            const AudienceIcon = AUDIENCE_ICONS[a.audience];
            const createdBy =
              typeof a.createdBy === "object" && a.createdBy !== null
                ? `${(a.createdBy as { surname: string; firstName: string }).surname} ${(a.createdBy as { surname: string; firstName: string }).firstName}`
                : "";

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
              >
                {/* Top row */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {a.priority === AnnouncementPriority.URGENT && (
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 text-red-500" />
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug" style={{ wordBreak: "break-word" }}>
                        {a.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                      >
                        {priorityStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {a.status === AnnouncementStatus.DRAFT && (
                      <>
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePublish(a)}
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all"
                          title="Publish"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {a.status === AnnouncementStatus.PUBLISHED && (
                      <button
                        onClick={() => handleArchive(a)}
                        className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 transition-all"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {a.status === AnnouncementStatus.ARCHIVED && (
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body preview */}
                <p
                  className="text-xs text-gray-500 line-clamp-2 mb-3"
                  dangerouslySetInnerHTML={{
                    __html: a.body.replace(/<[^>]*>/g, " ").slice(0, 140),
                  }}
                />

                {/* Meta row */}
                <div className="flex items-center gap-3 flex-wrap text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                  <span className="flex items-center gap-1">
                    <AudienceIcon className="w-3 h-3" />
                    {a.audience === AnnouncementAudience.ALL
                      ? "Everyone"
                      : a.audience === AnnouncementAudience.ROLE
                      ? (a.targetRoles ?? []).join(", ")
                      : `${(a.targetClassIds ?? []).length} class(es)`}
                  </span>
                  {a.publishedAt && (
                    <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                  )}
                  {a.expiresAt && (
                    <span>Exp. {new Date(a.expiresAt).toLocaleDateString()}</span>
                  )}
                  {createdBy && <span>By {createdBy}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && closeForm()}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
              style={{ maxHeight: "92dvh" }}
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="p-5 space-y-4">
                {/* Modal header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 font-display">
                    {editingId ? "Edit Announcement" : "New Announcement"}
                  </h3>
                  <button
                    onClick={closeForm}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className={LABEL_CLS}>Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement title"
                    className={INPUT_CLS}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className={LABEL_CLS}>Body *</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Write your announcement here..."
                    rows={4}
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className={LABEL_CLS}>Priority</label>
                  <div className="flex gap-2">
                    {Object.values(AnnouncementPriority).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize border ${
                          form.priority === p
                            ? p === AnnouncementPriority.URGENT
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {p === AnnouncementPriority.URGENT && "⚠️ "}
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className={LABEL_CLS}>Audience</label>
                  <div className="flex gap-1.5">
                    {[
                      { value: AnnouncementAudience.ALL, label: "Everyone", icon: Globe },
                      { value: AnnouncementAudience.ROLE, label: "By Role", icon: Users },
                      { value: AnnouncementAudience.CLASS, label: "By Class", icon: BookOpen },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, audience: value }))}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-all border ${
                          form.audience === value
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Role chips */}
                  {form.audience === AnnouncementAudience.ROLE && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {ROLE_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleRole(value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            form.targetRoles.includes(value)
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Class chips */}
                  {form.audience === AnnouncementAudience.CLASS && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {classes.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => toggleClass(c._id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            form.targetClassIds.includes(c._id)
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expiry */}
                <div>
                  <label className={LABEL_CLS}>Expires on (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className={INPUT_CLS}
                  />
                  <p className="text-[10px] mt-1 text-gray-400">
                    Hidden from users after this date
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 pb-2">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Save Draft"
                    )}
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Publish Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full sm:max-w-sm sm:mx-4 sm:rounded-2xl rounded-t-2xl p-5 space-y-4 bg-white border border-gray-100 shadow-xl"
            >
              {/* Drag handle */}
              <div className="flex justify-center sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-display">
                    Delete Announcement
                  </h3>
                  <p className="text-xs text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Delete{" "}
                <strong className="text-gray-900">
                  &ldquo;{deleteTarget.title}&rdquo;
                </strong>
                ?
              </p>

              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   Megaphone,
//   Plus,
//   Edit2,
//   Trash2,
//   Send,
//   Archive,
//   Loader2,
//   X,
//   AlertTriangle,
//   Globe,
//   Users,
//   BookOpen,
// } from "lucide-react";
// import { toast } from "sonner";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   AnnouncementAudience,
//   AnnouncementPriority,
//   AnnouncementStatus,
//   UserRole,
// } from "@/types/enums";
// import type { IAnnouncement, IClass } from "@/types";

// // ─── Style constants ──────────────────────────────────────────────────────────

// const STATUS_STYLES: Record<
//   AnnouncementStatus,
//   { label: string; bg: string; text: string; border: string }
// > = {
//   [AnnouncementStatus.DRAFT]: {
//     label: "Draft",
//     bg: "rgba(255,255,255,0.06)",
//     text: "rgba(245,240,232,0.5)",
//     border: "rgba(255,255,255,0.1)",
//   },
//   [AnnouncementStatus.PUBLISHED]: {
//     label: "Published",
//     bg: "rgba(16,185,129,0.12)",
//     text: "#34d399",
//     border: "rgba(16,185,129,0.25)",
//   },
//   [AnnouncementStatus.ARCHIVED]: {
//     label: "Archived",
//     bg: "rgba(249,115,22,0.10)",
//     text: "#fb923c",
//     border: "rgba(249,115,22,0.22)",
//   },
// };

// const PRIORITY_STYLES: Record<
//   AnnouncementPriority,
//   { label: string; bg: string; text: string; border: string }
// > = {
//   [AnnouncementPriority.NORMAL]: {
//     label: "Normal",
//     bg: "rgba(14,165,233,0.10)",
//     text: "#38bdf8",
//     border: "rgba(14,165,233,0.22)",
//   },
//   [AnnouncementPriority.URGENT]: {
//     label: "Urgent",
//     bg: "rgba(239,68,68,0.12)",
//     text: "#f87171",
//     border: "rgba(239,68,68,0.25)",
//   },
// };

// const AUDIENCE_ICONS = {
//   [AnnouncementAudience.ALL]: Globe,
//   [AnnouncementAudience.ROLE]: Users,
//   [AnnouncementAudience.CLASS]: BookOpen,
// };

// const ROLE_OPTIONS = [
//   { value: UserRole.STUDENT, label: "Students" },
//   { value: UserRole.TEACHER, label: "Teachers" },
//   { value: UserRole.PARENT, label: "Parents" },
//   { value: UserRole.ADMIN, label: "Admins" },
// ];

// const INPUT_CLS =
//   "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
//   "bg-white/[.04] border border-sky-500/20 text-[#f5f0e8] placeholder-white/20 " +
//   "focus:border-orange-500/50 focus:bg-white/[.07]";

// const LABEL_CLS = "block text-xs mb-1.5 text-[rgba(245,240,232,0.55)]";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface AnnouncementForm {
//   title: string;
//   body: string;
//   audience: AnnouncementAudience;
//   targetRoles: UserRole[];
//   targetClassIds: string[];
//   priority: AnnouncementPriority;
//   expiresAt: string;
// }

// const EMPTY_FORM: AnnouncementForm = {
//   title: "",
//   body: "",
//   audience: AnnouncementAudience.ALL,
//   targetRoles: [],
//   targetClassIds: [],
//   priority: AnnouncementPriority.NORMAL,
//   expiresAt: "",
// };

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function AnnouncementsManagement() {
//   const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
//   const [classes, setClasses] = useState<IClass[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
//   const [isSaving, setIsSaving] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState<IAnnouncement | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // ── Fetch announcements ──
//   // `silent` = true on initial mount so a transient 401 during session
//   // hydration doesn't flash an error toast to the user.
//   const fetchAnnouncements = useCallback(
//     async (silent = false) => {
//       if (!silent) setIsLoading(true);
//       try {
//         const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
//         const res = await fetch(`/api/admin/announcements${params}`);
//         const json = await res.json();
//         if (json.success) {
//           setAnnouncements(json.data ?? []);
//         } else if (!silent) {
//           toast.error("Failed to load announcements");
//         }
//       } catch {
//         if (!silent) toast.error("Failed to load announcements");
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [statusFilter]
//   );

//   const fetchClasses = useCallback(async () => {
//     try {
//       const res = await fetch("/api/admin/classes");
//       const json = await res.json();
//       if (json.success) setClasses(json.data ?? []);
//     } catch { /* silent */ }
//   }, []);

//   // Initial mount — silent to avoid session-hydration false errors
//   useEffect(() => {
//     void fetchAnnouncements(true);
//   }, [fetchAnnouncements]);

//   useEffect(() => {
//     void fetchClasses();
//   }, [fetchClasses]);

//   // ── Form helpers ──
//   function openCreate() {
//     setEditingId(null);
//     setForm(EMPTY_FORM);
//     setShowForm(true);
//   }

//   function openEdit(a: IAnnouncement) {
//     setEditingId(a._id);
//     setForm({
//       title: a.title,
//       body: a.body,
//       audience: a.audience,
//       targetRoles: a.targetRoles ?? [],
//       targetClassIds: a.targetClassIds ?? [],
//       priority: a.priority,
//       expiresAt: a.expiresAt
//         ? new Date(a.expiresAt).toISOString().split("T")[0]
//         : "",
//     });
//     setShowForm(true);
//   }

//   function closeForm() {
//     setShowForm(false);
//     setEditingId(null);
//     setForm(EMPTY_FORM);
//   }

//   function toggleRole(role: UserRole) {
//     setForm((f) => ({
//       ...f,
//       targetRoles: f.targetRoles.includes(role)
//         ? f.targetRoles.filter((r) => r !== role)
//         : [...f.targetRoles, role],
//     }));
//   }

//   function toggleClass(classId: string) {
//     setForm((f) => ({
//       ...f,
//       targetClassIds: f.targetClassIds.includes(classId)
//         ? f.targetClassIds.filter((c) => c !== classId)
//         : [...f.targetClassIds, classId],
//     }));
//   }

//   // ── Save (create or update) ──
//   async function handleSave(publishNow?: boolean) {
//     if (!form.title.trim() || !form.body.trim()) {
//       toast.error("Title and body are required");
//       return;
//     }
//     if (
//       form.audience === AnnouncementAudience.ROLE &&
//       form.targetRoles.length === 0
//     ) {
//       toast.error("Select at least one role");
//       return;
//     }
//     if (
//       form.audience === AnnouncementAudience.CLASS &&
//       form.targetClassIds.length === 0
//     ) {
//       toast.error("Select at least one class");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const payload = {
//         ...form,
//         status: publishNow
//           ? AnnouncementStatus.PUBLISHED
//           : AnnouncementStatus.DRAFT,
//         expiresAt: form.expiresAt || undefined,
//       };

//       const url = editingId
//         ? `/api/admin/announcements/${editingId}`
//         : "/api/admin/announcements";
//       const method = editingId ? "PATCH" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.error ?? "Failed");

//       toast.success(
//         publishNow
//           ? "Announcement published! Notifications sent."
//           : editingId
//           ? "Announcement updated"
//           : "Announcement saved as draft"
//       );
//       closeForm();
//       // User-triggered refresh — not silent
//       await fetchAnnouncements(false);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Something went wrong");
//     } finally {
//       setIsSaving(false);
//     }
//   }

//   async function handlePublish(a: IAnnouncement) {
//     try {
//       const res = await fetch(`/api/admin/announcements/${a._id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: AnnouncementStatus.PUBLISHED }),
//       });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.error);
//       toast.success("Announcement published! Notifications sent.");
//       await fetchAnnouncements(false);
//     } catch {
//       toast.error("Failed to publish");
//     }
//   }

//   async function handleArchive(a: IAnnouncement) {
//     try {
//       const res = await fetch(`/api/admin/announcements/${a._id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: AnnouncementStatus.ARCHIVED }),
//       });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.error);
//       toast.success("Announcement archived");
//       await fetchAnnouncements(false);
//     } catch {
//       toast.error("Failed to archive");
//     }
//   }

//   async function handleDelete() {
//     if (!deleteTarget) return;
//     setIsDeleting(true);
//     try {
//       const res = await fetch(
//         `/api/admin/announcements/${deleteTarget._id}`,
//         { method: "DELETE" }
//       );
//       const json = await res.json();
//       if (!json.success) throw new Error(json.error);
//       toast.success("Announcement deleted");
//       setDeleteTarget(null);
//       await fetchAnnouncements(false);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Failed to delete");
//     } finally {
//       setIsDeleting(false);
//     }
//   }

//   const filtered = announcements.filter(
//     (a) => statusFilter === "all" || a.status === statusFilter
//   );

//   // ─── Render ───────────────────────────────────────────────────────────────

//   return (
//     <div
//       className="space-y-4 w-full min-w-0 rounded-2xl p-4 lg:p-6"
//       style={{
//         background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
//         border: "1px solid rgba(14,165,233,0.12)",
//       }}
//     >

//       {/* ── Header ── */}
//       <div className="flex items-center justify-between gap-2 flex-wrap">
//         <div className="flex items-center gap-2 min-w-0">
//           <div
//             className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
//             style={{
//               background: "rgba(249,115,22,0.15)",
//               border: "1px solid rgba(249,115,22,0.25)",
//             }}
//           >
//             <Megaphone className="w-4 h-4" style={{ color: "#f97316" }} />
//           </div>
//           <div className="min-w-0">
//             <h2
//               className="text-base font-bold truncate"
//               style={{ color: "#f5f0e8" }}
//             >
//               Announcements
//             </h2>
//             <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
//               {announcements.length} total
//             </p>
//           </div>
//         </div>
//         <button
//           onClick={openCreate}
//           className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all flex-shrink-0"
//           style={{
//             background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//             boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
//           }}
//         >
//           <Plus className="w-3.5 h-3.5" />
//           <span className="hidden xs:inline">New </span>Announcement
//         </button>
//       </div>

//       {/* ── Status filter ── */}
//       <div
//         className="flex gap-1 p-1 rounded-xl overflow-x-auto"
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: "1px solid rgba(14,165,233,0.12)",
//         }}
//       >
//         {["all", "draft", "published", "archived"].map((s) => (
//           <button
//             key={s}
//             onClick={() => setStatusFilter(s)}
//             className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
//             style={
//               statusFilter === s
//                 ? {
//                     background: "rgba(249,115,22,0.2)",
//                     color: "#f97316",
//                     border: "1px solid rgba(249,115,22,0.3)",
//                   }
//                 : {
//                     color: "rgba(245,240,232,0.4)",
//                     border: "1px solid transparent",
//                   }
//             }
//           >
//             {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* ── List ── */}
//       {isLoading ? (
//         <div className="flex items-center justify-center py-16">
//           <Loader2
//             className="w-6 h-6 animate-spin"
//             style={{ color: "#f97316" }}
//           />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div
//           className="flex flex-col items-center justify-center py-14 rounded-2xl"
//           style={{
//             border: "1px dashed rgba(14,165,233,0.2)",
//             background: "rgba(255,255,255,0.02)",
//           }}
//         >
//           <Megaphone
//             className="w-8 h-8 mb-2"
//             style={{ color: "rgba(245,240,232,0.15)" }}
//           />
//           <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
//             No announcements yet
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {filtered.map((a) => {
//             const statusStyle = STATUS_STYLES[a.status];
//             const priorityStyle = PRIORITY_STYLES[a.priority];
//             const AudienceIcon = AUDIENCE_ICONS[a.audience];
//             const createdBy =
//               typeof a.createdBy === "object" && a.createdBy !== null
//                 ? `${(a.createdBy as { surname: string; firstName: string }).surname} ${(a.createdBy as { surname: string; firstName: string }).firstName}`
//                 : "";

//             return (
//               <motion.div
//                 key={a._id}
//                 initial={{ opacity: 0, y: 4 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="p-3 rounded-2xl"
//                 style={{
//                   background: "rgba(255,255,255,0.03)",
//                   border: "1px solid rgba(14,165,233,0.1)",
//                 }}
//               >
//                 {/* Top row: title + action buttons */}
//                 <div className="flex items-start gap-2 mb-2">
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-1.5 flex-wrap mb-1">
//                       {a.priority === AnnouncementPriority.URGENT && (
//                         <AlertTriangle
//                           className="w-3 h-3 flex-shrink-0"
//                           style={{ color: "#f87171" }}
//                         />
//                       )}
//                       <h3
//                         className="text-sm font-semibold leading-snug"
//                         style={{ color: "#f5f0e8", wordBreak: "break-word" }}
//                       >
//                         {a.title}
//                       </h3>
//                     </div>
//                     {/* Badges */}
//                     <div className="flex items-center gap-1.5 flex-wrap">
//                       <span
//                         className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
//                         style={{
//                           background: statusStyle.bg,
//                           color: statusStyle.text,
//                           border: `1px solid ${statusStyle.border}`,
//                         }}
//                       >
//                         {statusStyle.label}
//                       </span>
//                       <span
//                         className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
//                         style={{
//                           background: priorityStyle.bg,
//                           color: priorityStyle.text,
//                           border: `1px solid ${priorityStyle.border}`,
//                         }}
//                       >
//                         {priorityStyle.label}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Actions — stacked vertically on tiny screens */}
//                   <div className="flex flex-col gap-1 flex-shrink-0">
//                     {a.status === AnnouncementStatus.DRAFT && (
//                       <>
//                         <button
//                           onClick={() => openEdit(a)}
//                           className="p-1.5 rounded-lg transition-all"
//                           style={{
//                             color: "rgba(245,240,232,0.4)",
//                             background: "rgba(255,255,255,0.04)",
//                           }}
//                           title="Edit"
//                         >
//                           <Edit2 className="w-3.5 h-3.5" />
//                         </button>
//                         <button
//                           onClick={() => handlePublish(a)}
//                           className="p-1.5 rounded-lg transition-all"
//                           style={{
//                             color: "#34d399",
//                             background: "rgba(16,185,129,0.08)",
//                           }}
//                           title="Publish"
//                         >
//                           <Send className="w-3.5 h-3.5" />
//                         </button>
//                         <button
//                           onClick={() => setDeleteTarget(a)}
//                           className="p-1.5 rounded-lg transition-all"
//                           style={{
//                             color: "#f87171",
//                             background: "rgba(239,68,68,0.08)",
//                           }}
//                           title="Delete"
//                         >
//                           <Trash2 className="w-3.5 h-3.5" />
//                         </button>
//                       </>
//                     )}
//                     {a.status === AnnouncementStatus.PUBLISHED && (
//                       <button
//                         onClick={() => handleArchive(a)}
//                         className="p-1.5 rounded-lg transition-all"
//                         style={{
//                           color: "#fb923c",
//                           background: "rgba(249,115,22,0.08)",
//                         }}
//                         title="Archive"
//                       >
//                         <Archive className="w-3.5 h-3.5" />
//                       </button>
//                     )}
//                     {a.status === AnnouncementStatus.ARCHIVED && (
//                       <button
//                         onClick={() => setDeleteTarget(a)}
//                         className="p-1.5 rounded-lg transition-all"
//                         style={{
//                           color: "#f87171",
//                           background: "rgba(239,68,68,0.08)",
//                         }}
//                         title="Delete"
//                       >
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Body preview */}
//                 <p
//                   className="text-xs line-clamp-2 mb-2"
//                   style={{ color: "rgba(245,240,232,0.45)" }}
//                   dangerouslySetInnerHTML={{
//                     __html: a.body.replace(/<[^>]*>/g, " ").slice(0, 140),
//                   }}
//                 />

//                 {/* Meta row */}
//                 <div
//                   className="flex items-center gap-2 flex-wrap text-[10px]"
//                   style={{ color: "rgba(245,240,232,0.35)" }}
//                 >
//                   <span className="flex items-center gap-1">
//                     <AudienceIcon className="w-3 h-3" />
//                     {a.audience === AnnouncementAudience.ALL
//                       ? "Everyone"
//                       : a.audience === AnnouncementAudience.ROLE
//                       ? (a.targetRoles ?? []).join(", ")
//                       : `${(a.targetClassIds ?? []).length} class(es)`}
//                   </span>
//                   {a.publishedAt && (
//                     <span>
//                       {new Date(a.publishedAt).toLocaleDateString()}
//                     </span>
//                   )}
//                   {a.expiresAt && (
//                     <span>
//                       Exp. {new Date(a.expiresAt).toLocaleDateString()}
//                     </span>
//                   )}
//                   {createdBy && <span>By {createdBy}</span>}
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       )}

//       {/* ── Create / Edit Modal ── */}
//       <AnimatePresence>
//         {showForm && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
//             style={{
//               background: "rgba(0,0,0,0.75)",
//               backdropFilter: "blur(4px)",
//               padding: "0",
//             }}
//             onClick={(e) => e.target === e.currentTarget && closeForm()}
//           >
//             <motion.div
//               initial={{ y: 40, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 40, opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto"
//               style={{
//                 maxHeight: "92dvh",
//                 background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
//                 border: "1px solid rgba(14,165,233,0.15)",
//               }}
//             >
//               {/* Drag handle (mobile) */}
//               <div className="flex justify-center pt-3 pb-1 sm:hidden">
//                 <div
//                   className="w-10 h-1 rounded-full"
//                   style={{ background: "rgba(255,255,255,0.15)" }}
//                 />
//               </div>

//               <div className="p-4 space-y-4">
//                 {/* Modal header */}
//                 <div className="flex items-center justify-between">
//                   <h3
//                     className="text-sm font-bold"
//                     style={{ color: "#f5f0e8" }}
//                   >
//                     {editingId ? "Edit Announcement" : "New Announcement"}
//                   </h3>
//                   <button
//                     onClick={closeForm}
//                     className="p-1.5 rounded-lg transition-all"
//                     style={{
//                       color: "rgba(245,240,232,0.4)",
//                       background: "rgba(255,255,255,0.05)",
//                     }}
//                   >
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>

//                 {/* Title */}
//                 <div>
//                   <label className={LABEL_CLS}>Title *</label>
//                   <input
//                     value={form.title}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, title: e.target.value }))
//                     }
//                     placeholder="Announcement title"
//                     className={INPUT_CLS}
//                   />
//                 </div>

//                 {/* Body */}
//                 <div>
//                   <label className={LABEL_CLS}>Body *</label>
//                   <textarea
//                     value={form.body}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, body: e.target.value }))
//                     }
//                     placeholder="Write your announcement here..."
//                     rows={4}
//                     className={`${INPUT_CLS} resize-none`}
//                   />
//                 </div>

//                 {/* Priority */}
//                 <div>
//                   <label className={LABEL_CLS}>Priority</label>
//                   <div className="flex gap-2">
//                     {Object.values(AnnouncementPriority).map((p) => (
//                       <button
//                         key={p}
//                         type="button"
//                         onClick={() => setForm((f) => ({ ...f, priority: p }))}
//                         className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
//                         style={
//                           form.priority === p
//                             ? {
//                                 background:
//                                   p === AnnouncementPriority.URGENT
//                                     ? "rgba(239,68,68,0.2)"
//                                     : "rgba(14,165,233,0.18)",
//                                 color:
//                                   p === AnnouncementPriority.URGENT
//                                     ? "#f87171"
//                                     : "#38bdf8",
//                                 border: `1px solid ${
//                                   p === AnnouncementPriority.URGENT
//                                     ? "rgba(239,68,68,0.35)"
//                                     : "rgba(14,165,233,0.3)"
//                                 }`,
//                               }
//                             : {
//                                 background: "rgba(255,255,255,0.04)",
//                                 color: "rgba(245,240,232,0.4)",
//                                 border: "1px solid rgba(255,255,255,0.08)",
//                               }
//                         }
//                       >
//                         {p === AnnouncementPriority.URGENT && "⚠️ "}
//                         {p.charAt(0).toUpperCase() + p.slice(1)}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Audience */}
//                 <div>
//                   <label className={LABEL_CLS}>Audience</label>
//                   <div className="flex gap-1.5">
//                     {[
//                       {
//                         value: AnnouncementAudience.ALL,
//                         label: "Everyone",
//                         icon: Globe,
//                       },
//                       {
//                         value: AnnouncementAudience.ROLE,
//                         label: "By Role",
//                         icon: Users,
//                       },
//                       {
//                         value: AnnouncementAudience.CLASS,
//                         label: "By Class",
//                         icon: BookOpen,
//                       },
//                     ].map(({ value, label, icon: Icon }) => (
//                       <button
//                         key={value}
//                         type="button"
//                         onClick={() =>
//                           setForm((f) => ({ ...f, audience: value }))
//                         }
//                         className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-all"
//                         style={
//                           form.audience === value
//                             ? {
//                                 background: "rgba(249,115,22,0.18)",
//                                 color: "#f97316",
//                                 border: "1px solid rgba(249,115,22,0.3)",
//                               }
//                             : {
//                                 background: "rgba(255,255,255,0.04)",
//                                 color: "rgba(245,240,232,0.4)",
//                                 border: "1px solid rgba(255,255,255,0.08)",
//                               }
//                         }
//                       >
//                         <Icon className="w-3.5 h-3.5" />
//                         {label}
//                       </button>
//                     ))}
//                   </div>

//                   {/* Role chips */}
//                   {form.audience === AnnouncementAudience.ROLE && (
//                     <div className="mt-2 flex gap-1.5 flex-wrap">
//                       {ROLE_OPTIONS.map(({ value, label }) => (
//                         <button
//                           key={value}
//                           type="button"
//                           onClick={() => toggleRole(value)}
//                           className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
//                           style={
//                             form.targetRoles.includes(value)
//                               ? {
//                                   background: "rgba(14,165,233,0.18)",
//                                   color: "#38bdf8",
//                                   border: "1px solid rgba(14,165,233,0.3)",
//                                 }
//                               : {
//                                   background: "rgba(255,255,255,0.04)",
//                                   color: "rgba(245,240,232,0.4)",
//                                   border: "1px solid rgba(255,255,255,0.08)",
//                                 }
//                           }
//                         >
//                           {label}
//                         </button>
//                       ))}
//                     </div>
//                   )}

//                   {/* Class chips */}
//                   {form.audience === AnnouncementAudience.CLASS && (
//                     <div className="mt-2 flex gap-1.5 flex-wrap">
//                       {classes.map((c) => (
//                         <button
//                           key={c._id}
//                           type="button"
//                           onClick={() => toggleClass(c._id)}
//                           className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
//                           style={
//                             form.targetClassIds.includes(c._id)
//                               ? {
//                                   background: "rgba(14,165,233,0.18)",
//                                   color: "#38bdf8",
//                                   border: "1px solid rgba(14,165,233,0.3)",
//                                 }
//                               : {
//                                   background: "rgba(255,255,255,0.04)",
//                                   color: "rgba(245,240,232,0.4)",
//                                   border: "1px solid rgba(255,255,255,0.08)",
//                                 }
//                           }
//                         >
//                           {c.name}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Expiry */}
//                 <div>
//                   <label className={LABEL_CLS}>Expires on (optional)</label>
//                   <input
//                     type="date"
//                     value={form.expiresAt}
//                     onChange={(e) =>
//                       setForm((f) => ({ ...f, expiresAt: e.target.value }))
//                     }
//                     className={INPUT_CLS}
//                     style={{ colorScheme: "dark" }}
//                   />
//                   <p
//                     className="text-[10px] mt-1"
//                     style={{ color: "rgba(245,240,232,0.3)" }}
//                   >
//                     Hidden from users after this date
//                   </p>
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 pt-1 pb-2">
//                   <button
//                     onClick={() => handleSave(false)}
//                     disabled={isSaving}
//                     className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
//                     style={{
//                       background: "rgba(255,255,255,0.05)",
//                       color: "rgba(245,240,232,0.7)",
//                       border: "1px solid rgba(255,255,255,0.1)",
//                     }}
//                   >
//                     {isSaving ? (
//                       <Loader2 className="w-4 h-4 animate-spin mx-auto" />
//                     ) : (
//                       "Save Draft"
//                     )}
//                   </button>
//                   <button
//                     onClick={() => handleSave(true)}
//                     disabled={isSaving}
//                     className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
//                     style={{
//                       background:
//                         "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
//                       boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
//                     }}
//                   >
//                     {isSaving ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <>
//                         <Send className="w-3.5 h-3.5" /> Publish Now
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── Delete Confirm Modal ── */}
//       <AnimatePresence>
//         {deleteTarget && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
//             style={{
//               background: "rgba(0,0,0,0.75)",
//               backdropFilter: "blur(4px)",
//             }}
//             onClick={(e) =>
//               e.target === e.currentTarget && setDeleteTarget(null)
//             }
//           >
//             <motion.div
//               initial={{ y: 40, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 40, opacity: 0 }}
//               transition={{ duration: 0.18 }}
//               className="w-full sm:max-w-sm sm:mx-4 sm:rounded-2xl rounded-t-2xl p-5 space-y-4"
//               style={{
//                 background: "linear-gradient(160deg, #0f1923 0%, #0a1118 100%)",
//                 border: "1px solid rgba(239,68,68,0.2)",
//               }}
//             >
//               {/* Drag handle */}
//               <div className="flex justify-center sm:hidden">
//                 <div
//                   className="w-10 h-1 rounded-full"
//                   style={{ background: "rgba(255,255,255,0.15)" }}
//                 />
//               </div>

//               <div className="flex items-center gap-3">
//                 <div
//                   className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
//                   style={{
//                     background: "rgba(239,68,68,0.12)",
//                     border: "1px solid rgba(239,68,68,0.25)",
//                   }}
//                 >
//                   <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
//                 </div>
//                 <div>
//                   <h3
//                     className="text-sm font-bold"
//                     style={{ color: "#f5f0e8" }}
//                   >
//                     Delete Announcement
//                   </h3>
//                   <p
//                     className="text-xs"
//                     style={{ color: "rgba(245,240,232,0.45)" }}
//                   >
//                     This action cannot be undone
//                   </p>
//                 </div>
//               </div>

//               <p className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>
//                 Delete{" "}
//                 <strong style={{ color: "#f5f0e8" }}>
//                   &ldquo;{deleteTarget.title}&rdquo;
//                 </strong>
//                 ?
//               </p>

//               <div className="flex gap-2 pb-1">
//                 <button
//                   onClick={() => setDeleteTarget(null)}
//                   disabled={isDeleting}
//                   className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
//                   style={{
//                     background: "rgba(255,255,255,0.05)",
//                     color: "rgba(245,240,232,0.6)",
//                     border: "1px solid rgba(255,255,255,0.08)",
//                   }}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   disabled={isDeleting}
//                   className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
//                   style={{
//                     background: "rgba(239,68,68,0.2)",
//                     color: "#f87171",
//                     border: "1px solid rgba(239,68,68,0.3)",
//                   }}
//                 >
//                   {isDeleting ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     "Delete"
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }