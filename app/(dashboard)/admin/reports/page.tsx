import type { Metadata } from "next";
import AdminReportsView from "@/components/admin/AdminReportsView";

export const metadata: Metadata = { title: "Report Cards Management" };

export default function AdminReportsPage() {
  return <AdminReportsView />;
}
