import ContactView from "@/components/landing/ContactView";
import { Metadata } from "next";

// export const metadata = { title: "Contact Us | Gods Way Schools" };
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with God's Way Model Schools. Find our location, phone number, and how to reach us.",
};

export default function ContactPage() {
  return <ContactView />;
}
