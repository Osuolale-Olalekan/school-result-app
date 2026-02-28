import type { Metadata } from "next";
import { Suspense } from "react";
import ParentReportsView from "@/components/parent/ParentReportsView";

export const metadata: Metadata = { title: "Report Cards" };

function LoadingFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ParentReportsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ParentReportsView />
    </Suspense>
  );
}
