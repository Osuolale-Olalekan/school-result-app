import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BehaviourRecordModel from "@/models/BehaviourRecord";
import {
  AuditAction,
  BehaviourCategory,
  BehaviourSeverity,
  BehaviourType,
  NotificationType,
  UserRole,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { createBulkNotifications } from "@/lib/notifications";

// ─── GET /api/teacher/behaviour ───────────────────────────────────────────────
// Teacher views records they have logged

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page")  ?? "1");
    const limit    = parseInt(searchParams.get("limit") ?? "15");
    const type     = searchParams.get("type");
    const category = searchParams.get("category");

    const query: Record<string, unknown> = { loggedBy: session.user.id };
    if (type)     query.type     = type;
    if (category) query.category = category;

    const total   = await BehaviourRecordModel.countDocuments(query);
    const records = await BehaviourRecordModel.find(query)
      .populate("studentId", "firstName surname admissionNumber currentClass")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/teacher/behaviour ──────────────────────────────────────────────
// Teacher logs a behaviour record for a student in their assigned class

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      studentId:    string;
      date?:        string;
      type:         BehaviourType;
      category:     BehaviourCategory;
      description:  string;
      severity?:    BehaviourSeverity;
      actionTaken?: string;
    };

    const { studentId, date, type, category, description, severity, actionTaken } = body;

    if (!studentId || !type || !category || !description?.trim()) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (type === BehaviourType.NEGATIVE && !severity) {
      return NextResponse.json(
        { success: false, error: "Severity is required for negative records" },
        { status: 400 }
      );
    }

    // ── Fetch student: name from UserModel, class + parents from StudentModel ──
    const UserModel            = (await import("@/models/User")).default;
    const StudentModel         = (await import("@/models/Student")).default;
    const ClassAssignmentModel = (await import("@/models/ClassAssignment")).default;

    const [studentUser, studentDoc] = await Promise.all([
      UserModel.findById(studentId,    { firstName: 1, surname: 1 }).lean(),
      StudentModel.findById(studentId, { currentClass: 1, parents: 1 }).lean(),
    ]);

    if (!studentUser || !studentDoc) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // ── Guard: teacher must be assigned to the student's class ───────────
    const assignment = await ClassAssignmentModel.findOne({
      teacherId: session.user.id,
      classId:   studentDoc.currentClass,
    }).lean();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "You are not assigned to this student's class" },
        { status: 403 }
      );
    }

    const studentName = `${studentUser.firstName ?? ""} ${studentUser.surname ?? ""}`.trim();

    // ── Create record ─────────────────────────────────────────────────────
    const record = await BehaviourRecordModel.create({
      studentId,
      loggedBy:       session.user.id,
      date:           date ? new Date(date) : new Date(),
      type,
      category,
      description:    description.trim(),
      severity:       type === BehaviourType.NEGATIVE ? severity : undefined,
      actionTaken:    actionTaken?.trim() || undefined,
      parentNotified: false,
    });

    // ── Notify parents for every negative record ──────────────────────────
    if (type === BehaviourType.NEGATIVE && studentDoc.parents?.length) {
      const categoryLabel = category.replace(/_/g, " ");
      const trimmedDesc   = description.trim();
      const msgBody = `A ${severity} severity behaviour record (${categoryLabel}) has been logged for ${studentName}. Description: ${trimmedDesc.slice(0, 120)}${trimmedDesc.length > 120 ? "…" : ""}`;

      await createBulkNotifications(
        studentDoc.parents.map((parentId) => ({
          recipientId:   String(parentId),
          recipientRole: UserRole.PARENT,
          type:          NotificationType.GENERAL,
          title:         `Behaviour Record — ${studentName}`,
          message:       msgBody,
          link:          `/parent/behaviour`,
        }))
      );

      await BehaviourRecordModel.findByIdAndUpdate(record._id, { parentNotified: true });
    }

    // ── Audit ─────────────────────────────────────────────────────────────
    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.TEACHER,
      action:      AuditAction.CREATE,
      entity:      "BehaviourRecord",
      entityId:    record._id.toString(),
      description: `Teacher logged ${type} behaviour record (${category}) for ${studentName}`,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}