"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle, Loader2, Send, ChevronDown,
  ChevronUp, Users, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnpaidStudent {
  _id:             string;
  name:            string;
  admissionNumber: string;
  status:          string;
  amountPaid?:     number;
  amountOwed:      number;
}

interface ClassBalance {
  className:  string;
  classId:    string;
  total:      number;
  paid:       number;
  unpaid:     number;
  partial:    number;
  totalOwed:  number;
  students:   UnpaidStudent[];
}

interface SessionDoc { _id: string; name: string; terms?: TermDoc[] }
interface TermDoc    { _id: string; name: string }

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none " +
  "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 " +
  "focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

// ─── Component ────────────────────────────────────────────────────────────────

export default function OutstandingBalances() {
  const [balances,   setBalances]   = useState<ClassBalance[]>([]);
  const [sessions,   setSessions]   = useState<SessionDoc[]>([]);
  const [terms,      setTerms]      = useState<TermDoc[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [hasLoaded,  setHasLoaded]  = useState(false);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm,    setSelectedTerm]    = useState("");
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [sending,    setSending]    = useState(false);
  const [sendingClass, setSendingClass] = useState<string | null>(null);
  const [customMsg,  setCustomMsg]  = useState("");
  const [showMsgFor, setShowMsgFor] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: SessionDoc[] }) => {
        if (j.success) setSessions(j.data ?? []);
      });
  }, []);

  useEffect(() => {
    const s = sessions.find((s) => s._id === selectedSession);
    setTerms(s?.terms ?? []);
    setSelectedTerm("");
  }, [selectedSession, sessions]);

  async function loadBalances() {
    if (!selectedSession || !selectedTerm) return toast.error("Select a session and term");
    setIsLoading(true);
    setHasLoaded(false);
    try {
      const res  = await fetch(`/api/admin/outstanding-balances?sessionId=${selectedSession}&termId=${selectedTerm}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      setBalances(json.data ?? []);
      setHasLoaded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendReminders(classId?: string) {
    const key = classId ?? "all";
    setSendingClass(key);
    setSending(true);
    try {
      const body: Record<string, unknown> = {
        sessionId: selectedSession,
        termId:    selectedTerm,
        message:   customMsg.trim() || undefined,
      };
      if (classId) body.classId = classId;
      const res  = await fetch("/api/admin/fee-reminders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      toast.success(json.message ?? "Reminders sent");
      setShowMsgFor(null);
      setCustomMsg("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminders");
    } finally {
      setSending(false);
      setSendingClass(null);
    }
  }

  const totalUnpaid  = balances.reduce((s, b) => s + b.unpaid,    0);
  const totalPartial = balances.reduce((s, b) => s + b.partial,   0);
  const totalOwed    = balances.reduce((s, b) => s + b.totalOwed, 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 font-display">Outstanding Balances</h2>
          <p className="text-xs text-gray-400">Unpaid school fees by class</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-2 flex-wrap">
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className={`${INPUT_CLS} flex-1 min-w-[140px]`}
        >
          <option value="">Select session…</option>
          {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          disabled={!selectedSession}
          className={`${INPUT_CLS} flex-1 min-w-[120px] disabled:opacity-40`}
        >
          <option value="">Select term…</option>
          {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <button
          onClick={loadBalances}
          disabled={isLoading || !selectedSession || !selectedTerm}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-40 flex items-center justify-center min-w-[72px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
        </button>
      </div>

      {/* Summary stats */}
      {hasLoaded && !isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 text-center">
            <p className="text-lg font-bold text-red-600">{totalUnpaid}</p>
            <p className="text-[10px] font-medium text-red-500 mt-0.5">Unpaid</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{totalPartial}</p>
            <p className="text-[10px] font-medium text-amber-500 mt-0.5">Partial</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-3 text-center">
            <p className="text-lg font-bold text-orange-600">₦{totalOwed.toLocaleString()}</p>
            <p className="text-[10px] font-medium text-orange-500 mt-0.5">Total Owed</p>
          </div>
        </div>
      )}

      {/* Send all reminders */}
      {hasLoaded && (totalUnpaid + totalPartial) > 0 && (
        <div>
          {showMsgFor === "all" ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Optional custom message (leave blank for default)…"
                rows={3}
                className={`${INPUT_CLS} resize-none`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowMsgFor(null); setCustomMsg(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendReminders()} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {sending && sendingClass === "all"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><Bell className="w-3.5 h-3.5" /> Send to all</>
                  }
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMsgFor("all")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Send reminders to all unpaid parents
            </button>
          )}
        </div>
      )}

      {/* Class breakdown */}
      {!hasLoaded && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">Select session and term to view balances</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-600">All fees are paid! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {balances.map((b, i) => (
            <motion.div
              key={b.classId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Class header */}
              <button
                onClick={() => setExpanded(expanded === b.classId ? null : b.classId)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
                  <Users className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{b.className}</p>
                  <div className="flex items-center gap-3 text-[10px] mt-0.5 flex-wrap">
                    <span className="text-gray-400">{b.total} students</span>
                    <span className="text-red-500">{b.unpaid} unpaid</span>
                    {b.partial > 0 && <span className="text-amber-500">{b.partial} partial</span>}
                    <span className="text-orange-500 font-medium">₦{b.totalOwed.toLocaleString()} owed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMsgFor(showMsgFor === b.classId ? null : b.classId); }}
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                    title="Send reminder to this class"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  {expanded === b.classId
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </button>

              {/* Per-class reminder message */}
              <AnimatePresence>
                {showMsgFor === b.classId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-50">
                      <textarea
                        value={customMsg}
                        onChange={(e) => setCustomMsg(e.target.value)}
                        placeholder="Optional custom message…"
                        rows={2}
                        className={`${INPUT_CLS} resize-none text-xs`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowMsgFor(null); setCustomMsg(""); }}
                          className="flex-1 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => sendReminders(b.classId)} disabled={sending}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {sending && sendingClass === b.classId
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : "Send"
                          }
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Student list */}
              <AnimatePresence>
                {expanded === b.classId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                  >
                    <div className="divide-y divide-gray-50 border-t border-gray-100">
                      {b.students.map((s) => (
                        <div key={s._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{s.name}</p>
                            <p className="text-[10px] text-gray-400">#{s.admissionNumber}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                              s.status === "partial"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}>
                              {s.status}
                            </span>
                            {s.amountOwed > 0 && (
                              <p className="text-[10px] mt-0.5 text-orange-500 font-medium">
                                ₦{s.amountOwed.toLocaleString()} owed
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}