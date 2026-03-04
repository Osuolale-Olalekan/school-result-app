import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels"
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import ClassModel from "@/models/Class";
import ParentModel from "@/models/Parent"; // ← change this
import { UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";


export async function GET(): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();

  // ✅ Allow if activeRole is PARENT, OR if they have PARENT in their roles
  const hasParentAccess =
    session?.user?.activeRole === UserRole.PARENT ||
    session?.user?.roles?.includes(UserRole.PARENT);

  if (!session?.user || !hasParentAccess) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    // const parent = await ParentModel.findById(session.user.id)
    const parent = await UserModel.findById(session.user.id)
      .populate({
        path: "children",
        select: "surname firstName otherName admissionNumber profilePhoto gender studentStatus dateOfBirth",
        populate: {
          path: "currentClass",
          select: "name section department",
        },
      })
      .lean();

    if (!parent) {
      // 🔍 Add this log temporarily to debug
      console.error("Parent not found for user id:", session.user.id);
      return NextResponse.json(
        { success: false, error: "Parent not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: parent });
  } catch (error) {
    console.error("Parent ME error:", error); // ← log the actual error
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// export async function GET(): Promise<NextResponse<ApiResponse<object>>> {
//   const session = await getSession();
//   if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
//     return NextResponse.json(
//       { success: false, error: "Unauthorized" },
//       { status: 401 },
//     );
//   }

//   try {
//     await connectDB();

//     const parent = await ParentModel.findById(session.user.id)  // ← UserModel not ParentModel
//   .populate({
//     path: "children",
//     select: "surname firstName otherName admissionNumber profilePhoto gender studentStatus dateOfBirth",
//     populate: {
//       path: "currentClass",
//       select: "name section department",
//     },
//   })
//   .lean();

// if (!parent) {
//   return NextResponse.json(
//     { success: false, error: "Parent not found" },
//     { status: 404 }
//   );
// }

//     return NextResponse.json({ success: true, data: parent });
//   } catch (error) {
    
//     return NextResponse.json(
//       { success: false, error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
