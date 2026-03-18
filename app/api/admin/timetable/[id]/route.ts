// app/api/admin/timetable/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import TimetableModel, { ITimetablePeriod } from "@/models/TimeTable"
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const timetable = await TimetableModel.findById(id)
      .populate("classId",           "name section")
      .populate("sessionId",         "name")
      .populate("termId",            "name")
      .populate("periods.subjectId", "name")
      .populate("periods.teacherId", "firstName surname")
      .lean();

    if (!timetable) {
      return NextResponse.json({ success: false, error: "Timetable not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: timetable });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const timetable = await TimetableModel.findById(id);
    if (!timetable) {
      return NextResponse.json({ success: false, error: "Timetable not found" }, { status: 404 });
    }

    const body = await request.json() as { periods: ITimetablePeriod[] };

    if (!Array.isArray(body.periods)) {
      return NextResponse.json({ success: false, error: "Periods array is required" }, { status: 400 });
    }

    timetable.periods = body.periods;
    await timetable.save();

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.UPDATE,
      entity:      "Timetable",
      entityId:    id,
      description: `Updated timetable periods`,
    });

    return NextResponse.json({ success: true, data: timetable });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const timetable = await TimetableModel.findByIdAndDelete(id);
    if (!timetable) {
      return NextResponse.json({ success: false, error: "Timetable not found" }, { status: 404 });
    }

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.DELETE,
      entity:      "Timetable",
      entityId:    id,
      description: `Deleted timetable`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}