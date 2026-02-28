"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { success: boolean; message?: string };
      if (json.success) {
        setSent(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Check Your Email</h2>
        <p className="text-white/50 text-sm mb-8">
          If an account exists with that email, you&apos;ll receive a password reset link within a few minutes.
        </p>
        <Link href="/sign-in" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/sign-in" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-white/50 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              {...register("email")}
              type="email"
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#070d1a] font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
