// This route handles both GET and PATCH requests for a specific report card by ID with Ai auto comments
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import ClassModel from "@/models/Class";
import {
  AuditAction,
  NotificationType,
  ReportStatus,
  StudentStatus,
  TermName,
  UserRole,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { sendReportDeclinedEmail, sendReportAvailableEmail } from "@/lib/email";
import { CLASS_PROGRESSION } from "@/lib/promotion";
import { generateAIPrincipalComment } from "@/lib/aicomment";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handlePromotion(
  studentId: string,
  sessionId: string,
  currentClassName: string,
): Promise<{
  promoted: boolean;
  graduated: boolean;
  requiresDeptAssignment: boolean;
  nextClassName: string | null;
  performanceUnderReview: boolean;
}> {
  const sessionReports = await ReportCardModel.find({
    student: studentId,
    session: sessionId,
    status: ReportStatus.APPROVED,
  })
    .select("percentage termName")
    .lean() as Array<{ percentage: number; termName: string }>;

  if (sessionReports.length === 0) {
    return {
      promoted: false,
      graduated: false,
      requiresDeptAssignment: false,
      nextClassName: null,
      performanceUnderReview: false,
    };
  }

  const average =
    sessionReports.reduce((sum, r) => sum + r.percentage, 0) /
    sessionReports.length;

  if (average < 50) {
    return {
      promoted: false,
      graduated: false,
      requiresDeptAssignment: false,
      nextClassName: null,
      performanceUnderReview: true,
    };
  }

  const nextClass = CLASS_PROGRESSION[currentClassName];

  if (nextClass === null) {
    await StudentModel.findByIdAndUpdate(studentId, {
      studentStatus: StudentStatus.GRADUATED,
    });
    return {
      promoted: true,
      graduated: true,
      requiresDeptAssignment: false,
      nextClassName: "Graduated",
      performanceUnderReview: false,
    };
  }

  if (nextClass === "SSS_1_DEPT_REQUIRED") {
    return {
      promoted: false,
      graduated: false,
      requiresDeptAssignment: true,
      nextClassName: null,
      performanceUnderReview: false,
    };
  }

  const nextClassDoc = await ClassModel.findOne({ name: nextClass });
  if (!nextClassDoc) {
    return {
      promoted: false,
      graduated: false,
      requiresDeptAssignment: false,
      nextClassName: null,
      performanceUnderReview: true,
    };
  }

  await StudentModel.findByIdAndUpdate(studentId, {
    currentClass: nextClassDoc._id,
  });

  return {
    promoted: true,
    graduated: false,
    requiresDeptAssignment: false,
    nextClassName: nextClass,
    performanceUnderReview: false,
  };
}

// ── Helper: resolve the correct totalStudentsInDept for a report ──────────────
async function resolveDeptCount(
  classId: string,
  department: string,
  totalInClass: number,
): Promise<number> {
  const distinctDepts = await UserModel.distinct("department", {
    $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
    currentClass: new mongoose.Types.ObjectId(classId),
    studentStatus: StudentStatus.ACTIVE,
  });

  const meaningfulDepts = (distinctDepts as (string | null | undefined)[]).filter(
    (d) => d && d !== "none",
  );

  const shouldSplitByDept =
    meaningfulDepts.length >= 1 &&
    (distinctDepts.length > 1 || meaningfulDepts.length >= 1);

  if (!shouldSplitByDept) {
    return totalInClass;
  }

  const deptQuery =
    department === "none"
      ? { $in: [null, "none", undefined] }
      : department;

  const count = await UserModel.countDocuments({
    $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
    currentClass: new mongoose.Types.ObjectId(classId),
    studentStatus: StudentStatus.ACTIVE,
    department: deptQuery,
  });

  return count;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const { action, declineReason, principalComment, revokeReason } =
      (await request.json()) as {
        action: "approve" | "decline" | "revoke";
        declineReason?: string;
        principalComment?: string;
        revokeReason?: string;
      };

    const report = await ReportCardModel.findById(id).populate(
      "submittedBy",
      "surname firstName otherName email",
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    const submittedBy = report.submittedBy as unknown as {
      _id: string;
      surname: string;
      firstName: string;
      otherName: string;
      email: string;
    };

    // ── APPROVE ───────────────────────────────────────────────────────────────
    if (action === "approve") {
      if (report.status !== ReportStatus.SUBMITTED) {
        return NextResponse.json(
          { success: false, error: "Only submitted reports can be approved" },
          { status: 400 },
        );
      }

      report.status = ReportStatus.APPROVED;
      report.approvedBy = session.user.id as unknown as typeof report.approvedBy;
      report.approvedAt = new Date();

      // ── Resolve dept count ──────────────────────────────────────────────
      const classId = report.class?.toString() ?? "";
      const department = report.studentSnapshot?.department ?? "none";

      const totalInClass = classId
        ? await UserModel.countDocuments({
            $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
            currentClass: new mongoose.Types.ObjectId(classId),
            studentStatus: StudentStatus.ACTIVE,
          })
        : report.totalStudentsInClass;

      const totalInDept = classId
        ? await resolveDeptCount(classId, department, totalInClass)
        : report.totalStudentsInDept ?? report.totalStudentsInClass;
      // ───────────────────────────────────────────────────────────────────

      // ── AI Comment ─────────────────────────────────────────────────────
      if (principalComment?.trim()) {
        report.principalComment = principalComment.trim();
      } else {
        try {
          const aiComment = await generateAIPrincipalComment({
            studentName: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName}`,
            className: report.className,
            termName: report.termName,
            percentage: report.percentage,
            position: report.position,
            totalStudentsInClass: totalInClass,
            totalStudentsInDept: totalInDept,
            grade: report.grade,
            subjects: report.subjects.map((s) => ({
              subjectName: s.subjectName,
              grade: s.grade,
              totalScore: s.totalScore,
              maxTotalScore: s.maxTotalScore,
            })),
          });
          report.principalComment = aiComment;
        } catch (aiError) {
          console.error("[AI Comment] Failed to generate comment:", aiError);
        }
      }
      // ───────────────────────────────────────────────────────────────────

      // ── Promotion logic — only on 3rd term ─────────────────────────────
      const isThirdTerm = report.termName === TermName.THIRD;

      if (isThirdTerm) {
        const student = await StudentModel.findById(report.student).populate(
          "currentClass",
          "name",
        );
        const currentClassName =
          (student?.currentClass as unknown as { name: string })?.name ??
          report.className;

        const result = await handlePromotion(
          report.student.toString(),
          report.session.toString(),
          currentClassName,
        );

        if (result.graduated) {
          report.isPromoted = true;
          report.promotedToClass = "Graduated";
        } else if (result.promoted && result.nextClassName) {
          report.isPromoted = true;
          report.promotedToClass = result.nextClassName;
        } else if (result.requiresDeptAssignment) {
          report.isPromoted = false;
          report.promotedToClass = "Pending Department Assignment";
        } else if (result.performanceUnderReview) {
          report.isPromoted = false;
          report.promotedToClass = "Performance Under Review";
        }
      }

      await report.save();

      // Notify teacher
      await createNotification({
        recipientId: submittedBy._id.toString(),
        recipientRole: UserRole.TEACHER,
        type: NotificationType.REPORT_APPROVED,
        title: "Report Card Approved",
        message: `Report for ${report.className} (${report.termName} term, ${report.sessionName}) approved.`,
        link: `/teacher/results`,
      });

      // Notify parents + student
const studentWithParents = await UserModel.findById(report.student).populate(
  "parents",
  "surname firstName otherName email",
);

if (studentWithParents) {
  const parents = (
    studentWithParents as {
      parents?: Array<{
        _id: { toString(): string };
        surname: string;
        firstName: string;
        otherName: string;
        email: string;
      }>;
    }
  ).parents ?? [];

  const studentUser = studentWithParents as unknown as {
    _id: { toString(): string };
    surname: string;
    firstName: string;
    otherName: string;
    email: string;
  };

  // Build a shared promotion suffix for messages
  let promotionSuffix = "";
  if (isThirdTerm && report.promotedToClass) {
    if (report.promotedToClass === "Performance Under Review") {
      promotionSuffix = " Performance is under review.";
    } else if (report.promotedToClass === "Graduated") {
      promotionSuffix = " 🎓 Your child has graduated!";
    } else if (report.promotedToClass === "Pending Department Assignment") {
      promotionSuffix = " Department assignment pending before promotion.";
    } else if (report.isPromoted) {
      promotionSuffix = ` Promoted to ${report.promotedToClass}.`;
    }
  }

  const studentFullName = `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName}`;
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/parent/reports`;
  const studentReportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/reports`;

  // ── Notify each parent (parallel) ──────────────────────────────────
const notifMessage = `${studentFullName}'s ${report.termName} term report is available.${promotionSuffix}`;

await Promise.all(
  parents.map((parent) =>
    Promise.all([
      createNotification({
        recipientId: parent._id.toString(),
        recipientRole: UserRole.PARENT,
        type: NotificationType.REPORT_AVAILABLE,
        title: "Report Card Available",
        message: notifMessage,
        link: reportUrl,
      }),
      sendReportAvailableEmail(
        parent.email,
        `${parent.surname} ${parent.firstName} ${parent.otherName}`,
        studentFullName,
        report.sessionName,
        report.termName,
        reportUrl,
      ),
    ]),
  ),
);

  // ── Notify the student ──────────────────────────────────────────────
  if (studentUser.email) {
    const studentNotifMessage = `Your ${report.termName} term report card for ${report.sessionName} is now available.${
      isThirdTerm && report.promotedToClass
        ? report.promotedToClass === "Graduated"
          ? " 🎓 Congratulations, you have graduated!"
          : report.promotedToClass === "Performance Under Review"
          ? " Your performance is under review."
          : report.promotedToClass === "Pending Department Assignment"
          ? " Your department assignment is pending before promotion."
          : report.isPromoted
          ? ` You have been promoted to ${report.promotedToClass}.`
          : ""
        : ""
    }`;

    await createNotification({
      recipientId: studentUser._id.toString(),
      recipientRole: UserRole.STUDENT,
      type: NotificationType.REPORT_AVAILABLE,
      title: "Your Report Card is Ready",
      message: studentNotifMessage,
      link: studentReportUrl,
    });

    await sendReportAvailableEmail(
      studentUser.email,
      `${studentUser.surname} ${studentUser.firstName} ${studentUser.otherName}`,
      studentFullName,
      report.sessionName,
      report.termName,
      studentReportUrl,
    );
  }
}

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.APPROVE,
        entity: "ReportCard",
        entityId: id,
        description: `Approved report: ${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName} - ${report.className} ${report.termName}${report.promotedToClass ? ` | ${report.promotedToClass}` : ""}`,
      });

      return NextResponse.json({
        success: true,
        data: report,
        message: "Report approved",
      });

    // ── REVOKE ────────────────────────────────────────────────────────────────
    } else if (action === "revoke") {
      if (
        report.status !== ReportStatus.APPROVED &&
        report.status !== ReportStatus.DECLINED
      ) {
        return NextResponse.json(
          { success: false, error: "Only approved or declined reports can be revoked" },
          { status: 400 },
        );
      }

      if (!revokeReason?.trim()) {
        return NextResponse.json(
          { success: false, error: "A reason for revoking is required" },
          { status: 400 },
        );
      }

      report.status = ReportStatus.DRAFT;
      report.declineReason = `[REVOKED BY ADMIN] ${revokeReason.trim()}`;
      report.approvedBy = undefined;
      // report.approvedAt = undefined;
      report.principalComment = undefined;
      report.isPromoted = undefined;
      report.promotedToClass = undefined;
      await report.save();

      // Notify the teacher who submitted it
      await createNotification({
        recipientId: submittedBy._id.toString(),
        recipientRole: UserRole.TEACHER,
        type: NotificationType.REPORT_DECLINED,
        title: "Report Card Revoked for Correction",
        message: `Report for ${report.className} (${report.termName} term) has been revoked by admin for correction. Reason: ${revokeReason}`,
        link: `/teacher/results`,
      });

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entity: "ReportCard",
        entityId: id,
        description: `Revoked approved report to DRAFT: ${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} — ${report.className} ${report.termName}. Reason: ${revokeReason}`,
      });

      return NextResponse.json({
        success: true,
        message: "Report revoked to draft. Teacher can now correct and re-submit.",
      });

    // ── DECLINE ───────────────────────────────────────────────────────────────
    } else if (action === "decline") {
      if (report.status !== ReportStatus.SUBMITTED) {
        return NextResponse.json(
          { success: false, error: "Only submitted reports can be declined" },
          { status: 400 },
        );
      }

      if (!declineReason?.trim()) {
        return NextResponse.json(
          { success: false, error: "Decline reason is required" },
          { status: 400 },
        );
      }

      report.status = ReportStatus.DECLINED;
      report.declineReason = declineReason;
      await report.save();

      await createNotification({
        recipientId: submittedBy._id.toString(),
        recipientRole: UserRole.TEACHER,
        type: NotificationType.REPORT_DECLINED,
        title: "Report Card Declined",
        message: `Report for ${report.className} was declined. Reason: ${declineReason}`,
        link: `/teacher/results`,
      });

      await sendReportDeclinedEmail(
        submittedBy.email,
        `${submittedBy.surname} ${submittedBy.firstName} ${submittedBy.otherName}`,
        report.className,
        report.termName,
        declineReason,
      );

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.DECLINE,
        entity: "ReportCard",
        entityId: id,
        description: `Declined report: ${report.className} ${report.termName}. Reason: ${declineReason}`,
      });

      return NextResponse.json({
        success: true,
        data: report,
        message: "Report declined",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const report = await ReportCardModel.findById(id)
      .populate("submittedBy", "surname firstName otherName")
      .populate("approvedBy", "surname firstName otherName")
      .populate("class", "name section")
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    // ── Recalculate totalStudentsInClass and totalStudentsInDept live ────
    const cls = report.class as { _id: { toString(): string } } | null;
    const cId = cls?._id?.toString();
    const snap = report.studentSnapshot as { department?: string } | undefined;
    const department = snap?.department ?? "none";

    let totalStudentsInClass = report.totalStudentsInClass;
    let totalStudentsInDept = (report as unknown as { totalStudentsInDept?: number }).totalStudentsInDept ?? 0;

    if (cId) {
      totalStudentsInClass = await UserModel.countDocuments({
        $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
        currentClass: new mongoose.Types.ObjectId(cId),
        studentStatus: StudentStatus.ACTIVE,
      });

      totalStudentsInDept = await resolveDeptCount(
        cId,
        department,
        totalStudentsInClass,
      );
    }
    // ────────────────────────────────────────────────────────────────────

    // ── Hydrate latest profile photo from student document ───────────────
    const freshStudent = await StudentModel.findById(
      (report as unknown as { student: string }).student,
    )
      .select("profilePhoto")
      .lean();

    const typedReport = report as Record<string, unknown>;
    const snapshot = typedReport.studentSnapshot as Record<string, unknown>;
    const freshPhoto = (freshStudent as unknown as { profilePhoto?: string })?.profilePhoto;

    if (freshPhoto) {
      typedReport.studentSnapshot = {
        ...snapshot,
        profilePhoto: freshPhoto,
      };
    }
    // ────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        studentSnapshot: typedReport.studentSnapshot,
        totalStudentsInClass,
        totalStudentsInDept,
        overallPosition: (report as unknown as { overallPosition?: number }).overallPosition ?? report.position,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}