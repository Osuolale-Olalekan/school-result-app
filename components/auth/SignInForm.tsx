"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Shield, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const staffSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const parentSchema = z.object({
  admissionNumber: z.string().min(3, "Enter the student's admission number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type StaffFormData = z.infer<typeof staffSchema>;
type ParentFormData = z.infer<typeof parentSchema>;
type LoginTab = "staff" | "parent";

const TABS = [
  { id: "staff" as LoginTab, label: "Staff / Student", icon: Shield },
  { id: "parent" as LoginTab, label: "Parent", icon: Users },
];

const ROLE_HINTS = [
  { role: "Admin",   icon: Shield,   color: "#f97316" },
  { role: "Teacher", icon: BookOpen, color: "#0ea5e9" },
  { role: "Student", icon: Users,    color: "#7ab8d4" },
];

// Shared Tailwind input classes — themed to match landing page
const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl text-sm transition-all outline-none " +
  "bg-white/[.04] border border-sky-500/20 text-[#f5f0e8] placeholder-white/20 " +
  "focus:border-orange-500/50 focus:bg-white/[.07]";

export default function SignInForm() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState<LoginTab>("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const staffForm  = useForm<StaffFormData>({ resolver: zodResolver(staffSchema) });
  const parentForm = useForm<ParentFormData>({ resolver: zodResolver(parentSchema) });

  async function handleStaffSubmit(data: StaffFormData) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        loginType: "staff",
        redirect: false,
      });
      if (result?.error) { toast.error("Invalid email or password. Please try again."); return; }
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleParentSubmit(data: ParentFormData) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        admissionNumber: data.admissionNumber,
        password: data.password,
        loginType: "parent",
        redirect: false,
      });
      if (result?.error) { toast.error("Invalid admission number or password."); return; }
      toast.success("Welcome back!");
      router.push("/parent/children");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    /* Wrapper: no fixed height, no overflow hidden — let the parent panel scroll */
    <div className="w-full">

      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ color: "#f5f0e8", letterSpacing: "-0.02em" }}>
          Welcome Back
        </h1>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.42)" }}>
          Sign in to access the school management portal
        </p>
      </div>

      {/* Role hints */}
      <div className="flex items-center gap-4 flex-wrap mb-5">
        {ROLE_HINTS.map((hint) => (
          <div key={hint.role} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(245,240,232,0.38)" }}>
            <hint.icon className="w-3.5 h-3.5" style={{ color: hint.color }} />
            <span>{hint.role}</span>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(14,165,233,0.15)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all"
            style={
              activeTab === tab.id
                ? {
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 12px rgba(249,115,22,0.35)",
                  }
                : { color: "rgba(245,240,232,0.45)", background: "transparent" }
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms — AnimatePresence with overflow visible so nothing gets clipped */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "staff" ? (
            <motion.form
              key="staff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onSubmit={staffForm.handleSubmit(handleStaffSubmit)}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                  Email Address
                </label>
                <input
                  {...staffForm.register("email")}
                  type="email"
                  placeholder="admin@godswayschools.edu.ng"
                  autoComplete="email"
                  className={INPUT_CLS}
                />
                {staffForm.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">{staffForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    {...staffForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${INPUT_CLS} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(245,240,232,0.30)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {staffForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1.5">{staffForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Forgot */}
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm transition-colors" style={{ color: "#0ea5e9" }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
                }}
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : "Sign In"}
              </button>
            </motion.form>

          ) : (

            <motion.form
              key="parent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onSubmit={parentForm.handleSubmit(handleParentSubmit)}
              className="space-y-4"
            >
              {/* Info banner */}
              <div
                className="p-3 rounded-xl text-xs leading-relaxed"
                style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.22)", color: "#7ab8d4" }}
              >
                <strong>Parent Login:</strong> Enter your child&apos;s admission number to access their
                reports. Contact the admin for your login credentials.
              </div>

              {/* Admission number */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                  Student Admission Number
                </label>
                <input
                  {...parentForm.register("admissionNumber")}
                  type="text"
                  placeholder="e.g. GWS/24/0001"
                  className={`${INPUT_CLS} uppercase`}
                />
                {parentForm.formState.errors.admissionNumber && (
                  <p className="text-red-400 text-xs mt-1.5">{parentForm.formState.errors.admissionNumber.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    {...parentForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`${INPUT_CLS} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(245,240,232,0.30)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {parentForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1.5">{parentForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Forgot */}
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm transition-colors" style={{ color: "#0ea5e9" }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
                }}
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : "Access Reports"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}