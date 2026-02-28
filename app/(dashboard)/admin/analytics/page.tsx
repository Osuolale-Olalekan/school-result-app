import type { Metadata } from "next";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return <AdminDashboardView />;
}
