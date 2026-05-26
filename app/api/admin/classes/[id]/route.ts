import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import ReportCardModel from "@/models/ReportCard";
import "@/lib/registerModels";
import { AuditAction, ClassLevel, Department, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { CLASS_ORDER, CLASS_SECTION } from "@/lib/promotion";
import type { ApiResponse } from "@/types";
import StudentModel from "@/models/Student";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const cls = await ClassModel.findById(id)
      .populate("subjects", "name code hasPractical")
      .populate("classTeacher", "surname firstName otherName")
      .lean();

    if (!cls) return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });

    // Get all active students in this class
    const students = await StudentModel.find({ currentClass: id, studentStatus: "active" })
      .select("surname firstName otherName admissionNumber gender department")
      .sort({ surname: 1 })
      .lean();

    // Get latest report card status per student
    const studentIds = students.map((s) => s._id);
    const latestReports = await ReportCardModel.find({ student: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .select("student status termName sessionName")
      .lean();

    // Map student id → latest report
    const reportMap = new Map<string, { status: string; termName: string; sessionName: string }>();
    for (const r of latestReports) {
      const sid = r.student.toString();
      if (!reportMap.has(sid)) {
        reportMap.set(sid, {
          status: r.status,
          termName: (r as unknown as { termName: string }).termName,
          sessionName: (r as unknown as { sessionName: string }).sessionName,
        });
      }
    }

    const studentsWithStatus = students.map((s) => ({
      ...s,
      latestReport: reportMap.get(s._id.toString()) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { ...cls, students: studentsWithStatus },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
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
      name?: ClassLevel;
      department?: Department;
      capacity?: number;
      classTeacher?: string;
      subjects?: string[];
    };

    const existingClass = await ClassModel.findById(id);
    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
    }

    if (body.name) {
      const section = CLASS_SECTION[body.name];
      const order = CLASS_ORDER[body.name];
      if (!section || !order) {
        return NextResponse.json({ success: false, error: "Invalid class name" }, { status: 400 });
      }
      existingClass.name = body.name;
      existingClass.section = section;
      existingClass.order = order;
    }

    if (body.department !== undefined) existingClass.department = body.department;
    if (body.capacity !== undefined) existingClass.capacity = body.capacity;
    if (body.classTeacher !== undefined) existingClass.classTeacher = body.classTeacher as unknown as typeof existingClass.classTeacher;
    if (body.subjects !== undefined) existingClass.subjects = body.subjects as unknown as typeof existingClass.subjects;

    await existingClass.save();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.UPDATE,
      entity: "Class",
      entityId: id,
      description: `Updated class: ${existingClass.name}`,
    });

    const updated = await ClassModel.findById(id)
      .populate("subjects", "name code hasPractical")
      .populate("classTeacher", "surname firstName otherName email")
      .lean();

    return NextResponse.json({ success: true, data: updated!, message: "Class updated successfully" });
  } catch (error) {
    // console.error("Update class error:", error);
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

    const existingClass = await ClassModel.findById(id);
    if (!existingClass) {
      return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
    }

    // Block deletion if students are assigned to this class
    const studentCount = await StudentModel.countDocuments({ currentClass: id });
    if (studentCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete class — ${studentCount} student(s) are currently assigned to it. Reassign them first.` },
        { status: 409 }
      );
    }

    const className = existingClass.name;
    await existingClass.deleteOne();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.DELETE,
      entity: "Class",
      entityId: id,
      description: `Deleted class: ${className}`,
    });

    return NextResponse.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    // console.error("Delete class error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}