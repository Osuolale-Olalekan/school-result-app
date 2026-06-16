"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Shield, BookOpen, Users, Hash, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Schemas ────────────────────────────────────────────────────────────────

const staffSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentEmailSchema = z.object({
  loginMethod: z.literal("email"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentAdmissionSchema = z.object({
  loginMethod: z.literal("admissionNumber"),
  admissionNumber: z.string().min(3, "Enter your admission number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSchema = z.discriminatedUnion("loginMethod", [
  studentEmailSchema,
  studentAdmissionSchema,
]);

const parentAdmissionSchema = z.object({
  loginMethod: z.literal("admissionNumber"),
  admissionNumber: z.string().min(3, "Enter your child's admission number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const parentEmailSchema = z.object({
  loginMethod: z.literal("email"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const parentSchema = z.discriminatedUnion("loginMethod", [
  parentAdmissionSchema,
  parentEmailSchema,
]);

type StaffFormData = z.infer<typeof staffSchema>;
type StudentFormData = z.infer<typeof studentSchema>;
type ParentFormData = z.infer<typeof parentSchema>;
type LoginTab = "staff" | "student" | "parent";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "staff" as LoginTab, label: "Staff", icon: Shield },
  { id: "student" as LoginTab, label: "Student", icon: BookOpen },
  { id: "parent" as LoginTab, label: "Parent", icon: Users },
];

const ROLE_HINTS = [
  { role: "Staff", icon: Shield, color: "#f97316" },
  { role: "Student", icon: BookOpen, color: "#0ea5e9" },
  { role: "Parent", icon: Users, color: "#7ab8d4" },
];

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl text-sm transition-all outline-none " +
  "bg-white/[.04] border border-sky-500/20 text-[#f5f0e8] placeholder-white/20 " +
  "focus:border-orange-500/50 focus:bg-white/[.07]";

// ─── Component ───────────────────────────────────────────────────────────────

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<LoginTab>("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentLoginMethod, setStudentLoginMethod] = useState<"email" | "admissionNumber">("admissionNumber");
  const [parentLoginMethod, setParentLoginMethod] = useState<"email" | "admissionNumber">("admissionNumber");

  // ── Forms ──
  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  });

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { loginMethod: "admissionNumber" } as StudentFormData,
  });

  const parentForm = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: { loginMethod: "admissionNumber" } as ParentFormData,
  });

  // ── Tab switch ──
  function handleTabChange(tab: LoginTab) {
    setActiveTab(tab);
    setShowPassword(false);
    staffForm.reset();
    studentForm.reset({ loginMethod: "admissionNumber" } as StudentFormData);
    parentForm.reset({ loginMethod: "admissionNumber" } as ParentFormData);
    setStudentLoginMethod("admissionNumber");
    setParentLoginMethod("admissionNumber");
  }

  function handleStudentMethodChange(method: "email" | "admissionNumber") {
    setStudentLoginMethod(method);
    studentForm.reset({ loginMethod: method } as StudentFormData);
  }

  function handleParentMethodChange(method: "email" | "admissionNumber") {
    setParentLoginMethod(method);
    parentForm.reset({ loginMethod: method } as ParentFormData);
  }

  // ─── Submit Handlers ─────────────────────────────────────────────────────

  async function handleStaffSubmit(data: StaffFormData) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        loginType: "staff",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStudentSubmit(data: StudentFormData) {
    setIsLoading(true);
    try {
      const isAdmission = data.loginMethod === "admissionNumber";

      // const result = await signIn("credentials", {
      //   ...(isAdmission
      //     ? { admissionNumber: data.admissionNumber, loginType: "student" }
      //     : { email: data.email, loginType: "staff" }),
      //   password: data.password,
      //   redirect: false,
      // });
      // ✅ After — always send loginType: "student"
      const result = await signIn("credentials", {
        ...(isAdmission
          ? { admissionNumber: data.admissionNumber }
          : { email: data.email }),
        loginType: "student",
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          isAdmission
            ? "Invalid admission number or password. Please try again."
            : "Invalid email or password. Please try again."
        );
        return;
      }

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
      const isAdmission = data.loginMethod === "admissionNumber";

      const result = await signIn("credentials", {
        ...(isAdmission
          ? { admissionNumber: data.admissionNumber, loginType: "parent" }
          : { email: data.email, loginType: "parent" }),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          isAdmission
            ? "Invalid admission number or password."
            : "Invalid email or password."
        );
        return;
      }

      toast.success("Welcome back!");
      router.push("/parent/children");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Shared UI Pieces ────────────────────────────────────────────────────

  const PasswordField = ({
    registration,
    error,
  }: {
    registration: ReturnType<typeof staffForm.register>;
    error?: string;
  }) => (
    <div>
      <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
        Password
      </label>
      <div className="relative">
        <input
          {...registration}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          autoComplete="current-password"
          className={`${INPUT_CLS} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: "rgba(245,240,232,0.30)" }}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );

  const ForgotLink = () => (
    <div className="flex justify-end">
      <Link href="/forgot-password" className="text-sm transition-colors" style={{ color: "#0ea5e9" }}>
        Forgot password?
      </Link>
    </div>
  );

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
      }}
    >
      {isLoading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>
      ) : (
        label
      )}
    </button>
  );

  const MethodToggle = ({
    method,
    onChange,
    leftLabel,
    rightLabel,
  }: {
    method: "email" | "admissionNumber";
    onChange: (m: "email" | "admissionNumber") => void;
    leftLabel: string;
    rightLabel: string;
  }) => (
    <div>
      <p className="text-xs mb-2" style={{ color: "rgba(245,240,232,0.45)" }}>
        Sign in with:
      </p>
      <div
        className="flex gap-1 p-1 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(14,165,233,0.12)",
        }}
      >
        {(["admissionNumber", "email"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all"
            style={
              method === m
                ? {
                    background: "rgba(14,165,233,0.15)",
                    color: "#7ab8d4",
                    border: "1px solid rgba(14,165,233,0.3)",
                  }
                : { color: "rgba(245,240,232,0.35)", border: "1px solid transparent" }
            }
          >
            {m === "admissionNumber"
              ? <><Hash className="w-3.5 h-3.5" />{leftLabel}</>
              : <><Mail className="w-3.5 h-3.5" />{rightLabel}</>
            }
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-1.5"
          style={{ color: "#f5f0e8", letterSpacing: "-0.02em" }}
        >
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

      {/* Account Suspended Banner */}
      {authError === "AccountSuspended" && (
        <div
          className="p-3 rounded-xl text-xs leading-relaxed mb-5"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
          }}
        >
          Your account has been suspended or deactivated. Please contact the
          school admin for assistance.
        </div>
      )}

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(14,165,233,0.15)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all"
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
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="relative">
        <AnimatePresence mode="wait">

          {/* ── STAFF FORM ── */}
          {activeTab === "staff" && (
            <motion.form
              key="staff"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onSubmit={staffForm.handleSubmit(handleStaffSubmit)}
              className="space-y-4"
            >
              <div
                className="p-3 rounded-xl text-xs leading-relaxed"
                style={{
                  background: "rgba(249,115,22,0.07)",
                  border: "1px solid rgba(249,115,22,0.18)",
                  color: "rgba(245,240,232,0.55)",
                }}
              >
                For <strong style={{ color: "#f97316" }}>Admins</strong> and{" "}
                <strong style={{ color: "#0ea5e9" }}>Teachers</strong> — sign in
                with your school email address.
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                  Email Address
                </label>
                <input
                  {...staffForm.register("email")}
                  type="email"
                  placeholder="admin@school.edu.ng"
                  autoComplete="email"
                  className={INPUT_CLS}
                />
                {staffForm.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {staffForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <PasswordField
                registration={staffForm.register("password")}
                error={staffForm.formState.errors.password?.message}
              />
              <ForgotLink />
              <SubmitButton label="Sign In" />
            </motion.form>
          )}

          {/* ── STUDENT FORM ── */}
          {activeTab === "student" && (
            <motion.form
              key="student"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onSubmit={studentForm.handleSubmit(handleStudentSubmit)}
              className="space-y-4"
            >
              <MethodToggle
                method={studentLoginMethod}
                onChange={handleStudentMethodChange}
                leftLabel="Admission Number"
                rightLabel="Email Address"
              />

              <AnimatePresence mode="wait">
                {studentLoginMethod === "admissionNumber" ? (
                  <motion.div
                    key="student-admission"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                      Admission Number
                    </label>
                    <input
                      {...studentForm.register("admissionNumber")}
                      type="text"
                      placeholder="e.g. GWS/24/0001"
                      autoComplete="off"
                      className={`${INPUT_CLS} uppercase`}
                    />
                    {"admissionNumber" in studentForm.formState.errors &&
                      studentForm.formState.errors.admissionNumber && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {studentForm.formState.errors.admissionNumber.message}
                        </p>
                      )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="student-email"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                      Email Address
                    </label>
                    <input
                      {...studentForm.register("email")}
                      type="email"
                      placeholder="student@school.edu.ng"
                      autoComplete="email"
                      className={INPUT_CLS}
                    />
                    {"email" in studentForm.formState.errors &&
                      studentForm.formState.errors.email && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {studentForm.formState.errors.email.message}
                        </p>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>

              <PasswordField
                registration={studentForm.register("password")}
                error={studentForm.formState.errors.password?.message}
              />
              <ForgotLink />
              <SubmitButton label="Sign In" />
            </motion.form>
          )}

          {/* ── PARENT FORM ── */}
          {activeTab === "parent" && (
            <motion.form
              key="parent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onSubmit={parentForm.handleSubmit(handleParentSubmit)}
              className="space-y-4"
            >
              <div
                className="p-3 rounded-xl text-xs leading-relaxed"
                style={{
                  background: "rgba(14,165,233,0.08)",
                  border: "1px solid rgba(14,165,233,0.22)",
                  color: "#7ab8d4",
                }}
              >
                <strong>Parent Login:</strong> Use your child&apos;s admission
                number or your own email address to access their reports.
              </div>

              <MethodToggle
                method={parentLoginMethod}
                onChange={handleParentMethodChange}
                leftLabel="Child's Admission No."
                rightLabel="Email Address"
              />

              <AnimatePresence mode="wait">
                {parentLoginMethod === "admissionNumber" ? (
                  <motion.div
                    key="parent-admission"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                      Child&apos;s Admission Number
                    </label>
                    <input
                      {...parentForm.register("admissionNumber")}
                      type="text"
                      placeholder="e.g. GWS/24/0001"
                      autoComplete="off"
                      className={`${INPUT_CLS} uppercase`}
                    />
                    {"admissionNumber" in parentForm.formState.errors &&
                      parentForm.formState.errors.admissionNumber && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {parentForm.formState.errors.admissionNumber.message}
                        </p>
                      )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="parent-email"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="block text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
                      Email Address
                    </label>
                    <input
                      {...parentForm.register("email")}
                      type="email"
                      placeholder="parent@email.com"
                      autoComplete="email"
                      className={INPUT_CLS}
                    />
                    {"email" in parentForm.formState.errors &&
                      parentForm.formState.errors.email && (
                        <p className="text-red-400 text-xs mt-1.5">
                          {parentForm.formState.errors.email.message}
                        </p>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>

              <PasswordField
                registration={parentForm.register("password")}
                error={parentForm.formState.errors.password?.message}
              />
              <ForgotLink />
              <SubmitButton label="Access Reports" />
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}