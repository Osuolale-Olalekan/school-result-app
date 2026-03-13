// ─── app/api/student/assignments/route.ts ────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const StudentModel    = (await import("@/models/Student")).default;
    const SubmissionModel = (await import("@/models/Submission")).default;

    const student = await StudentModel.findById(session.user.id, { currentClass: 1 }).lean();
    if (!student?.currentClass) {
      return NextResponse.json({ success: true, data: [], pagination: { page: 1, limit: 15, total: 0, totalPages: 0 } });
    }

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "15");

    const total = await AssignmentModel.countDocuments({
      classId: student.currentClass, status: "published",
    });
    const assignments = await AssignmentModel.find({
      classId: student.currentClass, status: "published",
    })
      .populate("subjectId", "name")
      .populate("createdBy", "firstName surname")
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const submissions   = await SubmissionModel.find({
      assignmentId: { $in: assignmentIds },
      studentId:    session.user.id,
    }).lean();

    const submissionMap = new Map(
      submissions.map((s) => [s.assignmentId.toString(), s])
    );

    const enriched = assignments.map((a) => ({
      ...a,
      submission: submissionMap.get(a._id.toString()) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}