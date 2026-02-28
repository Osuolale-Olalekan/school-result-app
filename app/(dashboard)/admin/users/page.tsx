import type { Metadata } from "next";
import UsersManagement from "@/components/admin/UsersManagement";

export const metadata: Metadata = { title: "Users Management" };

export default function AdminUsersPage() {
  return <UsersManagement />;
}
