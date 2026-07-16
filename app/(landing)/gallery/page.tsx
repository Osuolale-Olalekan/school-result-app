import GalleryView from "@/components/landing/GalleryView";
import { Metadata } from "next";

// export const metadata = { title: "Gallery | Gods Way Schools" };

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse photos of student life, activities, and campus at God's Way Model Schools.",
};

export default function GalleryPage() {
  return <GalleryView />;
}
