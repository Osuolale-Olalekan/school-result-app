import type { Metadata } from "next";
import SessionsManagement from "@/components/admin/SessionsManagement";

export const metadata: Metadata = { title: "Sessions Management" };

export default function AdminSessionsPage() {
  return <SessionsManagement />;
}
