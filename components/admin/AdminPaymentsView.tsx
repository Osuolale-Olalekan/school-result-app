"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, CheckCircle, AlertCircle, Filter,
  ChevronDown, Banknote, FileText,
} from "lucide-react";
import { PaymentStatus } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type PaymentType = "school_fees" | "report_card";

interface PaymentRecord {
  _id: string;
  student: {
    _id: string;
    surname: string;
    firstName: string;
    otherName: string;
    admissionNumber: string;
    currentClass?: { _id: string; name: string };
  };
  session: { _id: string; name: string };
  term: { _id: string; name: string };
  type: PaymentType;
  status: PaymentStatus;
  amount?: number;
  paymentMethod?: "manual" | "paystack";
  markedBy?: { surname: string; firstName: string; otherName: string };
  markedAt?: string;
  paidAt?: string;
  note?: string;
}

interface Session { _id: string; name: string; terms: Term[] }
interface Term { _id: string; name: string }
interface Class { _id: string; name: string; section: string }

const STATUS_COLORS = {
  [PaymentStatus.PAID]: "bg-emerald-100 text-emerald-700",
  [PaymentStatus.UNPAID]: "bg-red-100 text-red-700",
  [PaymentStatus.PARTIAL]: "bg-amber-100 text-amber-700",
};

const TAB_CONFIG: { label: string; shortLabel: string; value: PaymentType; icon: React.ReactNode; description: string }[] = [
  {
    label: "School Fees",
    shortLabel: "Fees",
    value: "school_fees",
    icon: <Banknote className="w-4 h-4" />,
    description: "Track and manage school fees payments",
  },
  {
    label: "Report Card Payments",
    shortLabel: "Report Cards",
    value: "report_card",
    icon: <FileText className="w-4 h-4" />,
    description: "Manage report card access payments",
  },
];

export default function AdminPaymentsView() {
  const [activeTab, setActiveTab] = useState<PaymentType>("school_fees");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [markModal, setMarkModal] = useState<PaymentRecord | null>(null);
  const [markForm, setMarkForm] = useState({
    status: PaymentStatus.PAID,
    amount: "",
    note: "",
  });
  const [markLoading, setMarkLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Session[] }) => {
        if (j.success && j.data) setSessions(j.data);
      });
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Class[] }) => {
        if (j.success && j.data) setClasses(j.data);
      });
  }, []);

  useEffect(() => {
    setPayments([]);
    setHasSearched(false);
    setSelectedIds(new Set());
  }, [activeTab]);

  const selectedSessionData = sessions.find((s) => s._id === selectedSession);
  const terms = selectedSessionData?.terms ?? [];

  async function fetchPayments() {
    if (!selectedSession || !selectedTerm) {
      toast.error("Please select a session and term first");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams({
        sessionId: selectedSession,
        termId: selectedTerm,
        type: activeTab,
        ...(selectedClass && { classId: selectedClass }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/payments?${params}`);
      const json = await res.json() as { success: boolean; data?: PaymentRecord[] };
      if (json.success && json.data) setPayments(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleMark() {
    if (!markModal) return;
    setMarkLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: markModal.student._id,
          sessionId: markModal.session._id,
          termId: markModal.term._id,
          type: activeTab,
          status: markForm.status,
          amount: markForm.amount ? parseFloat(markForm.amount) : undefined,
          note: markForm.note,
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Payment updated successfully");
        setMarkModal(null);
        fetchPayments();
      } else {
        toast.error(json.error ?? "Failed to update payment");
      }
    } finally {
      setMarkLoading(false);
    }
  }

  async function handleBulkMark(status: PaymentStatus) {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map((paymentId) => {
        const payment = payments.find((p) => p._id === paymentId);
        if (!payment) return Promise.resolve();
        return fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: payment.student._id,
            sessionId: payment.session._id,
            termId: payment.term._id,
            type: activeTab,
            status,
          }),
        });
      });
      await Promise.all(promises);
      toast.success(`${selectedIds.size} payment(s) marked as ${status}`);
      setSelectedIds(new Set());
      fetchPayments();
    } catch {
      toast.error("Some payments failed to update");
    } finally {
      setBulkLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.size === payments.length
        ? new Set()
        : new Set(payments.map((p) => p._id))
    );
  }

  const paid = payments.filter((p) => p.status === PaymentStatus.PAID).length;
  const unpaid = payments.filter((p) => p.status === PaymentStatus.UNPAID).length;
  const partial = payments.filter((p) => p.status === PaymentStatus.PARTIAL).length;

  const selectCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]";
  const selectDisabledCls = `${selectCls} disabled:bg-gray-50 disabled:text-gray-400`;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
          Payments Management
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          Manage school fees and report card payments
        </p>
      </div>

      {/* ── Tabs + Filters card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.value
                  ? "text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-blue-50/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Tab description */}
        <div className="px-4 sm:px-5 py-2.5 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs text-gray-500 leading-snug">
            {TAB_CONFIG.find((t) => t.value === activeTab)?.description}
            {activeTab === "report_card" && (
              <span className="block xs:inline xs:ml-2 text-amber-600 font-medium mt-0.5 xs:mt-0">
                · Marking paid unlocks the report card for parents
              </span>
            )}
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Filter Payments
          </div>

          {/* 1-col on mobile, 2-col on sm, 4-col on lg */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSession}
                onChange={(e) => {
                  setSelectedSession(e.target.value);
                  setSelectedTerm("");
                  setPayments([]);
                  setHasSearched(false);
                }}
                className={selectCls}
              >
                <option value="">Select session...</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setPayments([]);
                  setHasSearched(false);
                }}
                disabled={!selectedSession}
                className={selectDisabledCls}
              >
                <option value="">Select term...</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name.charAt(0).toUpperCase() + t.name.slice(1)} Term
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Class <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={selectCls}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Payment Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">All statuses</option>
                <option value={PaymentStatus.PAID}>Paid</option>
                <option value={PaymentStatus.UNPAID}>Unpaid</option>
                <option value={PaymentStatus.PARTIAL}>Partial</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchPayments}
            disabled={!selectedSession || !selectedTerm || loading}
            className="w-full xs:w-auto px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Load Payments"}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {hasSearched && !loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Paid", count: paid, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { label: "Unpaid", count: unpaid, color: "bg-red-50 text-red-700 border-red-100" },
            { label: "Partial", count: partial, color: "bg-amber-50 text-amber-700 border-amber-100" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border p-3 sm:p-4 ${stat.color}`}>
              <p className="text-xl sm:text-2xl font-bold">{stat.count}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Bulk Actions ── */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1e3a5f] rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row xs:items-center gap-3">
          <p className="text-white text-sm font-medium shrink-0">
            {selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleBulkMark(PaymentStatus.PAID)}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {bulkLoading ? "Processing..." : "Mark all Paid"}
            </button>
            <button
              onClick={() => handleBulkMark(PaymentStatus.UNPAID)}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              Mark all Unpaid
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold hover:bg-white/30"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table (sm+) / Cards (mobile) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {!hasSearched ? (
          <div className="text-center py-14 text-gray-400 px-4">
            <Filter className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500 text-sm">Select a session and term to load payments</p>
            <p className="text-xs mt-1">Use the filters above to get started</p>
          </div>
        ) : loading ? (
          /* Skeleton */
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 sm:p-4 space-y-2 animate-pulse">
                <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-14 text-gray-400 px-4">
            <AlertCircle className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500 text-sm">No payment records found</p>
            <p className="text-xs mt-1">
              {activeTab === "report_card"
                ? "No approved report cards exist for the selected filters"
                : "No school fees records found for the selected filters"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table — hidden below sm */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === payments.length && payments.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Amount</th>
                    {activeTab === "report_card" && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Method</th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      {activeTab === "report_card" ? "Paid / Marked" : "Marked By"}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(payment._id) ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selectedIds.has(payment._id)} onChange={() => toggleSelect(payment._id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">
                          {payment.student.surname} {payment.student.firstName} {payment.student.otherName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{payment.student.admissionNumber}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">
                        {payment.student.currentClass?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">
                        {payment.amount ? `₦${payment.amount.toLocaleString()}` : "—"}
                      </td>
                      {activeTab === "report_card" && (
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {payment.paymentMethod ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.paymentMethod === "paystack" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {payment.paymentMethod === "paystack" ? "Online" : "Manual"}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {payment.paymentMethod === "paystack" && payment.paidAt ? (
                          <div>
                            <p className="text-sm text-emerald-600 font-medium">Paid online</p>
                            <p className="text-xs text-gray-400">{formatDate(payment.paidAt)}</p>
                          </div>
                        ) : payment.markedBy ? (
                          <div>
                            <p className="text-sm text-gray-600">
                              {payment.markedBy.surname} {payment.markedBy.firstName}
                            </p>
                            {payment.markedAt && <p className="text-xs text-gray-400">{formatDate(payment.markedAt)}</p>}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {!(activeTab === "report_card" && payment.paymentMethod === "paystack" && payment.status === PaymentStatus.PAID) && (
                          <button
                            onClick={() => { setMarkModal(payment); setMarkForm({ status: PaymentStatus.PAID, amount: "", note: "" }); }}
                            className="px-3 py-1 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium hover:bg-[#1e3a5f]/20"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — shown below sm */}
            <div className="sm:hidden">
              {/* Select-all bar */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/70 border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedIds.size === payments.length && payments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                <span className="text-xs text-gray-500 font-medium">
                  {selectedIds.size === payments.length && payments.length > 0
                    ? "Deselect all"
                    : `Select all (${payments.length})`}
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className={`p-3 flex items-start gap-3 transition-colors ${selectedIds.has(payment._id) ? "bg-blue-50/50" : ""}`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(payment._id)}
                      onChange={() => toggleSelect(payment._id)}
                      className="rounded mt-0.5 shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {payment.student.surname} {payment.student.firstName} {payment.student.otherName}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{payment.student.admissionNumber}</p>

                      {/* Class · Amount */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                        {payment.student.currentClass?.name && (
                          <span className="font-medium text-gray-700">{payment.student.currentClass.name}</span>
                        )}
                        {payment.amount && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>₦{payment.amount.toLocaleString()}</span>
                          </>
                        )}
                        {activeTab === "report_card" && payment.paymentMethod && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.paymentMethod === "paystack" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {payment.paymentMethod === "paystack" ? "Online" : "Manual"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Status + marked-by */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[payment.status]}`}>
                          {payment.status}
                        </span>
                        {payment.paymentMethod === "paystack" && payment.paidAt ? (
                          <span className="text-xs text-emerald-600 font-medium">Paid online · {formatDate(payment.paidAt)}</span>
                        ) : payment.markedBy ? (
                          <span className="text-xs text-gray-400">
                            by {payment.markedBy.surname} {payment.markedBy.firstName}
                            {payment.markedAt && ` · ${formatDate(payment.markedAt)}`}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Update button */}
                    {!(activeTab === "report_card" && payment.paymentMethod === "paystack" && payment.status === PaymentStatus.PAID) && (
                      <button
                        onClick={() => { setMarkModal(payment); setMarkForm({ status: PaymentStatus.PAID, amount: "", note: "" }); }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium hover:bg-[#1e3a5f]/20 shrink-0 mt-0.5"
                      >
                        Update
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Mark Payment Modal — bottom sheet on mobile ── */}
      {markModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* Sticky header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-gray-900">
                    Update {activeTab === "report_card" ? "Report Card" : "School Fees"} Payment
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                    {markModal.student.surname} {markModal.student.firstName} {markModal.student.otherName}
                    {" — "}
                    {markModal.session.name} · {markModal.term.name} term
                  </p>
                </div>
                <button onClick={() => setMarkModal(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">✕</button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {activeTab === "report_card" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ Marking this as Paid will immediately unlock the report card for the parent to view and download.
                  </p>
                </div>
              )}

              {/* Status picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(PaymentStatus).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setMarkForm({ ...markForm, status })}
                      className={`py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all capitalize ${
                        markForm.status === status
                          ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₦) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={markForm.amount}
                  onChange={(e) => setMarkForm({ ...markForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className={selectCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  value={markForm.note}
                  onChange={(e) => setMarkForm({ ...markForm, note: e.target.value })}
                  placeholder="e.g. Paid via bank transfer"
                  className={selectCls}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setMarkModal(null)}
                  disabled={markLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMark}
                  disabled={markLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {markLoading ? "Updating..." : "Update Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { CreditCard, Search, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
// import { PaymentStatus } from "@/types/enums";
// import { formatDate } from "@/lib/utils";
// import { toast } from "sonner";

// interface PaymentRecord {
//   _id: string;
//   student: { _id: string; firstName: string; lastName: string; admissionNumber: string };
//   session: { _id: string; name: string };
//   term: { _id: string; name: string };
//   status: PaymentStatus;
//   amount?: number;
//   markedBy?: { firstName: string; lastName: string };
//   markedAt?: string;
//   note?: string;
//   createdAt: string;
// }

// const STATUS_COLORS = {
//   [PaymentStatus.PAID]: "bg-emerald-100 text-emerald-700",
//   [PaymentStatus.UNPAID]: "bg-red-100 text-red-700",
//   [PaymentStatus.PARTIAL]: "bg-amber-100 text-amber-700",
// };

// export default function AdminPaymentsView() {
//   const [payments, setPayments] = useState<PaymentRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState<string>("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [markModal, setMarkModal] = useState<PaymentRecord | null>(null);
//   const [markForm, setMarkForm] = useState({ status: PaymentStatus.PAID, amount: "", note: "" });
//   const [markLoading, setMarkLoading] = useState(false);

//   const fetchPayments = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         ...(statusFilter && { status: statusFilter }),
//       });
//       const res = await fetch(`/api/admin/payments?${params}`);
//       const json = await res.json() as { success: boolean; data?: PaymentRecord[] };
//       if (json.success && json.data) setPayments(json.data);
//     } finally {
//       setLoading(false);
//     }
//   }, [statusFilter]);

//   useEffect(() => {
//     fetchPayments();
//   }, [fetchPayments]);

//   async function handleMark() {
//     if (!markModal) return;
//     setMarkLoading(true);
//     try {
//       const res = await fetch("/api/admin/payments", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           studentId: markModal.student._id,
//           sessionId: markModal.session._id,
//           termId: markModal.term._id,
//           status: markForm.status,
//           amount: markForm.amount ? parseFloat(markForm.amount) : undefined,
//           note: markForm.note,
//         }),
//       });
//       const json = await res.json() as { success: boolean; error?: string };
//       if (json.success) {
//         toast.success("Payment updated successfully");
//         setMarkModal(null);
//         fetchPayments();
//       } else {
//         toast.error(json.error ?? "Failed to update payment");
//       }
//     } finally {
//       setMarkLoading(false);
//     }
//   }

//   return (
//     <div className="space-y-5">
//       <div>
//         <h1 className="font-display text-2xl font-bold text-gray-900">Payments Management</h1>
//         <p className="text-gray-500 text-sm">Manage and track student payment status for report card access</p>
//       </div>

//       <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
//         <div className="flex gap-2">
//           {[
//             { label: "All", value: "" },
//             { label: "Paid", value: PaymentStatus.PAID },
//             { label: "Unpaid", value: PaymentStatus.UNPAID },
//             { label: "Partial", value: PaymentStatus.PARTIAL },
//           ].map((tab) => (
//             <button
//               key={tab.value}
//               onClick={() => setStatusFilter(tab.value)}
//               className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
//                 statusFilter === tab.value ? "bg-[#1e3a5f] text-white" : "text-gray-500 hover:bg-gray-50"
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="bg-gray-50/50 border-b border-gray-50">
//                 <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Session / Term</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Status</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Amount</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Marked By</th>
//                 <th className="px-4 py-3" />
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {loading ? (
//                 Array.from({ length: 6 }).map((_, i) => (
//                   <tr key={i}>
//                     {Array.from({ length: 6 }).map((__, j) => (
//                       <td key={j} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
//                     ))}
//                   </tr>
//                 ))
//               ) : payments.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="text-center py-12 text-gray-400">
//                     <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
//                     <p>No payment records found</p>
//                   </td>
//                 </tr>
//               ) : (
//                 payments.map((payment) => (
//                   <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
//                     <td className="px-5 py-3.5">
//                       <p className="font-medium text-gray-900">{payment.student.firstName} {payment.student.lastName}</p>
//                       <p className="text-xs text-gray-400 font-mono">{payment.student.admissionNumber}</p>
//                     </td>
//                     <td className="px-4 py-3.5 hidden sm:table-cell">
//                       <p className="text-gray-700">{payment.session.name}</p>
//                       <p className="text-xs text-gray-400 capitalize">{payment.term.name} term</p>
//                     </td>
//                     <td className="px-4 py-3.5">
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}>
//                         {payment.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">
//                       {payment.amount ? `₦${payment.amount.toLocaleString()}` : "—"}
//                     </td>
//                     <td className="px-4 py-3.5 hidden md:table-cell">
//                       {payment.markedBy ? (
//                         <div>
//                           <p className="text-sm text-gray-600">{payment.markedBy.firstName} {payment.markedBy.lastName}</p>
//                           {payment.markedAt && <p className="text-xs text-gray-400">{formatDate(payment.markedAt)}</p>}
//                         </div>
//                       ) : "—"}
//                     </td>
//                     <td className="px-4 py-3.5">
//                       <button
//                         onClick={() => { setMarkModal(payment); setMarkForm({ status: PaymentStatus.PAID, amount: "", note: "" }); }}
//                         className="px-3 py-1 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium hover:bg-[#1e3a5f]/20"
//                       >
//                         Update
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Mark Payment Modal */}
//       {markModal && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
//             <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Update Payment Status</h3>
//             <p className="text-sm text-gray-500 mb-4">
//               {markModal.student.firstName} {markModal.student.lastName} — {markModal.session.name} · {markModal.term.name} term
//             </p>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {Object.values(PaymentStatus).map((status) => (
//                     <button
//                       key={status}
//                       type="button"
//                       onClick={() => setMarkForm({ ...markForm, status })}
//                       className={`py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
//                         markForm.status === status
//                           ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
//                           : "border-gray-200 text-gray-600"
//                       }`}
//                     >
//                       {status}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
//                 <input
//                   type="number"
//                   value={markForm.amount}
//                   onChange={(e) => setMarkForm({ ...markForm, amount: e.target.value })}
//                   placeholder="e.g. 50000"
//                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
//                 <input
//                   value={markForm.note}
//                   onChange={(e) => setMarkForm({ ...markForm, note: e.target.value })}
//                   className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
//                 />
//               </div>
//             </div>

//             <div className="flex gap-3 mt-5">
//               <button onClick={() => setMarkModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
//               <button onClick={handleMark} disabled={markLoading} className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50">
//                 {markLoading ? "Updating..." : "Update Payment"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
