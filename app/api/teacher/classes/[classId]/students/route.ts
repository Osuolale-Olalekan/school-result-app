import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ClassAssignmentModel from "@/models/ClassAssignment";
import "@/lib/registerModels";
import SubjectModel from "@/models/Subject";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { StudentStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";
import StudentModel from "@/models/Student";

interface RouteParams {
  params: Promise<{ classId: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { classId } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    // Verify teacher is assigned to this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });

    if (!assignment) {
      return Response.json(
        { success: false, error: "Not assigned to this class" },
        { status: 403 },
      );
    }

    const students = await StudentModel.find({
      currentClass: classId,
      studentStatus: StudentStatus.ACTIVE,
    })
      .select("-password")
      .sort({ lastName: 1, firstName: 1 })
      .lean();

   

    return Response.json({ success: true, data: students });
  } catch (error) {
    
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
