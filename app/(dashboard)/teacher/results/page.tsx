import type { Metadata } from "next";
import TeacherResultsView from "@/components/teacher/TeacherResultsView";

export const metadata: Metadata = { title: "Results & Reports" };

export default function TeacherResultsPage() {
  return <TeacherResultsView />;
}
