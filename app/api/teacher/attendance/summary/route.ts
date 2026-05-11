import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName, NotificationType } from "@/types/enums";
import ClassAssignmentModel from "@/models/ClassAssignment";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import AttendanceAlertModel from "@/models/AttendanceAlert";
import type { AlertThreshold } from "@/models/AttendanceAlert";
import StudentModel from "@/models/Student";
import UserModel from "@/models/User";
import { createNotification } from "@/lib/notifications";
import "@/lib/registerModels";
import type { AttendanceStatus } from "@/models/AttendanceRecord";

// ─── GET /api/teacher/attendance ─────────────────────────────────────────────
// Returns all attendance records + student list for a class/term/session

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId   = searchParams.get("classId");
  const term      = searchParams.get("term") as TermName | null;
  const sessionId = searchParams.get("sessionId");

  if (!classId || !term || !sessionId) {
    return Response.json(
      { success: false, error: "classId, term, and sessionId are required" },
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

    const students = await StudentModel.find({
      currentClass: classId,
      studentStatus: "active",
    })
      .select("surname firstName otherName admissionNumber gender")
      .sort({ surname: 1, firstName: 1 })
      .lean();

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
// Upserts attendance for a day, then checks and fires threshold notifications

interface AttendanceStudentPayload {
  student: string;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
}

interface AttendancePayload {
  classId: string;
  sessionId: string;
  term: TermName;
  date: string;
  students: AttendanceStudentPayload[];
}

const THRESHOLDS: AlertThreshold[] = [75, 50];
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json({ success: false, error: "Not assigned to this class" }, { status: 403 });
    }

    // Normalise date to midnight UTC
    const normalisedDate = new Date(date);
    normalisedDate.setUTCHours(0, 0, 0, 0);

    // ── Upsert the attendance record ────────────────────────────────────────
    const record = await AttendanceRecordModel.findOneAndUpdate(
      { class: classId, session: sessionId, term, date: normalisedDate },
      { $set: { markedBy: session.user.id, students } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Fire notifications asynchronously (don't block the response) ────────
    void checkAndNotify({ classId, sessionId, term, students });

    return Response.json({ success: true, data: record });
  } catch (error) {
    console.error("[POST /api/teacher/attendance]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── Notification logic ───────────────────────────────────────────────────────

async function checkAndNotify({
  classId,
  sessionId,
  term,
  students,
}: {
  classId: string;
  sessionId: string;
  term: TermName;
  students: AttendanceStudentPayload[];
}) {
  try {
    // Only check students who were marked absent in this submission
    // (no point checking students who were present all day)
    const absentStudentIds = students
      .filter((s) => s.morning === "absent" || s.afternoon === "absent")
      .map((s) => s.student);

    if (absentStudentIds.length === 0) return;

    // Fetch all attendance records for this class/session/term
    const allRecords = await AttendanceRecordModel.find({
      class: classId,
      session: sessionId,
      term,
    }).lean();

    const totalDaysMarked = allRecords.length;
    if (totalDaysMarked === 0) return;

    const now = new Date();

    for (const studentId of absentStudentIds) {
      // Calculate this student's current attendance percentage
      let daysPresent = 0;
      for (const record of allRecords) {
        const entry = record.students.find(
          (s) => s.student.toString() === studentId
        );
        if (!entry) continue;
        if (entry.morning   === "present") daysPresent += 0.5;
        if (entry.afternoon === "present") daysPresent += 0.5;
      }

      const percentage = Math.round((daysPresent / totalDaysMarked) * 100);

      // Check each threshold from most critical upward (50 first, then 75)
      for (const threshold of [...THRESHOLDS].sort((a, b) => a - b)) {
        if (percentage >= threshold) continue; // above this threshold, skip

        // Check if we've already notified within the last 7 days
        const existingAlert = await AttendanceAlertModel.findOne({
          student: studentId,
          session: sessionId,
          term,
          threshold,
        });

        const shouldNotify =
          !existingAlert ||
          now.getTime() - new Date(existingAlert.lastNotifiedAt).getTime() >= ONE_WEEK_MS;

        if (!shouldNotify) continue;

        // Fetch student details for the notification message
        const studentDoc = await UserModel.findById(studentId)
          .select("surname firstName parents")
          .lean() as {
            surname: string;
            firstName: string;
            parents?: string[];
          } | null;

        if (!studentDoc) continue;

        const isCritical = threshold === 50;
        const title = isCritical
          ? `⚠️ Critical Attendance Alert — ${studentDoc.surname} ${studentDoc.firstName}`
          : `Attendance Warning — ${studentDoc.surname} ${studentDoc.firstName}`;

        const message = isCritical
          ? `Your child ${studentDoc.surname} ${studentDoc.firstName}'s attendance has dropped to ${percentage}% this term, which is critically low. Please visit the school immediately.`
          : `Your child ${studentDoc.surname} ${studentDoc.firstName}'s attendance has dropped to ${percentage}% this term, below the 75% minimum requirement. Please contact the school.`;

        // Notify all linked parents
        const parentIds = studentDoc.parents ?? [];
        for (const parentId of parentIds) {
          await createNotification({
            recipientId: parentId.toString(),
            recipientRole: UserRole.PARENT,
            type: NotificationType.GENERAL,
            title,
            message,
            link: "/parent/children",
          });
        }

        // Upsert the alert record (create or update lastNotifiedAt)
        await AttendanceAlertModel.findOneAndUpdate(
          { student: studentId, session: sessionId, term, threshold },
          { $set: { lastNotifiedAt: now } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  } catch (error) {
    // Notification failures must never crash the attendance save
    console.error("[checkAndNotify]", error);
  }
}