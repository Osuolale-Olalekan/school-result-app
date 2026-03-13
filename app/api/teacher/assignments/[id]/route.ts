// app/api/teacher/assignments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const SubmissionModel = (await import("@/models/Submission")).default;

    const assignment = await AssignmentModel.findOne({
      _id: id, createdBy: session.user.id,
    })
      .populate("classId",   "name section")
      .populate("subjectId", "name")
      .lean();

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    const submissions = await SubmissionModel.find({ assignmentId: id })
      .populate("studentId", "firstName surname admissionNumber")
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: { assignment, submissions } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const assignment = await AssignmentModel.findOne({
      _id: id, createdBy: session.user.id,
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    const body = await request.json() as Partial<{
      title:       string;
      description: string;
      dueDate:     string;
      maxScore:    number;
      status:      "draft" | "published";
      attachments: string[];
    }>;

    if (body.title !== undefined)       assignment.title       = body.title.trim();
    if (body.description !== undefined) assignment.description = body.description.trim();
    if (body.dueDate !== undefined)     assignment.dueDate     = new Date(body.dueDate);
    if (body.maxScore !== undefined)    assignment.maxScore    = body.maxScore;
    if (body.status !== undefined)      assignment.status      = body.status;
    if (body.attachments !== undefined) assignment.attachments = body.attachments;

    await assignment.save();

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.TEACHER,
      action:      AuditAction.UPDATE,
      entity:      "Assignment",
      entityId:    assignment._id.toString(),
      description: `Updated assignment "${assignment.title}"`,
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}