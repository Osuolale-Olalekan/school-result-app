import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole } from "@/types/enums";
import UserModel from "@/models/User";
import AttendanceRecordModel from "@/models/AttendanceRecord";
import { SessionModel, TermModel } from "@/models/Session";
import { SessionStatus } from "@/types/enums";
import "@/lib/registerModels";



function detectCurrentTerm(terms: Array<{
  _id: string;
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  schoolDaysOpen?: number;
}>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Date range match
  const byDate = terms.find((t) => {
    if (!t.startDate || !t.endDate) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });
  if (byDate) return byDate;

  // 2. status === "active"
  const byStatus = terms.find((t) => t.status === "active");
  if (byStatus) return byStatus;

  // 3. Most recently ended
  const ended = terms
    .filter((t) => t.endDate && new Date(t.endDate) < today)
    .sort((a, b) => new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime());
  if (ended.length > 0) return ended[0];

  return terms[0];
}

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();

  const hasParentAccess =
    session?.user?.activeRole === UserRole.PARENT ||
    session?.user?.roles?.includes(UserRole.PARENT);

  if (!session?.user || !hasParentAccess) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return Response.json({ success: false, error: "studentId is required" }, { status: 400 });
  }

  try {
    await connectDB();

    // Verify this child belongs to the parent
    const parent = await UserModel.findById(session.user.id)
      .select("children")
      .lean() as { children: string[] } | null;

    if (!parent) {
      return Response.json({ success: false, error: "Parent not found" }, { status: 404 });
    }

    const childIds = parent.children.map((id) => id.toString());
    if (!childIds.includes(studentId)) {
      return Response.json({ success: false, error: "Not authorized for this student" }, { status: 403 });
    }

    // Get child's current class
    const child = await UserModel.findById(studentId)
      .select("currentClass")
      .lean() as { currentClass: string } | null;

    if (!child?.currentClass) {
      return Response.json({ success: false, error: "Student class not found" }, { status: 404 });
    }

    // Get active session with terms
    const activeSession = await SessionModel.findOne({ status: SessionStatus.ACTIVE })
      .populate("terms")
      .lean() as {
        _id: string;
        name: string;
        terms: Array<{
          _id: string;
          name: string;
          status: string;
          startDate?: Date;
          endDate?: Date;
          schoolDaysOpen?: number;
        }>;
      } | null;

    if (!activeSession) {
      return Response.json({ success: false, error: "No active session found" }, { status: 404 });
    }

    // Detect current term using same date-based logic as teacher view
    const currentTerm = detectCurrentTerm(activeSession.terms);

    if (!currentTerm) {
      return Response.json({ success: false, error: "No current term found" }, { status: 404 });
    }

    // Fetch all attendance records for this class in current term
    const records = await AttendanceRecordModel.find({
      class: child.currentClass,
      session: activeSession._id,
      term: currentTerm.name,
    })
      .sort({ date: 1 })
      .lean();

    // Calculate summary
    let daysPresent = 0;
    const breakdown: Array<{ date: string; morning: string; afternoon: string }> = [];

    for (const record of records) {
      const entry = record.students.find(
        (s) => s.student.toString() === studentId
      );

      const morning = entry?.morning ?? "absent";
      const afternoon = entry?.afternoon ?? "absent";

      if (morning === "present") daysPresent += 0.5;
      if (afternoon === "present") daysPresent += 0.5;

      breakdown.push({
        date: new Date(record.date).toISOString().split("T")[0],
        morning,
        afternoon,
      });
    }

    daysPresent = Math.round(daysPresent * 10) / 10;

    const schoolDaysOpen = currentTerm.schoolDaysOpen ?? 0;
    const totalDaysMarked = records.length;

    // Use schoolDaysOpen if set, otherwise use totalDaysMarked as denominator
    const denominator = schoolDaysOpen > 0 ? schoolDaysOpen : totalDaysMarked;
    const daysAbsent = Math.max(0, Math.round((denominator - daysPresent) * 10) / 10);
    const attendancePercentage =
      denominator > 0 ? Math.round((daysPresent / denominator) * 100) : 0;

    return Response.json({
      success: true,
      data: {
        termName: currentTerm.name,
        sessionName: activeSession.name,
        schoolDaysOpen,
        totalDaysMarked,
        daysPresent,
        daysAbsent,
        attendancePercentage,
        breakdown,
      },
    });
  } catch (error) {
    console.error("[GET /api/parent/attendance]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}