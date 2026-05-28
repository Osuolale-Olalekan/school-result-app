"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  Send,
  Users,
  GraduationCap,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface BroadcastResult {
  successCount: number;
  failCount: number;
  total: number;
  results: Array<{
    phone: string;
    name: string;
    status: "sent" | "failed";
    error?: string;
  }>;
}

export default function WhatsAppBroadcast() {
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState<
    "all_parents" | "class" | "teachers" | "custom"
  >("all_parents");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [customNumbers, setCustomNumbers] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Class[] }) => {
        if (j.success && j.data) setClasses(j.data);
      });
  }, []);

  async function handleSend() {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (recipients === "class" && !selectedClass) {
      toast.error("Please select a class");
      return;
    }
    if (recipients === "custom" && !customNumbers.trim()) {
      toast.error("Please enter phone numbers");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const phoneNumbers =
        recipients === "custom"
          ? customNumbers
              .split("\n")
              .map((p) => p.trim())
              .filter(Boolean)
          : undefined;

      const res = await fetch("/api/admin/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          recipients,
          classId: recipients === "class" ? selectedClass : undefined,
          phoneNumbers,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: BroadcastResult;
        message?: string;
        error?: string;
      };

      if (json.success && json.data) {
        setResult(json.data);
        setShowResults(true);
        if (json.data.failCount === 0) {
          toast.success(json.message ?? "Messages sent");
        } else if (json.data.successCount === 0) {
          toast.error("All messages failed — check results for details");
        } else {
          toast.warning(
            `${json.data.successCount} sent, ${json.data.failCount} failed`,
          );
        }
      } else {
        toast.error(json.error ?? "Failed to send messages");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          WhatsApp Broadcast
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Send WhatsApp messages to parents
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {/* ── Compose ── */}
        <div className="sm:col-span-2 space-y-4">
          {/* Recipients */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Send To</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { value: "all_parents", label: "All Parents", icon: Users },
                { value: "teachers", label: "Teachers", icon: BookOpen },
                { value: "class", label: "By Class", icon: GraduationCap },
                { value: "custom", label: "Custom", icon: Phone },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setRecipients(value as typeof recipients)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    recipients === value
                      ? "border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            {recipients === "class" && (
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}

            {recipients === "custom" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Enter phone numbers (one per line, international format e.g.
                  2348012345678)
                </label>
                <textarea
                  value={customNumbers}
                  onChange={(e) => setCustomNumbers(e.target.value)}
                  rows={4}
                  placeholder="2348012345678&#10;2347098765432&#10;2349012345678"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 resize-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Message</p>
              <span className="text-xs text-gray-400">
                {message.length}/1000
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              rows={6}
              placeholder="Type your message here... e.g. First term report cards are now available. Please log in to godswayschool.com to view your child's result."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 resize-none"
            />
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Preview:</span> Hello [Parent
                Name], this is a message from God&apos;s Way Model Groups of
                Schools. {message || "[your message]"}. Thank you.
              </p>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20b858] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending messages...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send WhatsApp Message
              </>
            )}
          </button>
        </div>

        {/* ── Info panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <p className="font-semibold text-gray-700 text-sm">
                How it works
              </p>
            </div>
            <div className="space-y-2.5 text-xs text-gray-500">
              <p>1. Select who to send to</p>
              <p>2. Type your message</p>
              <p>3. Click Send — parents receive it on WhatsApp instantly</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="font-semibold text-gray-700 text-sm mb-3">
              Important Notes
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>
                ⚠️ Only parents with a phone number on file will receive
                messages
              </p>
              <p>⚠️ Phone numbers must be in international format (234...)</p>
              <p>✅ 1,000 free conversations per month</p>
              <p>
                ✅ Multiple messages to same parent in 24hrs = 1 conversation
              </p>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="font-semibold text-gray-700 text-sm mb-3">
                Last Broadcast
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm font-bold text-gray-900">
                    {result.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Sent
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {result.successCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Failed
                  </span>
                  <span className="text-sm font-bold text-red-500">
                    {result.failCount}
                  </span>
                </div>
                {result.failCount > 0 && (
                  <button
                    onClick={() => setShowResults(true)}
                    className="w-full mt-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    View details
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResults && result && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Broadcast Results</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.successCount} sent · {result.failCount} failed ·{" "}
                  {result.total} total
                </p>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  {r.status === "sent" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {r.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{r.phone}</p>
                    {r.error && (
                      <p className="text-xs text-red-400 mt-0.5">{r.error}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === "sent"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
