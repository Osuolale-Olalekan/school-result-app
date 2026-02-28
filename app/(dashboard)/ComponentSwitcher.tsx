"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/enums";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

const roleDashboard: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/children",
};

export default function RoleSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();

  if (!session) return null;

  const { roles, activeRole } = session.user;

  // Only show if user has more than one role
//   if (!roles || roles.length <= 1) return null;
  if (!roles || !Array.isArray(roles) || roles.length <= 1) return null;

  const handleSwitch = async (role: UserRole) => {
    if (role === activeRole) return;
    await update({ activeRole: role });
    router.push(roleDashboard[role]);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-2">
      <span className="text-sm text-gray-500">Viewing as:</span>
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => handleSwitch(role)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            role === activeRole
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {roleLabels[role]}
        </button>
      ))}
    </div>
  );
}