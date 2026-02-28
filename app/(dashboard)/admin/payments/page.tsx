import type { Metadata } from "next";
import AdminPaymentsView from "@/components/admin/AdminPaymentsView";

export const metadata: Metadata = { title: "Payments Management" };

export default function AdminPaymentsPage() {
  return <AdminPaymentsView />;
}
