import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import UserModel from "@/models/User";
import { UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const role = session.user.activeRole;

    let user;

    if (role === UserRole.PARENT || session.user.roles?.includes(UserRole.PARENT)) {
      user = await UserModel.findById(session.user.id)
        .select("-password")
        .populate({
          path: "children",
          select: "surname firstName otherName admissionNumber profilePhoto gender studentStatus dateOfBirth currentClass",
          populate: { path: "currentClass", select: "name section" },
        })
        .lean();
    } else if (role === UserRole.STUDENT) {
      user = await UserModel.findById(session.user.id)
        .select("-password")
        .populate("currentClass", "name section")
        .populate("parents", "surname firstName otherName phone email relationship occupation")
        .lean();
    } else {
      user = await UserModel.findById(session.user.id)
        .select("-password")
        .populate("currentClass", "name section") // for students
        .lean();
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Profile ME error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}