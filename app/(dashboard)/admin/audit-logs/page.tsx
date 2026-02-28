import type { Metadata } from "next";
import AuditLogsView from "@/components/admin/AuditLogsView";

export const metadata: Metadata = { title: "Audit Logs" };

export default function AuditLogsPage() {
  return <AuditLogsView />;
}
