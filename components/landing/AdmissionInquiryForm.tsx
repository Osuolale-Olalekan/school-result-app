"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { SCHOOL, CLASS_OPTIONS } from "@/lib/site-data";

type FormState = {
  parentName: string;
  phone: string;
  email: string;
  childName: string;
  classApplying: string;
  message: string;
};

const EMPTY: FormState = {
  parentName: "",
  phone: "",
  email: "",
  childName: "",
  classApplying: "",
  message: "",
};

function buildWhatsAppLink(data: FormState) {
  const lines = [
    "Hello God's Way Model Schools, I'd like to inquire about admission.",
    "",
    `Parent/Guardian: ${data.parentName}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : null,
    `Child's Name: ${data.childName}`,
    `Class Applying For: ${data.classApplying}`,
    data.message ? `Additional Info: ${data.message}` : null,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${SCHOOL.whatsappNumber}?text=${text}`;
}

export default function AdmissionInquiryForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [waLink, setWaLink] = useState("");
  const [serverError, setServerError] = useState("");

  const update =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.parentName.trim()) next.parentName = "Enter the parent/guardian's name";
    if (!form.phone.trim()) next.phone = "Enter a phone number we can reach you on";
    else if (!/^[\d+()\-\s]{7,}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number";
    if (!form.childName.trim()) next.childName = "Enter the child's name";
    if (!form.classApplying) next.classApplying = "Select the class you're applying for";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }

      // Inquiry is saved and the admin has been pinged on WhatsApp server-side.
      // Also hand the parent off to WhatsApp directly, as a second channel.
      const link = buildWhatsAppLink(form);
      setWaLink(link);
      setStatus("done");
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const startOver = () => {
    setForm(EMPTY);
    setErrors({});
    setStatus("idle");
    setWaLink("");
    setServerError("");
  };

  if (status === "done") {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-blue-100 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="font-extrabold text-gray-900 text-lg mb-2">Inquiry received!</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          We&apos;ve saved your inquiry for <strong>{form.childName}</strong> and notified our admissions team. We&apos;ve
          also opened WhatsApp with your details filled in — hit send there for the fastest reply.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Open WhatsApp Again
          </a>
          <button
            onClick={startOver}
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-300 text-gray-600 font-bold text-sm px-6 py-3 rounded-xl transition-all"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-blue-100" noValidate>
      <h3 className="font-extrabold text-gray-900 text-base mb-1">Start an Admission Inquiry</h3>
      <p className="text-gray-500 text-xs mb-6">
        Fill this in — we&apos;ll save it and notify our admissions team right away, plus open WhatsApp so you can reach
        us directly.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field label="Parent/Guardian Name" error={errors.parentName}>
          <input
            type="text"
            value={form.parentName}
            onChange={update("parentName")}
            placeholder="e.g. Mrs. Funmilayo Adeyemi"
            className={inputClass(!!errors.parentName)}
          />
        </Field>
        <Field label="Phone Number" error={errors.phone}>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="e.g. 080XXXXXXXX"
            className={inputClass(!!errors.phone)}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field label="Child's Full Name" error={errors.childName}>
          <input
            type="text"
            value={form.childName}
            onChange={update("childName")}
            placeholder="e.g. Ayomide Adeyemi"
            className={inputClass(!!errors.childName)}
          />
        </Field>
        <Field label="Class Applying For" error={errors.classApplying}>
          <select value={form.classApplying} onChange={update("classApplying")} className={inputClass(!!errors.classApplying)}>
            <option value="">Select a class</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Email (optional)" className="mb-4">
        <input
          type="email"
          value={form.email}
          onChange={update("email")}
          placeholder="you@example.com"
          className={inputClass(false)}
        />
      </Field>

      <Field label="Anything else we should know? (optional)" className="mb-4">
        <textarea
          rows={3}
          value={form.message}
          onChange={update("message")}
          placeholder="Previous school, special needs, preferred resumption term, etc."
          className={`${inputClass(false)} resize-none`}
        />
      </Field>

      {status === "error" && (
        <p className="text-red-500 text-xs font-medium mb-4 text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb855] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" /> Continue on WhatsApp
          </>
        )}
      </button>
      <p className="text-gray-400 text-[11px] text-center mt-3">
        Your inquiry is saved with us and our team is notified immediately — WhatsApp is a bonus, direct channel.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {error && <span className="text-red-500 text-[11px] font-medium">{error}</span>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm focus:outline-none transition-colors ${
    hasError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-500"
  }`;
}
