import { NextRequest, NextResponse } from "next/server";
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
  // Get ALL approved reports for this student in this session
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

  // Cumulative average across all approved terms in this session
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

  // Passed — determine next class
  const nextClass = CLASS_PROGRESSION[currentClassName];

  // SSS 2 → Graduate
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

  // JSS 3 → SSS 1: requires admin to assign department manually
  if (nextClass === "SSS_1_DEPT_REQUIRED") {
    return {
      promoted: false,
      graduated: false,
      requiresDeptAssignment: true,
      nextClassName: null,
      performanceUnderReview: false,
    };
  }

  // Auto-promote to next class
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
    const { action, declineReason, principalComment } =
      (await request.json()) as {
        action: "approve" | "decline";
        declineReason?: string;
        principalComment?: string;
      };

    const report = await ReportCardModel.findById(id).populate(
      "submittedBy",
      "firstName lastName email",
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      return NextResponse.json(
        { success: false, error: "Only submitted reports can be reviewed" },
        { status: 400 },
      );
    }

    const submittedBy = report.submittedBy as unknown as {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };

    if (action === "approve") {
      report.status = ReportStatus.APPROVED;
      report.approvedBy =
        session.user.id as unknown as typeof report.approvedBy;
      report.approvedAt = new Date();
      if (principalComment) report.principalComment = principalComment;

      // ── Promotion logic — only on 3rd term ──
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
          // JSS 3 passed but needs admin to assign SSS 1 + department
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

      // Notify parents
      const studentWithParents = await UserModel.findById(
        report.student,
      ).populate("parents", "firstName lastName email");

      if (studentWithParents) {
        const parents = (
          studentWithParents as {
            parents?: Array<{
              _id: { toString(): string };
              firstName: string;
              lastName: string;
              email: string;
            }>;
          }
        ).parents ?? [];

        for (const parent of parents) {
          let notifMessage = `${report.studentSnapshot.firstName}'s ${report.termName} term report is available.`;

          if (isThirdTerm && report.promotedToClass) {
            if (report.promotedToClass === "Performance Under Review") {
              notifMessage += " Performance is under review.";
            } else if (report.promotedToClass === "Graduated") {
              notifMessage += " 🎓 Your child has graduated!";
            } else if (
              report.promotedToClass === "Pending Department Assignment"
            ) {
              notifMessage +=
                " Department assignment pending before promotion.";
            } else if (report.isPromoted) {
              notifMessage += ` Promoted to ${report.promotedToClass}.`;
            }
          }

          await createNotification({
            recipientId: parent._id.toString(),
            recipientRole: UserRole.PARENT,
            type: NotificationType.REPORT_AVAILABLE,
            title: "Report Card Available",
            message: notifMessage,
            link: `/parent/reports`,
          });

          await sendReportAvailableEmail(
            parent.email,
            `${parent.firstName} ${parent.lastName}`,
            `${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName}`,
            report.sessionName,
            report.termName,
            `${process.env.NEXT_PUBLIC_APP_URL}/parent/reports`,
          );
        }
      }

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.firstName} ${session.user.lastName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.APPROVE,
        entity: "ReportCard",
        entityId: id,
        description: `Approved report: ${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName} - ${report.className} ${report.termName}${report.promotedToClass ? ` | ${report.promotedToClass}` : ""}`,
      });

      return NextResponse.json({
        success: true,
        data: report,
        message: "Report approved",
      });
    } else if (action === "decline") {
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
        `${submittedBy.firstName} ${submittedBy.lastName}`,
        report.className,
        report.termName,
        declineReason,
      );

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.firstName} ${session.user.lastName}`,
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
      .populate("submittedBy", "firstName lastName")
      .populate("approvedBy", "firstName lastName")
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}



