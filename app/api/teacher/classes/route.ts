import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ClassAssignmentModel from "@/models/ClassAssignment";
import "@/lib/registerModels";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import { SessionModel } from "@/models/Session";
import { SessionStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const activeSession = await SessionModel.findOne({ status: SessionStatus.ACTIVE }).lean();

    const assignments = await ClassAssignmentModel.find({
      teacher: session.user.id,
      isActive: true,
      ...(activeSession ? { session: activeSession._id } : {}),
    })
      .populate({ path: "class", populate: { path: "subjects", select: "name code hasPractical" } })
      .populate({ path: "session", select: "name status terms", populate: { path: "terms", select: "name status startDate endDate" } })
      .lean();

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
