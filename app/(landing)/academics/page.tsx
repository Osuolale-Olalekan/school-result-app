import AcademicsView from "@/components/landing/AcademicsView";
import { Metadata } from "next";

// export const metadata = { title: "Academics | Gods Way Schools" };
export const metadata: Metadata = {
  title: "Academics",
  description: "Explore the academic programs and curriculum at God's Way Model Schools. Discover how we foster learning and development in a faith-based environment.",
};

export default function AcademicsPage() {
  return <AcademicsView />;
}
