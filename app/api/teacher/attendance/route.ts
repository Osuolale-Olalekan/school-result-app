import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import ClassAssignmentModel from "@/models/ClassAssignment";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import StudentModel from "@/models/Student";
import "@/lib/registerModels";
import type { AttendanceStatus } from "@/models/AttendanceRecord";

// ─── GET /api/teacher/attendance?classId=&term=&sessionId= ───────────────────
// Returns all attendance records for a class in a given term/session
// Also returns the student list so the UI can render rows with names

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const term = searchParams.get("term") as TermName | null;
  const sessionId = searchParams.get("sessionId");

  if (!classId || !term || !sessionId) {
    return Response.json(
      { success: false, error: "classId, term, and sessionId are required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verify teacher owns this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json({ success: false, error: "Not assigned to this class" }, { status: 403 });
    }

    // Fetch students in class (active only, sorted for consistent ordering)
    const students = await StudentModel.find({
      currentClass: classId,
      studentStatus: "active",
    })
      .select("surname firstName otherName admissionNumber gender")
      .sort({ surname: 1, firstName: 1 })
      .lean();

    // Fetch all attendance records for this class + term + session
    const records = await AttendanceRecordModel.find({
      class: classId,
      session: sessionId,
      term,
    })
      .sort({ date: 1 })
      .lean();

    return Response.json({ success: true, data: { students, records } });
  } catch (error) {
    console.error("[GET /api/teacher/attendance]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/teacher/attendance ────────────────────────────────────────────
// Creates or updates (upserts) the attendance record for a specific date
// Body: { classId, sessionId, term, date (ISO), students: [{ student, morning, afternoon }] }

interface AttendanceStudentPayload {
  student: string;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
}

interface AttendancePayload {
  classId: string;
  sessionId: string;
  term: TermName;
  date: string; // ISO string e.g. "2026-05-08"
  students: AttendanceStudentPayload[];
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = (await request.json()) as AttendancePayload;
    const { classId, sessionId, term, date, students } = body;

    if (!classId || !sessionId || !term || !date || !Array.isArray(students)) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher owns this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json({ success: false, error: "Not assigned to this class" }, { status: 403 });
    }

    // Normalise date to midnight UTC to keep the unique index stable
    const normalisedDate = new Date(date);
    normalisedDate.setUTCHours(0, 0, 0, 0);

    // Upsert — one record per class per day per term/session
    const record = await AttendanceRecordModel.findOneAndUpdate(
      {
        class: classId,
        session: sessionId,
        term,
        date: normalisedDate,
      },
      {
        $set: {
          markedBy: session.user.id,
          students,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, data: record });
  } catch (error) {
    console.error("[POST /api/teacher/attendance]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}