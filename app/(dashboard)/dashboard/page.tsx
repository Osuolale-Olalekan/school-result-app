import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { UserRole } from "@/types/enums";

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/sign-in");

  switch (session.user.activeRole) {
    case UserRole.ADMIN:
      redirect("/admin/dashboard");
    case UserRole.TEACHER:
      redirect("/teacher/dashboard");
    case UserRole.PARENT:
      redirect("/parent/children");
    case UserRole.STUDENT:
      redirect("/student/reports");
    default:
      redirect("/sign-in");
  }
}


// import { redirect } from "next/navigation";
// // import { auth } from "@/lib/auth";
// import { getServerSession } from "next-auth";
// import { UserRole } from "@/types/enums";

// export default async function DashboardPage() {
//   const session = await getServerSession();
//   if (!session?.user) redirect("/sign-in");

//   switch (session.user.role) {
//     case UserRole.ADMIN:
//       redirect("/admin/dashboard");
//     case UserRole.TEACHER:
//       redirect("/teacher/dashboard");
//     case UserRole.PARENT:
//       redirect("/parent/children");
//     case UserRole.STUDENT:
//       redirect("/student/reports");
//     default:
//       redirect("/sign-in");
//   }
// }
