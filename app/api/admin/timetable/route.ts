// ─── app/api/admin/timetable/route.ts ────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import TimetableModel from "@/models/TimeTable";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId   = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    const query: Record<string, unknown> = {};
    if (classId)   query.classId   = classId;
    if (sessionId) query.sessionId = sessionId;
    if (termId)    query.termId    = termId;

    const timetables = await TimetableModel.find(query)
      .populate("classId",             "name section")
      .populate("sessionId",           "name")
      .populate("termId",              "name")
      .populate("periods.subjectId",   "name")
      .populate("periods.teacherId",   "firstName surname")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: timetables });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      classId:   string;
      sessionId: string;
      termId:    string;
      periods?:  unknown[];
    };

    const { classId, sessionId, termId, periods } = body;

    if (!classId || !sessionId || !termId) {
      return NextResponse.json(
        { success: false, error: "Class, session and term are required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await TimetableModel.findOne({ classId, sessionId, termId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A timetable already exists for this class and term" },
        { status: 409 }
      );
    }

    const timetable = await TimetableModel.create({
      classId,
      sessionId,
      termId,
      periods:   periods ?? [],
      createdBy: session.user.id,
    });

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.CREATE,
      entity:      "Timetable",
      entityId:    timetable._id.toString(),
      description: `Created timetable for class ${classId}`,
    });

    return NextResponse.json({ success: true, data: timetable }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}