import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import UserModel from "@/models/User";
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
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const report = await ReportCardModel.findById(id)
      .populate("session", "name")
      .populate("term", "name status")
      .populate("class", "name section")
      .lean();

    if (!report) return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });

    const typedReport = report as typeof report & {
      student: { toString(): string };
      status: ReportStatus;
      paymentStatus: PaymentStatus;
    };

    if (typedReport.status !== ReportStatus.APPROVED) {
      return NextResponse.json({ success: false, error: "Report not available" }, { status: 403 });
    }

    // Verify this parent has access to this student
    const parent = await UserModel.findById(session.user.id).lean();
    if (!parent) return NextResponse.json({ success: false, error: "Parent not found" }, { status: 404 });

    const parentDoc = parent as { children?: Array<{ toString(): string }> };
    const hasAccess = parentDoc.children?.some(
      (childId) => childId.toString() === typedReport.student.toString()
    );

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Verify payment
    if (typedReport.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json(
        { success: false, error: "Payment required to view this report card" },
        { status: 402 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
