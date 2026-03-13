// app/api/student/assignments/[id]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { UserRole } from "@/types/enums";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const SubmissionModel = (await import("@/models/Submission")).default;
    const { id: assignmentId } = await params;

    const assignment = await AssignmentModel.findById(assignmentId).lean();
    if (!assignment || assignment.status !== "published") {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    // Block resubmission
    const existing = await SubmissionModel.findOne({
      assignmentId, studentId: session.user.id,
    });
    if (existing?.isSubmitted) {
      return NextResponse.json(
        { success: false, error: "You have already submitted this assignment" },
        { status: 409 }
      );
    }

    const body = await request.json() as {
      textAnswer?:  string;
      attachments?: string[];
    };

    if (!body.textAnswer?.trim() && !body.attachments?.length) {
      return NextResponse.json(
        { success: false, error: "Please provide a text answer or attach a file" },
        { status: 400 }
      );
    }

    const now    = new Date();
    const isLate = now > new Date(assignment.dueDate);

    const submission = existing
      ? await SubmissionModel.findByIdAndUpdate(
          existing._id,
          {
            textAnswer:  body.textAnswer?.trim() || undefined,
            attachments: body.attachments ?? [],
            submittedAt: now,
            isSubmitted: true,
            isLate,
          },
          { new: true }
        )
      : await SubmissionModel.create({
          assignmentId,
          studentId:   session.user.id,
          textAnswer:  body.textAnswer?.trim() || undefined,
          attachments: body.attachments ?? [],
          submittedAt: now,
          isSubmitted: true,
          isLate,
        });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}