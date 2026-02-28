import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ReportCardModel from "@/models/ReportCard";
import ClassAssignmentModel from "@/models/ClassAssignment";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import { SessionModel, TermModel } from "@/models/Session";
import NotificationModel from "@/models/Notification";
import {
  AuditAction,
  NotificationType,
  ReportStatus,
  UserRole,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { calculateSubjectGrade, calculateGrade, getOrdinal } from "@/lib/utils";
import type { ApiResponse } from "@/types";
import type { ISubjectScore } from "@/types";

interface SubjectInput {
  subject: string;
  subjectName: string;
  subjectCode: string;
  testScore: number;
  examScore: number;
  practicalScore?: number;
  hasPractical: boolean;
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

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const termId = searchParams.get("termId");

    const query: Record<string, unknown> = { submittedBy: session.user.id };
    if (classId) query.class = classId;
    if (termId) query.term = termId;

    const reports = await ReportCardModel.find(query)
      .populate("class", "name section")
      .populate("session", "name")
      .populate("term", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const body = (await request.json()) as SubmitResultBody;

    // Verify teacher has access to this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: body.classId,
      session: body.sessionId,
      isActive: true,
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Not authorized for this class" },
        { status: 403 },
      );
    }

    const [student, classDoc, sessionDoc, termDoc] = await Promise.all([
      UserModel.findById(body.studentId).lean(),
      ClassModel.findById(body.classId).lean(),
      SessionModel.findById(body.sessionId).lean(),
      TermModel.findById(body.termId).lean(),
    ]);

    if (!student || !classDoc || !sessionDoc || !termDoc) {
      return NextResponse.json(
        { success: false, error: "Invalid references" },
        { status: 400 },
      );
    }

    const typedStudent = student as {
      firstName: string;
      lastName: string;
      admissionNumber?: string;
      profilePhoto?: string;
      gender?: string;
      dateOfBirth?: Date;
      department?: string;
    };

    // Process subject scores
    const processedSubjects = body.subjects.map(
      (s): ISubjectScore & { maxTotalScore: number } => {
        const maxTest = s.hasPractical ? 20 : 30; // ← define these first
        const maxExam = s.hasPractical ? 60 : 70;
        const maxPractical = s.hasPractical ? 20 : 0;
        // const maxTotal = s.hasPractical ? 120 : 100;
        const maxTotal = maxTest + maxExam + maxPractical;
        const total = s.testScore + s.examScore + (s.practicalScore ?? 0);
        const { grade, remark } = calculateSubjectGrade(total, maxTotal);

        return {
          subject: s.subject,
          subjectName: s.subjectName,
          subjectCode: s.subjectCode,
          testScore: s.testScore,
          examScore: s.examScore,
          practicalScore: s.practicalScore ?? 0,
          totalScore: total,
          grade,
          remark,
          hasPractical: s.hasPractical,
          maxTestScore: maxTest, // ← use variables, not hardcoded 30/70
          maxExamScore: maxExam,
          maxPracticalScore: maxPractical,
          maxTotalScore: maxTotal,
        };
      },
    );

    const totalObtainable = processedSubjects.reduce(
      (sum, s) => sum + s.maxTotalScore,
      0,
    );
    const totalObtained = processedSubjects.reduce(
      (sum, s) => sum + s.totalScore,
      0,
    );
    const percentage =
      totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
    const { grade } = calculateGrade(percentage);

    const attendancePercentage =
      body.attendance.schoolDaysOpen > 0
        ? (body.attendance.daysPresent / body.attendance.schoolDaysOpen) * 100
        : 0;

    const existing = await ReportCardModel.findOne({
      student: body.studentId,
      session: body.sessionId,
      term: body.termId,
    });

    if (existing && existing.status === ReportStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "Approved reports cannot be modified" },
        { status: 400 },
      );
    }

    const reportData = {
      student: body.studentId,
      studentSnapshot: {
        firstName: typedStudent.firstName,
        lastName: typedStudent.lastName,
        admissionNumber: typedStudent.admissionNumber ?? "",
        profilePhoto: typedStudent.profilePhoto,
        gender: (typedStudent.gender ?? "male") as "male" | "female",
        dateOfBirth: typedStudent.dateOfBirth ?? new Date(),
        department: typedStudent.department ?? "none",
      },
      class: body.classId,
      className: (classDoc as { name: string }).name,
      session: body.sessionId,
      sessionName: (sessionDoc as { name: string }).name,
      term: body.termId,
      termName: (termDoc as { name: string }).name,
      subjects: processedSubjects,
      attendance: {
        ...body.attendance,
        attendancePercentage,
      },
      totalObtainable,
      totalObtained,
      percentage,
      grade,
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

    // Calculate positions for all students in the class for this term
    await recalculatePositions(body.classId, body.sessionId, body.termId);

    return NextResponse.json({
      success: true,
      data: report,
      message: "Results saved as draft",
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Separate endpoint for submitting to admin
export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const { reportIds } = (await request.json()) as { reportIds: string[] };

    // const reports = await ReportCardModel.find({
    //   _id: { $in: reportIds },
    //   submittedBy: session.user.id,
    //   status: { $in: [ReportStatus.DRAFT, ReportStatus.DECLINED] },
    // });

    const reports = await ReportCardModel.find({
      _id: { $in: reportIds },
      submittedBy: session.user.id,
      status: ReportStatus.DRAFT, // ← ONLY draft, never declined or approved
    });

    if (reports.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid reports found" },
        { status: 400 },
      );
    }

    await ReportCardModel.updateMany(
      { _id: { $in: reportIds }, submittedBy: session.user.id },
      { status: ReportStatus.SUBMITTED, submittedAt: new Date() },
    );

    // Notify admin
    const admins = await UserModel.find({
      role: UserRole.ADMIN,
      status: "active",
    }).lean();
    for (const admin of admins) {
      await createNotification({
        recipientId: (admin as { _id: { toString(): string } })._id.toString(),
        recipientRole: UserRole.ADMIN,
        type: NotificationType.REPORT_SUBMITTED,
        title: "Report Cards Submitted for Review",
        message: `${session.user.firstName} ${session.user.lastName} has submitted ${reports.length} report card(s) for approval.`,
        link: "/admin/reports",
      });
    }

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.lastName}`,
      actorRole: UserRole.TEACHER,
      action: AuditAction.UPDATE,
      entity: "ReportCard",
      entityId: reportIds.join(","),
      description: `Submitted ${reports.length} report card(s) for admin review`,
    });

    return NextResponse.json({
      success: true,
      message: `${reports.length} report(s) submitted for review`,
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function recalculatePositions(
  classId: string,
  sessionId: string,
  termId: string,
): Promise<void> {
  const reports = await ReportCardModel.find({
    class: classId,
    session: sessionId,
    term: termId,
  }).sort({ percentage: -1 });

  const totalStudents = reports.length;
  for (let i = 0; i < reports.length; i++) {
    reports[i].position = i + 1;
    reports[i].totalStudentsInClass = totalStudents;
    await reports[i].save();
  }
}
