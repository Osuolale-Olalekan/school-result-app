import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";
import { StudentStatus, TermName } from "@/types/enums";
import { connectDB } from "@/lib/db";
import ReportCardModel from "@/models/ReportCard";
import ClassAssignmentModel from "@/models/ClassAssignment";
import TermSubjectConfigModel from "@/models/TermSubjectConfig";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import { SessionModel, TermModel } from "@/models/Session";
import {
  AuditAction,
  NotificationType,
  ReportStatus,
  UserRole,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { calculateSubjectGrade, calculateGrade } from "@/lib/utils";
import type { ApiResponse } from "@/types";
import type { ISubjectScore } from "@/types";
import "@/lib/registerModels";


interface SubjectInput {
  subject: string;
  subjectName: string;
  subjectCode: string;
  testScore: number;
  examScore: number;
  practicalScore?: number;
  hasPractical: boolean;
  excludedThisTerm?: boolean;

}

interface SubmitResultBody {
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  subjects: SubjectInput[];
  attendance: {
    schoolDaysOpen: number;
    daysPresent: number;
    daysAbsent: number;
  };
  teacherComment?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const termId  = searchParams.get("termId");
    const query: Record<string, unknown> = { submittedBy: session.user.id };
    if (classId) query.class = classId;
    if (termId)  query.term  = termId;
    const reports = await ReportCardModel.find(query)
      .populate("class",   "name section")
      .populate("session", "name")
      .populate("term",    "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: reports });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const body = (await request.json()) as SubmitResultBody;

    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id, class: body.classId, session: body.sessionId, isActive: true,
    });
    if (!assignment) {
      return NextResponse.json({ success: false, error: "Not authorized for this class" }, { status: 403 });
    }

    const [student, classDoc, sessionDoc, termDoc] = await Promise.all([
      UserModel.findById(body.studentId).lean(),
      ClassModel.findById(body.classId).lean(),
      SessionModel.findById(body.sessionId).lean(),
      TermModel.findById(body.termId).lean(),
    ]);

    if (!student || !classDoc || !sessionDoc || !termDoc) {
      return NextResponse.json({ success: false, error: "Invalid references" }, { status: 400 });
    }

    // ── Fetch admin-level excluded subjects ───────────────────────────────────
    const termName = (termDoc as { name: string }).name;
    const adminConfig = await TermSubjectConfigModel.findOne({
      class: body.classId, session: body.sessionId, term: termName,
    }).lean();

    const adminExcludedIds = new Set(
      (adminConfig?.excludedSubjects ?? []).map((id) => id.toString())
    );

    // ── Filter: skip admin-excluded AND teacher-excluded subjects ─────────────
    const activeSubjects = body.subjects.filter((s) => {
      return !adminExcludedIds.has(s.subject) && s.excludedThisTerm !== true;
    });

    if (activeSubjects.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one subject must be offered this term" },
        { status: 400 }
      );
    }

    const typedStudent = student as {
      surname: string; firstName: string; otherName?: string;
      admissionNumber?: string; profilePhoto?: string;
      gender?: string; dateOfBirth?: Date; department?: string;
    };

    // ── Process only active subjects ──────────────────────────────────────────
    const processedSubjects = activeSubjects.map((s): ISubjectScore & { maxTotalScore: number } => {
      const maxTest      = s.hasPractical ? 20 : 30;
      const maxExam      = s.hasPractical ? 60 : 70;
      const maxPractical = s.hasPractical ? 20 : 0;
      const maxTotal     = maxTest + maxExam + maxPractical;
      const total        = s.testScore + s.examScore + (s.practicalScore ?? 0);
      const { grade, remark } = calculateSubjectGrade(total, maxTotal);
      return {
        subject: s.subject, subjectName: s.subjectName, subjectCode: s.subjectCode,
        testScore: s.testScore, examScore: s.examScore, practicalScore: s.practicalScore ?? 0,
        totalScore: total, grade, remark, hasPractical: s.hasPractical,
        maxTestScore: maxTest, maxExamScore: maxExam,
        maxPracticalScore: maxPractical, maxTotalScore: maxTotal,
      };
    });

    // ── Totals from active subjects only ──────────────────────────────────────
    const totalObtainable = processedSubjects.reduce((sum, s) => sum + s.maxTotalScore, 0);
    const totalObtained   = processedSubjects.reduce((sum, s) => sum + s.totalScore,    0);
    const percentage      = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
    const { grade }       = calculateGrade(percentage);

    const attendancePercentage =
      body.attendance.schoolDaysOpen > 0
        ? (body.attendance.daysPresent / body.attendance.schoolDaysOpen) * 100
        : 0;

    const existing = await ReportCardModel.findOne({
      student: body.studentId, session: body.sessionId, term: body.termId,
    });

    if (existing && existing.status === ReportStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "Approved reports cannot be modified" },
        { status: 400 }
      );
    }

    const reportData = {
      student: body.studentId,
      studentSnapshot: {
        surname: typedStudent.surname, firstName: typedStudent.firstName,
        otherName: typedStudent.otherName,
        admissionNumber: typedStudent.admissionNumber ?? "",
        profilePhoto: typedStudent.profilePhoto,
        gender: (typedStudent.gender ?? "male") as "male" | "female",
        dateOfBirth: typedStudent.dateOfBirth ?? new Date(),
        department: typedStudent.department ?? "none",
      },
      class: body.classId, className: (classDoc as { name: string }).name,
      session: body.sessionId, sessionName: (sessionDoc as { name: string }).name,
      term: body.termId, termName: (termDoc as { name: string }).name,
      subjects: processedSubjects,
      attendance: { ...body.attendance, attendancePercentage },
      totalObtainable, totalObtained, percentage, grade,
      teacherComment: body.teacherComment,
      submittedBy: session.user.id,
      status: ReportStatus.DRAFT,
    };

    let report;
    if (existing) {
      Object.assign(existing, reportData);
      existing.status = ReportStatus.DRAFT;
      existing.declineReason = undefined;
      report = await existing.save();
    } else {
      report = await ReportCardModel.create(reportData);
    }

    await recalculatePositions(body.classId, body.sessionId, body.termId);


    return NextResponse.json({ success: true, data: report, message: "Results saved as draft" });
  } catch (error) {
    console.error("[POST /api/teacher/results]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const { reportIds } = (await request.json()) as { reportIds: string[] };

    const reports = await ReportCardModel.find({
      _id: { $in: reportIds }, submittedBy: session.user.id, status: ReportStatus.DRAFT,
    });

    if (reports.length === 0) {
      return NextResponse.json({ success: false, error: "No valid reports found" }, { status: 400 });
    }

    await ReportCardModel.updateMany(
      { _id: { $in: reportIds }, submittedBy: session.user.id },
      { status: ReportStatus.SUBMITTED, submittedAt: new Date() },
    );

    const admins = await UserModel.find({ roles: UserRole.ADMIN, status: "active" }).lean();
    for (const admin of admins) {
      await createNotification({
        recipientId:   (admin as { _id: { toString(): string } })._id.toString(),
        recipientRole: UserRole.ADMIN,
        type:          NotificationType.REPORT_SUBMITTED,
        title:         "Report Cards Submitted for Review",
        message:       `${session.user.surname} ${session.user.firstName} ${session.user.otherName} has submitted ${reports.length} report card(s) for approval.`,
        link:          "/admin/reports",
      });
    }

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole:   UserRole.TEACHER,
      action:      AuditAction.UPDATE,
      entity:      "ReportCard",
      entityId:    reportIds.join(","),
      description: `Submitted ${reports.length} report card(s) for admin review`,
    });

    return NextResponse.json({ success: true, message: `${reports.length} report(s) submitted for review` });
  } catch (error) {
    console.error("[PATCH /api/teacher/results]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function recalculatePositions(classId: string, sessionId: string, termId: string): Promise<void> {
  const reports = await ReportCardModel.find({ class: classId, session: sessionId, term: termId }).lean();
  if (reports.length === 0) return;

   // ── NEW: per-subject "best in subject" rankings ──────────────────────────
  const subjectGroups = new Map<string, Array<{ reportId: string; subjectIndex: number; totalScore: number }>>();

  reports.forEach((report) => {
    report.subjects.forEach((s, idx) => {
      const key = s.subject.toString();
      if (!subjectGroups.has(key)) subjectGroups.set(key, []);
      subjectGroups.get(key)!.push({ reportId: report._id.toString(), subjectIndex: idx, totalScore: s.totalScore });
    });
  });

  const subjectPositionUpdates = new Map<string, Record<number, number>>();
  for (const entries of subjectGroups.values()) {
    const sorted = [...entries].sort((a, b) => b.totalScore - a.totalScore);
    sorted.forEach((e, i) => {
      if (!subjectPositionUpdates.has(e.reportId)) subjectPositionUpdates.set(e.reportId, {});
      subjectPositionUpdates.get(e.reportId)![e.subjectIndex] = i + 1;
    });
  }

  for (const [reportId, positions] of subjectPositionUpdates.entries()) {
    const report = reports.find((r) => r._id.toString() === reportId)!;
    const updatedSubjects = report.subjects.map((s, idx) => ({
      ...s,
      subjectPosition: positions[idx] ?? s.subjectPosition ?? 0,
    }));
    await ReportCardModel.findByIdAndUpdate(reportId, { subjects: updatedSubjects });
  }

  // ✅ FIX: total students in class = how many report cards exist for this term,
  // NOT a live headcount of who's currently still in the class.
  const totalInClass = reports.length;

  const allSorted = [...reports].sort((a, b) => b.percentage - a.percentage);
  const overallPositionMap = new Map<string, number>();
  allSorted.forEach((r, i) => overallPositionMap.set(r._id.toString(), i + 1));

  const departments = [...new Set(reports.map((r) => {
    const snap = r.studentSnapshot as { department?: string };
    return snap?.department ?? "none";
  }))];
  const meaningfulDepts   = departments.filter((d) => d !== "none");
  const shouldSplitByDept = meaningfulDepts.length >= 1 && departments.length > 1;

  if (!shouldSplitByDept) {
    for (let i = 0; i < allSorted.length; i++) {
      await ReportCardModel.findByIdAndUpdate(allSorted[i]._id, {
        position: i + 1, overallPosition: i + 1,
        totalStudentsInClass: totalInClass, totalStudentsInDept: totalInClass,
      });
    }
    return;
  }

  for (const dept of departments) {
    const deptReports = reports
      .filter((r) => ((r.studentSnapshot as { department?: string })?.department ?? "none") === dept)
      .sort((a, b) => b.percentage - a.percentage);

    // ✅ FIX: same idea — count report cards in this department, not live enrollment
    const totalInDept = deptReports.length;

    for (let i = 0; i < deptReports.length; i++) {
      await ReportCardModel.findByIdAndUpdate(deptReports[i]._id, {
        position: i + 1,
        overallPosition: overallPositionMap.get(deptReports[i]._id.toString()) ?? i + 1,
        totalStudentsInClass: totalInClass,
        totalStudentsInDept:  totalInDept,
      });
    }
  }
}