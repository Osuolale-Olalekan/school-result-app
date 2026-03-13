
// ─── app/api/teacher/assignments/[id]/submissions/[submissionId]/route.ts ─────
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { UserRole } from "@/types/enums";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const SubmissionModel = (await import("@/models/Submission")).default;

    const assignment = await AssignmentModel.findOne({
      _id: params.id, createdBy: session.user.id,
    }).lean();

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    const { score, feedback } = await request.json() as { score: number; feedback?: string };

    if (score === undefined || score === null) {
      return NextResponse.json({ success: false, error: "Score is required" }, { status: 400 });
    }
    if (score < 0 || score > assignment.maxScore) {
      return NextResponse.json(
        { success: false, error: `Score must be between 0 and ${assignment.maxScore}` },
        { status: 400 }
      );
    }

    const submission = await SubmissionModel.findByIdAndUpdate(
      params.submissionId,
      { score, feedback: feedback?.trim(), gradedBy: session.user.id, gradedAt: new Date() },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: submission });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// app/api/teacher/assignments/
//   route.ts                              ← GET + POST
//   [id]/
//     route.ts                            ← GET + PATCH
//     submissions/
//       [submissionId]/
        // route.ts                        ← PATCH (grade)