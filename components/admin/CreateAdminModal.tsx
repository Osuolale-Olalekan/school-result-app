"use client";

import { useState } from "react";
import { Shield, X } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/enums";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAdminModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    surname: "",
    firstName: "",
    otherName: "",
    email: "",
    phone: "",
  });
  const [creating, setCreating] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.surname || !form.firstName ||!form.otherName || !form.email) {
      toast.error("Surname name, first name, Other names and email are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: UserRole.ADMIN }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("Admin account created. Login credentials sent to their email.");
        onSuccess();
      } else {
        toast.error(json.error ?? "Failed to create admin");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">
                Create Admin Account
              </h2>
              <p className="text-xs text-gray-500">
                A temporary password will be sent to their email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Warning banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Admin accounts have full access to the system. Only create accounts for trusted personnel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Surname <span className="text-red-500">*</span>
              </label>
              <input
                value={form.surname}
                onChange={(e) => update("surname", e.target.value)}
                placeholder="Family Name"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="John"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Other Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.otherName}
                onChange={(e) => update("otherName", e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>


          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="admin@school.com"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08012345678"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}