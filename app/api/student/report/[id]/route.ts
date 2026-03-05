import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import PaymentRecordModel from "@/models/PaymentRecord";
import SchoolSettingsModel from "@/models/SchoolSettings";
import { PaymentStatus, ReportStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const report = await ReportCardModel.findById(id)
      .populate("session", "name")
      .populate("term", "name status")
      .populate("class", "name section")
      .lean();

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const typedReport = report as typeof report & {
      student: { toString(): string };
      status: ReportStatus;
      session: { _id: unknown };
      term: { _id: unknown };
    };

    // Must be approved
    if (typedReport.status !== ReportStatus.APPROVED) {
      return NextResponse.json({ success: false, error: "Report not available" }, { status: 403 });
    }

    // Must belong to the logged-in student
    if (typedReport.student.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const sessionObjId = (typedReport.session as { _id: unknown })?._id;
    const termObjId = (typedReport.term as { _id: unknown })?._id;

    // Check both payments
    const [reportCardPayment, schoolFeesPayment] = await Promise.all([
      PaymentRecordModel.findOne({
        student: session.user.id,
        session: sessionObjId,
        term: termObjId,
        type: "report_card",
        status: PaymentStatus.PAID,
      }).lean(),
      PaymentRecordModel.findOne({
        student: session.user.id,
        session: sessionObjId,
        term: termObjId,
        type: "school_fees",
        status: PaymentStatus.PAID,
      }).lean(),
    ]);

    if (!reportCardPayment || !schoolFeesPayment) {
      return NextResponse.json(
        { success: false, error: "Payment required to view this report card" },
        { status: 402 }
      );
    }

    // Fetch principal signature
    const schoolSettings = await SchoolSettingsModel.findOne().lean() as { principalSignature?: string } | null;

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        principalSignature: schoolSettings?.principalSignature ?? null,
      },
    });
  } catch (error) {
    console.error("Student report detail error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}