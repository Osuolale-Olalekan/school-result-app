import type { Metadata } from "next";
import PromotionManagement from "@/components/admin/PromotionManagement";

export const metadata: Metadata = { title: "Student Promotion" };

export default function AdminPromotePage() {
  return <PromotionManagement />;
}
