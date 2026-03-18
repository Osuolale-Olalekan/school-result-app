// app/api/student/timetable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import TimetableModel from "@/models/TimeTable";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const StudentModel = (await import("@/models/Student")).default;
    const student = await StudentModel.findById(session.user.id, { currentClass: 1 }).lean();

    if (!student?.currentClass) {
      return NextResponse.json({ success: true, data: null });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    const query: Record<string, unknown> = { classId: student.currentClass };
    if (sessionId) query.sessionId = sessionId;
    if (termId)    query.termId    = termId;

    const timetable = await TimetableModel.findOne(query)
      .populate("classId",           "name section")
      .populate("sessionId",         "name")
      .populate("termId",            "name")
      .populate("periods.subjectId", "name")
      .populate("periods.teacherId", "firstName surname")
      .lean();

    return NextResponse.json({ success: true, data: timetable ?? null });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}