import AdmissionsView from "@/components/landing/AdmissionsView";
import { Metadata } from "next";

// export const metadata = { title: "Admissions | Gods Way Schools" };

export const metadata: Metadata = {
  title: "Admissions",
  description: "Apply for admission to God's Way Model Schools. Learn about our admission process, requirements, and how to enroll your child.",
};

export default function AdmissionsPage() {
  return <AdmissionsView />;
}
