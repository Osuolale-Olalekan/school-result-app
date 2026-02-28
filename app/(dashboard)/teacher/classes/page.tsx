import type { Metadata } from "next";
import TeacherClassesView from "@/components/teacher/TeacherClassesView";

export const metadata: Metadata = { title: "My Classes" };

export default function TeacherClassesPage() {
  return <TeacherClassesView />;
}
