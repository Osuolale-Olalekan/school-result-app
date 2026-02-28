import type { Metadata } from "next";
import ClassesManagement from "@/components/admin/ClassesManagement";

export const metadata: Metadata = { title: "Classes Management" };

export default function AdminClassesPage() {
  return <ClassesManagement />;
}
