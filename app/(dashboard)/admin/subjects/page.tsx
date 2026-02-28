import type { Metadata } from "next";
import SubjectsManagement from "@/components/admin/SubjectsManagement";

export const metadata: Metadata = { title: "Subjects Management" };

export default function AdminSubjectsPage() {
  return <SubjectsManagement />;
}
