import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, StudentStatus, SessionStatus } from "@/types/enums";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { SessionModel } from "@/models/Session";
import "@/lib/registerModels";
import mongoose from "mongoose";

// ─── Shared term detector (same logic as teacher/parent side) ─────────────────

function detectCurrentTerm(terms: Array<{
  _id: string; name: string; status: string;
  startDate?: Date; endDate?: Date; schoolDaysOpen?: number;
}>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byDate = terms.find((t) => {
    if (!t.startDate || !t.endDate) return false;
    const s = new Date(t.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(t.endDate);   e.setHours(23, 59, 59, 999);
    return today >= s && today <= e;
  });
  if (byDate) return byDate;
  const byStatus = terms.find((t) => t.status === "active");
  if (byStatus) return byStatus;
  const ended = terms
    .filter((t) => t.endDate && new Date(t.endDate) < today)
    .sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime());
  if (ended.length > 0) return ended[0];
  return terms[0];
}


export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionIdParam = searchParams.get("sessionId");
  const termParam      = searchParams.get("term");
  const classIdParam   = searchParams.get("classId");

  try {
    await connectDB();

    // ── Resolve session ───────────────────────────────────────────────────────
    const sessionDoc = sessionIdParam
      ? await SessionModel.findById(sessionIdParam).populate("terms").lean()
      : await SessionModel.findOne({ status: SessionStatus.ACTIVE }).populate("terms").lean();

    if (!sessionDoc) {
      return Response.json({ success: false, error: "No session found" }, { status: 404 });
    }

    const typedSession = sessionDoc as unknown as {
      _id: string; name: string;
      terms: Array<{ _id: string; name: string; status: string; startDate?: Date; endDate?: Date; schoolDaysOpen?: number }>;
    };

    // ── Resolve term ──────────────────────────────────────────────────────────
    const term = termParam
      ? typedSession.terms.find((t) => t.name === termParam)
      : detectCurrentTerm(typedSession.terms);

    if (!term) {
      return Response.json({ success: false, error: "No term found" }, { status: 404 });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  MODE A — Student drilldown for a specific class
    // ════════════════════════════════════════════════════════════════════════
    if (classIdParam) {
      // Fetch all students in this class
        const classObjId = new mongoose.Types.ObjectId(classIdParam);  // ← ADD THIS

      const students = await UserModel.find({
        // currentClass: classIdParam,
        currentClass: classObjId,
        studentStatus: StudentStatus.ACTIVE,
      })
        .select("surname firstName otherName admissionNumber gender")
        .sort({ surname: 1, firstName: 1 })
        .lean() as unknown as Array<{
          _id: { toString(): string };
          surname: string; firstName: string; otherName?: string;
          admissionNumber: string; gender: string;
        }>;

      // Fetch all attendance records for this class/session/term
      const records = await AttendanceRecordModel.find({
        // class: classIdParam,
        class: classObjId, 
        session: typedSession._id,
        term: term.name,
      }).lean();

      const totalDaysMarked = records.length;
      const schoolDaysOpen  = term.schoolDaysOpen ?? 0;

      // Per-student aggregation
      const studentSummaries = students.map((student) => {
        let daysPresent = 0;
        let daysLate    = 0;
        let daysExcused = 0;

        for (const record of records) {
          const entry = record.students.find(
            (s) => s.student.toString() === student._id.toString()
          );
          if (!entry) continue;
          if (entry.morning   === "present") daysPresent += 0.5;
          if (entry.afternoon === "present") daysPresent += 0.5;
          if (entry.morning   === "late" || entry.afternoon === "late")    daysLate++;
          if (entry.morning   === "excused" || entry.afternoon === "excused") daysExcused++;
        }

        daysPresent = Math.round(daysPresent * 10) / 10;
        const denominator          = schoolDaysOpen > 0 ? schoolDaysOpen : totalDaysMarked;
        const daysAbsent           = Math.max(0, Math.round((denominator - daysPresent) * 10) / 10);
        const attendancePercentage = denominator > 0 ? Math.round((daysPresent / denominator) * 100) : 0;

        return {
          _id:                student._id.toString(),
          surname:            student.surname,
          firstName:          student.firstName,
          otherName:          student.otherName ?? "",
          admissionNumber:    student.admissionNumber,
          gender:             student.gender,
          daysPresent,
          daysAbsent,
          daysLate,
          daysExcused,
          attendancePercentage,
          totalDaysMarked,
          schoolDaysOpen,
        };
      });

      return Response.json({
        success: true,
        data: {
          mode:           "students",
          sessionName:    typedSession.name,
          termName:       term.name,
          totalDaysMarked,
          schoolDaysOpen,
          students:       studentSummaries,
        },
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  MODE B — Class-level overview (all classes)
    // ════════════════════════════════════════════════════════════════════════
    const classes = await ClassModel.find()
      .select("name section department order")
      .sort({ order: 1 })
      .lean() as Array<{
        _id: { toString(): string };
        name: string; section: string; department: string; order: number;
      }>;

    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        // Total active students in this class
        const totalStudents = await UserModel.countDocuments({
          currentClass: cls._id,
          studentStatus: StudentStatus.ACTIVE,
        });

        // Attendance records for this class/session/term
        const records = await AttendanceRecordModel.find({
          class: cls._id,
          session: typedSession._id,
          term: term.name,
        }).lean();

        const totalDaysMarked = records.length;
        const schoolDaysOpen  = term.schoolDaysOpen ?? 0;

        if (totalDaysMarked === 0 || totalStudents === 0) {
          return {
            classId:            cls._id.toString(),
            className:          cls.name,
            section:            cls.section,
            department:         cls.department,
            totalStudents,
            totalDaysMarked,
            schoolDaysOpen,
            averageAttendance:  0,
            studentsBelow75:    0,
            hasData:            false,
          };
        }

        // Aggregate attendance across all students
        let totalPresent = 0;
        let studentsBelow75 = 0;

        // Get unique student IDs across all records
        const studentIds = new Set<string>();
        for (const record of records) {
          for (const entry of record.students) {
            studentIds.add(entry.student.toString());
          }
        }

        for (const studentId of studentIds) {
          let studentPresent = 0;
          for (const record of records) {
            const entry = record.students.find(
              (s) => s.student.toString() === studentId
            );
            if (!entry) continue;
            if (entry.morning   === "present") studentPresent += 0.5;
            if (entry.afternoon === "present") studentPresent += 0.5;
          }
          totalPresent += studentPresent;

          const denominator = schoolDaysOpen > 0 ? schoolDaysOpen : totalDaysMarked;
          const pct = denominator > 0 ? (studentPresent / denominator) * 100 : 0;
          if (pct < 75) studentsBelow75++;
        }

        const denominator      = schoolDaysOpen > 0 ? schoolDaysOpen : totalDaysMarked;
        const avgPresent       = totalPresent / studentIds.size;
        const averageAttendance = denominator > 0
          ? Math.round((avgPresent / denominator) * 100)
          : 0;

        return {
          classId:          cls._id.toString(),
          className:        cls.name,
          section:          cls.section,
          department:       cls.department,
          totalStudents,
          totalDaysMarked,
          schoolDaysOpen,
          averageAttendance,
          studentsBelow75,
          hasData:          true,
        };
      })
    );

    return Response.json({
      success: true,
      data: {
        mode:        "classes",
        sessionId:   typedSession._id,
        sessionName: typedSession.name,
        termName:    term.name,
        terms:       typedSession.terms.map((t) => ({ _id: t._id, name: t.name, status: t.status })),
        classes:     classSummaries,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/attendance]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}