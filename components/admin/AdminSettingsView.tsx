"use client";

import { useEffect, useState } from "react";
import { Settings, Upload, Trash2, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SchoolSettings {
  principalSignature?: string;
}

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<SchoolSettings>({});
  const [loading, setLoading] = useState(true);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cleanupType, setCleanupType] = useState<"audit" | "notifications" | "both">("both");
  const [cleanupMonths, setCleanupMonths] = useState<number>(6);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: SchoolSettings }) => {
        if (j.success && j.data) setSettings(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      let signatureUrl = settings.principalSignature;

      if (signatureFile) {
        const formData = new FormData();
        formData.append("file", signatureFile);
        const uploadRes = await fetch("/api/admin/upload-signature", {
          method: "POST",
          body: formData,
        });
        const uploadJson = await uploadRes.json() as { success: boolean; url?: string };
        if (!uploadJson.success || !uploadJson.url) {
          toast.error("Failed to upload signature");
          return;
        }
        signatureUrl = uploadJson.url;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principalSignature: signatureUrl }),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) {
        toast.success("Settings saved successfully");
        setSettings((prev) => ({ ...prev, principalSignature: signatureUrl }));
        setSignatureFile(null);
        setSignaturePreview(null);
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSignature() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principalSignature: null }),
      });
      const json = await res.json() as { success: boolean };
      if (json.success) {
        toast.success("Signature removed");
        setSettings((prev) => ({ ...prev, principalSignature: undefined }));
        setSignatureFile(null);
        setSignaturePreview(null);
      }
    } catch {
      toast.error("Failed to remove signature");
    } finally {
      setSaving(false);
    }
  }

  async function handleCleanup() {
    setCleanupLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: cleanupType, months: cleanupMonths }),
      });
      const json = await res.json() as { success: boolean; message?: string };
      if (json.success) {
        toast.success(json.message ?? "Cleanup completed");
        setShowCleanupConfirm(false);
      } else {
        toast.error("Cleanup failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setCleanupLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">School Settings</h1>
        <p className="text-gray-500 text-sm">Manage school-wide settings and configurations</p>
      </div>

      {/* Principal Signature */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Principal&apos;s Signature</h2>
            <p className="text-xs text-gray-500">
              This signature will automatically appear on all approved report cards
            </p>
          </div>
        </div>

        {(settings.principalSignature ?? signaturePreview) && (
          <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              {signaturePreview ? "New signature (not saved yet):" : "Current signature:"}
            </p>
            <div className="flex items-center gap-4">
              <img
                src={signaturePreview ?? settings.principalSignature}
                alt="Principal signature"
                className="h-16 object-contain bg-white border border-gray-200 rounded-lg p-2"
              />
              {signaturePreview ? (
                <button
                  onClick={() => { setSignatureFile(null); setSignaturePreview(null); }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={handleRemoveSignature}
                  disabled={saving}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove signature
                </button>
              )}
            </div>
            {!signaturePreview && settings.principalSignature && (
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">
                  Signature is active — appearing on all report cards
                </p>
              </div>
            )}
          </div>
        )}

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1e3a5f] hover:bg-blue-50/30 transition-colors">
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 font-medium">
            {settings.principalSignature ? "Upload new signature" : "Upload signature image"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG recommended (transparent background)</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setSignatureFile(file);
              setSignaturePreview(URL.createObjectURL(file));
            }}
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving || (!signatureFile && !!settings.principalSignature)}
          className="mt-4 w-full py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : "Save Settings"}
        </button>
      </div>

      {/* Data Cleanup */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Data Cleanup</h2>
            <p className="text-xs text-gray-500">
              Delete old audit logs and notifications to free up database space
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What to delete</label>
            <select
              value={cleanupType}
              onChange={(e) => setCleanupType(e.target.value as "audit" | "notifications" | "both")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-red-400"
            >
              <option value="both">Audit Logs + Notifications</option>
              <option value="audit">Audit Logs only</option>
              <option value="notifications">Notifications only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delete records older than</label>
            <select
              value={cleanupMonths}
              onChange={(e) => setCleanupMonths(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-red-400"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>

          <button
            onClick={() => setShowCleanupConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Run Cleanup
          </button>
        </div>
      </div>

      {/* Cleanup Confirm Modal */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-gray-900">Confirm Cleanup</h2>
                <p className="text-sm text-gray-500 mt-1">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-gray-700">
                    {cleanupType === "both" ? "audit logs and notifications" : cleanupType === "audit" ? "audit logs" : "notifications"}
                  </span>{" "}
                  older than{" "}
                  <span className="font-semibold text-gray-700">{cleanupMonths} months</span>.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCleanupConfirm(false)}
                disabled={cleanupLoading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleanupLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cleanupLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</>
                ) : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}