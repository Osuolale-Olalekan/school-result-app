"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionBanner from "@/components/landing/SectionBanner";
import { SCHOOL } from "@/lib/site-data";

export default function ContactView() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }

      setStatus("done");
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <SectionBanner
        img="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1400&q=80"
        alt="Contact"
        breadcrumb="Contact Us"
        title="Contact Us"
      />

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
              📍 Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">We&apos;d Love to Hear From You</h2>
            <p className="text-gray-500 text-sm">Reach out for enquiries, visit our campus, or send us a message below.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base mb-5">Get In Touch</h3>
              <div className="space-y-3 mb-5">
                {[
                  { icon: Phone, label: "Phone", val: `${SCHOOL.phone1} / ${SCHOOL.phone2}`, href: `tel:+${SCHOOL.phone1}` },
                  { icon: Mail, label: "Email", val: SCHOOL.email, href: `mailto:${SCHOOL.email}` },
                  { icon: MapPin, label: "Address", val: SCHOOL.address, href: "#" },
                ].map((c) => (
                  <a key={c.label} href={c.href} className="flex items-start gap-3.5 bg-blue-50 hover:bg-blue-100 rounded-xl p-4 transition-all group">
                    <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center shrink-0">
                      <c.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{c.label}</p>
                      <p className="text-gray-900 font-semibold text-sm leading-snug">{c.val}</p>
                    </div>
                  </a>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-5">
                <h4 className="font-extrabold text-gray-900 text-sm mb-3">School Hours</h4>
                <div className="space-y-2 divide-y divide-gray-200">
                  {[
                    ["Monday – Friday", "7:50 AM – 4:00 PM", true],
                    ["Saturday", "Closed", false],
                    ["Sunday", "Closed", false],
                  ].map(([d, h, open]) => (
                    <div key={d as string} className="flex justify-between text-sm pt-2 first:pt-0">
                      <span className="text-gray-600">{d as string}</span>
                      <span className={`font-bold ${open ? "text-gray-900" : "text-gray-400"}`}>{h as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
              <h3 className="font-extrabold text-gray-900 text-base mb-5">Send Us a Message</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">Your Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Enter your name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">Your Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mb-3">
                  <label className="text-xs font-semibold text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="How can we help?"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5 mb-5">
                  <label className="text-xs font-semibold text-gray-700">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Type your message here..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-500 text-xs font-medium mb-3 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>Send Message →</>
                  )}
                </button>

                {status === "done" && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold text-center py-3 rounded-xl">
                    ✅ Message sent! We&apos;ll get back to you soon.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}