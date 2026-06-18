import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import ClassAssignmentModel from "@/models/ClassAssignment";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import { TermModel } from "@/models/Session";

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId   = searchParams.get("classId");
  const sessionId = searchParams.get("sessionId");
  const term      = searchParams.get("term") as TermName | null;
  const termId    = searchParams.get("termId");
  const studentId = searchParams.get("studentId");

  if (!classId || !sessionId || !term || !termId || !studentId) {
    return Response.json(
      { success: false, error: "classId, sessionId, term, termId, and studentId are required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json({ success: false, error: "Not assigned to this class" }, { status: 403 });
    }

    const termDoc        = await TermModel.findById(termId).select("schoolDaysOpen").lean();
    const schoolDaysOpen = termDoc?.schoolDaysOpen ?? 0;

    const records = await AttendanceRecordModel.find({
      class: classId,
      session: sessionId,
      term,
    }).lean();

    let daysPresent = 0;
    for (const record of records) {
      const entry = record.students.find((s) => s.student.toString() === studentId);
      if (!entry) continue;
      if (entry.morning   === "present" || entry.morning   === "late") daysPresent += 0.5;
      if (entry.afternoon === "present" || entry.afternoon === "late") daysPresent += 0.5;
    }

    const daysAbsent = Math.max(0, schoolDaysOpen - daysPresent);

    return Response.json({
      success: true,
      data: { schoolDaysOpen, daysPresent, daysAbsent },
    });
  } catch (error) {
    console.error("[GET /api/teacher/attendance/summary]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
