import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import ClassAssignmentModel from "@/models/ClassAssignment";
import { TermModel } from "@/models/Session";
import "@/lib/registerModels";

// ─── GET /api/teacher/attendance/summary ─────────────────────────────────────
// Returns pre-calculated attendance for ONE student to auto-fill the report card.
//
// Query params:
//   classId    — the class ObjectId
//   sessionId  — the session ObjectId
//   term       — TermName string ("first" | "second" | "third")
//   termId     — Term document ObjectId (used to fetch schoolDaysOpen)
//   studentId  — the student ObjectId
//
// Response:
//   {
//     schoolDaysOpen: number,   // from Term.schoolDaysOpen
//     daysPresent:    number,   // sum of 0.5 per session where student = "present"
//     daysAbsent:     number,   // schoolDaysOpen - daysPresent (floored to 0)
//   }

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

    // Verify teacher is assigned to this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json(
        { success: false, error: "Not assigned to this class" },
        { status: 403 }
      );
    }

    // Get schoolDaysOpen from the Term document
    const termDoc = await TermModel.findById(termId).lean();
    const schoolDaysOpen: number = (termDoc as { schoolDaysOpen?: number } | null)?.schoolDaysOpen ?? 0;

    // Fetch all attendance records for this class + session + term
    const records = await AttendanceRecordModel.find({
      class: classId,
      session: sessionId,
      term,
    }).lean();

    // For each record (= one school day), check this student's morning + afternoon
    // Morning present = +0.5, Afternoon present = +0.5
    let daysPresent = 0;

    for (const record of records) {
      const entry = record.students.find(
        (s) => s.student.toString() === studentId
      );
      if (!entry) continue;

      if (entry.morning === "present") daysPresent += 0.5;
      if (entry.afternoon === "present") daysPresent += 0.5;
    }

    // Round to 1 decimal place to avoid floating point noise (e.g. 0.1 + 0.2)
    daysPresent = Math.round(daysPresent * 10) / 10;

    const daysAbsent = Math.max(0, Math.round((schoolDaysOpen - daysPresent) * 10) / 10);

    return Response.json({
      success: true,
      data: {
        schoolDaysOpen,
        daysPresent,
        daysAbsent,
      },
    });
  } catch (error) {
    console.error("[GET /api/teacher/attendance/summary]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}