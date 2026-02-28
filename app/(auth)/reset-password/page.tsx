import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white/50 text-sm">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
