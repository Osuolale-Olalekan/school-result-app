import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ClassAssignmentModel from "@/models/ClassAssignment";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
// import { SessionModel } from "@/models/Session";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const assignments = await ClassAssignmentModel.find({ isActive: true })
      .populate("teacher", "surname firstName otherName email employeeId")
      .populate("class", "name section department")
      .populate("session", "name status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { teacherId, classId, sessionId } = await request.json() as {
      teacherId: string;
      classId: string;
      sessionId: string;
    };

    const existing = await ClassAssignmentModel.findOne({
      teacher: teacherId,
      class: classId,
      session: sessionId,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return NextResponse.json({ success: true, data: existing, message: "Assignment reactivated" });
      }
      return NextResponse.json({ success: false, error: "Assignment already exists" }, { status: 409 });
    }

    const assignment = await ClassAssignmentModel.create({
      teacher: teacherId,
      class: classId,
      session: sessionId,
      isActive: true,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "ClassAssignment",
      entityId: assignment._id.toString(),
      description: `Assigned teacher to class`,
    });

    return NextResponse.json({ success: true, data: assignment, message: "Teacher assigned to class" }, { status: 201 });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "Assignment ID required" }, { status: 400 });

    const assignment = await ClassAssignmentModel.findById(id)
      .populate("teacher", "surname firstName otherName")
      .populate("class", "name");

    if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });

    await assignment.deleteOne();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.DELETE,
      entity: "ClassAssignment",
      entityId: id,
      description: `Removed class assignment`,
    });

    return NextResponse.json({ success: true, message: "Assignment removed successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}