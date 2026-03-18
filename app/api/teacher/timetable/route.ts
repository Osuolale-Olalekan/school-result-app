// ─── app/api/teacher/timetable/route.ts ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import TimetableModel from "@/models/TimeTable";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    const query: Record<string, unknown> = {
      "periods.teacherId": session.user.id,
    };
    if (sessionId) query.sessionId = sessionId;
    if (termId)    query.termId    = termId;

    const timetables = await TimetableModel.find(query)
      .populate("classId",           "name section")
      .populate("sessionId",         "name")
      .populate("termId",            "name")
      .populate("periods.subjectId", "name")
      .populate("periods.teacherId", "firstName surname")
      .lean();

    // Only return periods that belong to this teacher
    const filtered = timetables.map((t) => ({
      ...t,
      periods: t.periods.filter(
        (p) => p.teacherId?.toString() === session.user.id
      ),
    }));

    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}