import type { Metadata } from "next";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
