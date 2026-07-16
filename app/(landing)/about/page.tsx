import AboutView from "@/components/landing/AboutView";
import { Metadata } from "next";

// export const metadata = { title: "About | Gods Way Schools" };

export const metadata: Metadata = {
  title: "About",
  description: "Learn about God's Way Model Schools — our history, mission, values, and commitment to excellence, integrity, and faith.",
};

export default function AboutPage() {
  return <AboutView />;
}
