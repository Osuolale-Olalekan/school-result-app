import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import { AuditAction, ClassLevel, Department, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import SubjectModel from "@/models/Subject";
import { CLASS_ORDER, CLASS_SECTION } from "@/lib/promotion";
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
    const classes = await ClassModel.find()
      .populate("subjects", "name code hasPractical")
      .populate("classTeacher", "surname firstName otherName email")
      .sort({ order: 1 })
      .lean();
    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    // console.error("Get classes error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json() as {
      name: ClassLevel;
      department?: Department;
      capacity?: number;
    };

    const section = CLASS_SECTION[body.name];
    const order = CLASS_ORDER[body.name];

    if (!section || !order) {
      return NextResponse.json({ success: false, error: "Invalid class name" }, { status: 400 });
    }

    const newClass = await ClassModel.create({
      name: body.name,
      section,
      department: body.department ?? Department.NONE,
      capacity: body.capacity,
      order,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "Class",
      entityId: newClass._id.toString(),
      description: `Created class: ${body.name}`,
    });

    return NextResponse.json({ success: true, data: newClass, message: "Class created" }, { status: 201 });
  } catch (error) {
    // console.error("Create class error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
