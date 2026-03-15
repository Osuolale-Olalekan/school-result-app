
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
// import RoleSwitcher from "@/components/RoleSwitcher";
import RoleSwitcher from "./ComponentSwitcher";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // await headers();
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">
      <DashboardSidebar role={session.user.activeRole} /> {/* ← role → activeRole */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader user={session.user} />
        <RoleSwitcher />  {/* ← add it here, between header and main */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}