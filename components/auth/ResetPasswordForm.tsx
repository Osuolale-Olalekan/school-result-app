"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-amber-400 text-sm mt-3 block">Request a new link</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Password Reset!</h2>
        <p className="text-white/50 text-sm mb-8">Your password has been updated. You can now sign in.</p>
        <Link href="/sign-in" className="inline-block px-6 py-3 rounded-xl bg-amber-500 text-[#070d1a] font-bold text-sm">
          Sign In Now
        </Link>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        setSuccess(true);
      } else {
        toast.error(json.error ?? "Reset failed. The link may have expired.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">New Password</h1>
        <p className="text-white/50 text-sm">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-2">New Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 text-sm pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Confirm Password</label>
          <input
            {...register("confirmPassword")}
            type={showPassword ? "text" : "password"}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 text-sm"
          />
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#070d1a] font-bold text-sm disabled:opacity-50"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
