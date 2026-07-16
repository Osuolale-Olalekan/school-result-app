import NewsView from "@/components/landing/NewsView";
import { Metadata } from "next";

// export const metadata = { title: "News and Events | Gods Way Schools" };

export const metadata: Metadata = {
  title: "News and Events",
  description: "Stay updated with the latest news, events, and happenings at God's Way Model Schools.",
};

export default function NewsPage() {
  return <NewsView />;
}
