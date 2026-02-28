import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import auth from "@/lib/auth";
import { UserRole } from "@/types/enums";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "My Reports" };

export default async function StudentReportsPage() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    redirect("/sign-in");
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🎓</span>
      </div>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Student Portal</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Welcome, {session.user.firstName}! Your report cards are managed by your parents.
        Please ask your parent to log in using your admission number to view your reports.
      </p>
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm mx-auto">
        <p className="text-sm text-amber-700">
          Parents can log in on the sign-in page using the <strong>Parent</strong> tab and your admission number.
        </p>
      </div>
    </div>
  );
}
