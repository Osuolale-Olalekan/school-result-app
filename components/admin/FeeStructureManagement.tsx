"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Banknote, Plus, Loader2, X, Save, Trash2, Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeeType = "school_fees" | "sports_levy" | "pta" | "development" | "exam_fees" | "other";

interface FeeLineItem {
  _id?:         string;
  feeType:      FeeType;
  label:        string;
  amount:       number;
  isCompulsory: boolean;
}

interface FeeStructure {
  _id:       string;
  classId:   { _id: string; name: string; section?: string } | string;
  sessionId: { _id: string; name: string } | string;
  termId:    { _id: string; name: string } | string;
  items:     FeeLineItem[];
}

interface ClassDoc   { _id: string; name: string; section?: string }
interface SessionDoc { _id: string; name: string; terms?: TermDoc[] }
interface TermDoc    { _id: string; name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const FEE_TYPE_OPTIONS: { value: FeeType; label: string }[] = [
  { value: "school_fees",  label: "School Fees"     },
  { value: "sports_levy",  label: "Sports Levy"     },
  { value: "pta",          label: "PTA Levy"         },
  { value: "development",  label: "Development Levy" },
  { value: "exam_fees",    label: "Exam Fees"        },
  { value: "other",        label: "Other"            },
];

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const LABEL_CLS = "block text-xs font-medium mb-1.5 text-gray-500";

const EMPTY_ITEM: Omit<FeeLineItem, "_id"> = {
  feeType: "school_fees", label: "", amount: 0, isCompulsory: true,
};

// ─── Item editor (shared between create + edit modals) ────────────────────────

function ItemEditor({
  items, onAdd, onRemove, onUpdate,
}: {
  items: Array<Omit<FeeLineItem, "_id">>;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: string, value: unknown) => void;
}) {
  const total = items.filter((i) => i.isCompulsory).reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Fee Item {idx + 1}
            </p>
            {items.length > 1 && (
              <button
                type="button" onClick={() => onRemove(idx)}
                className="p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Type</label>
              <select
                value={item.feeType}
                onChange={(e) => onUpdate(idx, "feeType", e.target.value)}
                className={INPUT_CLS}
              >
                {FEE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Amount (₦)</label>
              <input
                type="number" value={item.amount || ""}
                onChange={(e) => onUpdate(idx, "amount", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Label / Description</label>
            <input
              value={item.label}
              onChange={(e) => onUpdate(idx, "label", e.target.value)}
              placeholder="e.g. First Term School Fees"
              className={INPUT_CLS}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <input
              type="checkbox" checked={item.isCompulsory}
              onChange={(e) => onUpdate(idx, "isCompulsory", e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span className="text-xs text-gray-600">Compulsory</span>
          </label>
        </div>
      ))}

      <button
        type="button" onClick={onAdd}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-blue-600 bg-blue-50 border border-dashed border-blue-200 hover:bg-blue-100 transition-colors"
      >
        <Plus className="w-3 h-3" /> Add fee item
      </button>

      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs text-gray-500">Total (compulsory):</span>
        <span className="text-sm font-bold text-emerald-600">₦{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.2 }}
        className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-y-auto bg-white border border-gray-100 shadow-xl"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeeStructureManagement() {
  const [structures,    setStructures]    = useState<FeeStructure[]>([]);
  const [classes,       setClasses]       = useState<ClassDoc[]>([]);
  const [sessions,      setSessions]      = useState<SessionDoc[]>([]);
  const [terms,         setTerms]         = useState<TermDoc[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isSaving,      setIsSaving]      = useState(false);
  const [showCreate,    setShowCreate]    = useState(false);
  const [editing,       setEditing]       = useState<FeeStructure | null>(null);
  const [createForm,    setCreateForm]    = useState({ classId: "", sessionId: "", termId: "" });
  const [items,         setItems]         = useState<Array<Omit<FeeLineItem, "_id">>>([{ ...EMPTY_ITEM }]);
  const [filterSession, setFilterSession] = useState("");
  const [filterTerm,    setFilterTerm]    = useState("");

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [stRes, clRes, seRes] = await Promise.all([
        fetch(`/api/admin/fee-structure${filterSession ? `?sessionId=${filterSession}${filterTerm ? `&termId=${filterTerm}` : ""}` : ""}`),
        fetch("/api/admin/classes"),
        fetch("/api/admin/sessions"),
      ]);
      const [st, cl, se] = await Promise.all([stRes.json(), clRes.json(), seRes.json()]);
      if (st.success) setStructures(st.data ?? []);
      if (cl.success) setClasses(cl.data ?? []);
      if (se.success) setSessions(se.data ?? []);
    } catch {
      if (!silent) toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [filterSession, filterTerm]);

  useEffect(() => { void fetchAll(true); }, [fetchAll]);

  useEffect(() => {
    const s = sessions.find((s) => s._id === createForm.sessionId);
    setTerms(s?.terms ?? []);
    setCreateForm((f) => ({ ...f, termId: "" }));
  }, [createForm.sessionId, sessions]);

  function addItem()  { setItems((prev) => [...prev, { ...EMPTY_ITEM }]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: string, value: unknown) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleCreate() {
    if (!createForm.classId || !createForm.sessionId || !createForm.termId)
      return toast.error("Select class, session and term");
    if (items.some((i) => !i.label.trim() || i.amount <= 0))
      return toast.error("All fee items need a label and amount greater than 0");

    setIsSaving(true);
    try {
      const res  = await fetch("/api/admin/fee-structure", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, items }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Fee structure created");
      setShowCreate(false);
      setItems([{ ...EMPTY_ITEM }]);
      setCreateForm({ classId: "", sessionId: "", termId: "" });
      await fetchAll(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    if (items.some((i) => !i.label.trim() || i.amount <= 0))
      return toast.error("All fee items need a label and amount greater than 0");

    setIsSaving(true);
    try {
      const res  = await fetch(`/api/admin/fee-structure/${editing._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Fee structure updated");
      setEditing(null);
      await fetchAll(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee structure?")) return;
    try {
      const res  = await fetch(`/api/admin/fee-structure/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success("Fee structure deleted");
      await fetchAll(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  function openEdit(s: FeeStructure) {
    setEditing(s);
    setItems(s.items.map((i) => ({
      feeType: i.feeType, label: i.label, amount: i.amount, isCompulsory: i.isCompulsory,
    })));
  }

  function totalAmount(items: FeeLineItem[]) {
    return items.filter((i) => i.isCompulsory).reduce((s, i) => s + i.amount, 0);
  }

  function getClassName(s: FeeStructure) {
    if (typeof s.classId === "object") return `${s.classId.name}${s.classId.section ? ` (${s.classId.section})` : ""}`;
    return "—";
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">Fee Structures</h1>
            <p className="text-xs text-gray-400">{structures.length} structures</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setItems([{ ...EMPTY_ITEM }]); setCreateForm({ classId: "", sessionId: "", termId: "" }); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Structure
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className={`${INPUT_CLS} flex-1 min-w-[140px]`}
        >
          <option value="">All sessions</option>
          {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        {filterSession && (
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className={`${INPUT_CLS} flex-1 min-w-[120px]`}
          >
            <option value="">All terms</option>
            {(sessions.find((s) => s._id === filterSession)?.terms ?? []).map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : structures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <Banknote className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No fee structures yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {structures.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">{getClassName(s)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{typeof s.sessionId === "object" ? s.sessionId.name : "—"}</span>
                    <span>·</span>
                    <span>{typeof s.termId === "object" ? s.termId.name : "—"} Term</span>
                    <span>·</span>
                    <span>{s.items.length} item{s.items.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-1">
                    <p className="text-[10px] text-gray-400">Total</p>
                    <p className="text-sm font-bold text-emerald-600">
                      ₦{totalAmount(s.items).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fee item chips */}
              <div className="flex gap-1.5 flex-wrap">
                {s.items.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.isCompulsory
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {item.label}: ₦{item.amount.toLocaleString()}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="New Fee Structure" onClose={() => setShowCreate(false)}>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Class *</label>
                <select
                  value={createForm.classId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, classId: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}>Session *</label>
                  <select
                    value={createForm.sessionId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, sessionId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">Select…</option>
                    {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Term *</label>
                  <select
                    value={createForm.termId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, termId: e.target.value }))}
                    className={INPUT_CLS}
                    disabled={!createForm.sessionId}
                  >
                    <option value="">Select…</option>
                    {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Fee Items *</p>
                <ItemEditor items={items} onAdd={addItem} onRemove={removeItem} onUpdate={updateItem} />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate} disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Save className="w-3.5 h-3.5" /> Create</>
                  }
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editing && (
          <Modal
            title="Edit Fee Structure"
            subtitle={`${getClassName(editing)} · ${typeof editing.termId === "object" ? editing.termId.name : ""} Term`}
            onClose={() => setEditing(null)}
          >
            <div className="space-y-4">
              <ItemEditor items={items} onAdd={addItem} onRemove={removeItem} onUpdate={updateItem} />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate} disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  }
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}