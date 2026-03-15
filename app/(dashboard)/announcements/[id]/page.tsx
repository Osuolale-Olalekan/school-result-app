// app/(dashboard)/announcements/[id]/page.tsx
import { redirect } from "next/navigation";

export default function AnnouncementDetailPage() {
  redirect("/announcements");
}