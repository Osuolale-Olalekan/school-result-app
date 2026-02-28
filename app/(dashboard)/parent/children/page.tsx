import type { Metadata } from "next";
import ParentChildrenView from "@/components/parent/ParentChildrenView";

export const metadata: Metadata = { title: "My Children" };

export default function ParentChildrenPage() {
  return <ParentChildrenView />;
}
