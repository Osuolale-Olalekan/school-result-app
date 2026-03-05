import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import PaymentRecordModel from "@/models/PaymentRecord";
import { PaymentStatus, ReportStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const studentId = session.user.id;

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

    // Check payment status for each report — same logic as parent route
    const safeReports = await Promise.all(
      reports.map(async (r) => {
        const report = r as typeof r & {
          paymentStatus?: string;
          subjects?: unknown[];
          session: { _id: unknown };
          term: { _id: unknown };
        };

        const sessionObjId = (report.session as { _id: unknown })?._id;
        const termObjId = (report.term as { _id: unknown })?._id;

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
        const isLocked = !reportCardPaid || !schoolFeesPaid;

        if (isLocked) {
          return {
            _id: report._id,
            student: report.student,
            session: report.session,
            term: report.term,
            status: report.status,
            paymentStatus: report.paymentStatus,
            isLocked: true,
            reportCardPaid,
            schoolFeesPaid,
          };
        }

        return {
          ...r,
          isLocked: false,
          reportCardPaid: true,
          schoolFeesPaid: true,
        };
      })
    );

    return NextResponse.json({ success: true, data: safeReports });
  } catch (error) {
    console.error("Student reports error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}