import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SubjectModel from "@/models/Subject";
import ClassModel from "@/models/Class";
import ReportCardModel from "@/models/ReportCard";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const body = await request.json() as {
      name?: string;
      code?: string;
      hasPractical?: boolean;
      assignedClasses?: string[];
    };

    const subject = await SubjectModel.findById(id);
    if (!subject) return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });

    // If assignedClasses is being updated, sync with Class model
    if (body.assignedClasses !== undefined) {
      const oldClassIds = subject.assignedClasses.map((c) => c.toString());
      const newClassIds = body.assignedClasses;

      const removed = oldClassIds.filter((c) => !newClassIds.includes(c));
      const added = newClassIds.filter((c) => !oldClassIds.includes(c));

      if (removed.length) {
        await ClassModel.updateMany(
          { _id: { $in: removed } },
          { $pull: { subjects: subject._id } }
        );
      }
      if (added.length) {
        await ClassModel.updateMany(
          { _id: { $in: added } },
          { $addToSet: { subjects: subject._id } }
        );
      }

      subject.assignedClasses = body.assignedClasses as unknown as typeof subject.assignedClasses;
    }

    if (body.name !== undefined) subject.name = body.name.trim();
    if (body.code !== undefined) subject.code = body.code.toUpperCase().trim();
    if (body.hasPractical !== undefined) subject.hasPractical = body.hasPractical;

    await subject.save();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.UPDATE,
      entity: "Subject",
      entityId: id,
      description: `Updated subject: ${subject.name} (${subject.code})`,
    });

    const updated = await SubjectModel.findById(id).populate("assignedClasses", "name section").lean();
    return NextResponse.json({ success: true, data: updated!, message: "Subject updated successfully" });
  } catch (error) {
    
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return NextResponse.json({ success: false, error: "Subject code already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const subject = await SubjectModel.findById(id);
    if (!subject) return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });

    // Block if subject is referenced in any report cards
    const reportCardCount = await ReportCardModel.countDocuments({ "subjects.subject": id });
    if (reportCardCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete subject — it is referenced in ${reportCardCount} report card(s). Historical data must be preserved.` },
        { status: 409 }
      );
    }

    // Auto-remove from all assigned classes
    if (subject.assignedClasses.length) {
      await ClassModel.updateMany(
        { _id: { $in: subject.assignedClasses } },
        { $pull: { subjects: subject._id } }
      );
    }

    const subjectName = subject.name;
    const subjectCode = subject.code;
    await subject.deleteOne();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.DELETE,
      entity: "Subject",
      entityId: id,
      description: `Deleted subject: ${subjectName} (${subjectCode})`,
    });

    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}