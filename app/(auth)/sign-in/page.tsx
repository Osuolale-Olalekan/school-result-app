import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
