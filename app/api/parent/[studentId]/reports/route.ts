import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import PaymentRecordModel from "@/models/PaymentRecord";
import UserModel from "@/models/User";
import { PaymentStatus, ReportStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object[]>>> {
  const { studentId } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const parent = await UserModel.findById(session.user.id).lean();
    if (!parent)
      return NextResponse.json(
        { success: false, error: "Parent not found" },
        { status: 404 },
      );

    const parentDoc = parent as { children?: Array<{ toString(): string }> };
    const hasAccess =
      parentDoc.children?.some((c) => c.toString() === studentId) ?? false;
    if (!hasAccess)
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId = searchParams.get("termId");

    const query: Record<string, unknown> = {
      student: studentId,
      status: ReportStatus.APPROVED,
    };
    if (sessionId) query.session = sessionId;
    if (termId) query.term = termId;

    const reports = await ReportCardModel.find(query)
      .populate("session", "name startYear endYear")
      .populate("term", "name status")
      .populate("class", "name section")
      .sort({ createdAt: -1 })
      .lean();

    // For each report, check BOTH payment records from PaymentRecordModel
    const safeReports = await Promise.all(
      reports.map(async (r) => {
        const report = r as typeof r & {
          paymentStatus?: string;
          subjects?: unknown[];
          session: { _id: unknown };
          term: { _id: unknown };
          class: { _id: unknown; name?: string };
        };

        const sessionObjId = (report.session as { _id: unknown })?._id;
        const termObjId = (report.term as { _id: unknown })?._id;

        // Check both payments in parallel
        const [reportCardPayment, schoolFeesPayment] = await Promise.all([
          PaymentRecordModel.findOne({
            student: studentId,
            session: sessionObjId,
            term: termObjId,
            type: "report_card",
            status: PaymentStatus.PAID,
          }).lean(),
          PaymentRecordModel.findOne({
            student: studentId,
            session: sessionObjId,
            term: termObjId,
            type: "school_fees",
            status: PaymentStatus.PAID,
          }).lean(),
        ]);

        const reportCardPaid = !!reportCardPayment;
        const schoolFeesPaid = !!schoolFeesPayment;
        const isLocked = !reportCardPaid || !schoolFeesPaid; // both must be paid

        if (isLocked) {
          // Return limited data — don't expose scores/subjects
          return {
            _id: report._id,
            student: report.student,
            session: report.session,
            term: report.term,
            termName: (report.term as { name?: string })?.name, // ✅ add this
            sessionName: (report.session as { name?: string })?.name, // ✅ add this
            className: (report.class as { name?: string })?.name, // ✅ add this
            status: report.status,
            paymentStatus: report.paymentStatus,
            isLocked: true,
            reportCardPaid,
            schoolFeesPaid,
          };
        }

        // Fully unlocked — return everything
        return {
          ...r,
          termName: (report.term as { name?: string })?.name, // ✅ add this
          sessionName: (report.session as { name?: string })?.name, // ✅ add this
          className: (report.class as { name?: string })?.name, // ✅ add this
          isLocked: false,
          reportCardPaid: true,
          schoolFeesPaid: true,
        };
      }),
    );

    return NextResponse.json({ success: true, data: safeReports });
  } catch (error) {
    console.error("Parent reports error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
