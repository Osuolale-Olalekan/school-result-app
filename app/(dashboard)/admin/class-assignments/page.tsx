import type { Metadata } from "next";
import ClassAssignmentsView from "@/components/admin/ClassAssignmentsView";

export const metadata: Metadata = { title: "Class Assignments" };

export default function ClassAssignmentsPage() {
  return <ClassAssignmentsView />;
}
