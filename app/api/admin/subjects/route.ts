import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
// import { UserRole } from "@/types/enums";
import { connectDB } from "@/lib/db";
import SubjectModel from "@/models/Subject";
import ClassModel from "@/models/Class";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const subjects = await SubjectModel.find()
      .populate("assignedClasses", "name section")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json() as {
      name: string;
      code: string;
      hasPractical: boolean;
      department?: string;
      assignedClasses?: string[];
    };

    const subject = await SubjectModel.create({
      name: body.name.trim(),
      code: body.code.toUpperCase().trim(),
      hasPractical: body.hasPractical ?? false,
      department: body.department ?? "general",
      assignedClasses: body.assignedClasses ?? [],
    });

    // Also update each assigned class to include this subject
    if (body.assignedClasses?.length) {
      await ClassModel.updateMany(
        { _id: { $in: body.assignedClasses } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "Subject",
      entityId: subject._id.toString(),
      description: `Created subject: ${body.name} (${body.code})`,
    });

    return NextResponse.json({ success: true, data: subject, message: "Subject created" }, { status: 201 });
  } catch (error) {
    
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return NextResponse.json({ success: false, error: "Subject code already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
