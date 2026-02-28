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
  params: Promise<{ studentId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<object[]>>> {
  const { studentId } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Verify parent has access to this student
    const parent = await UserModel.findById(session.user.id).lean();
    if (!parent) return NextResponse.json({ success: false, error: "Parent not found" }, { status: 404 });

    // AFTER — same logic, just clearer typing
const parentDoc = parent as { children?: Array<{ toString(): string }> };
const hasAccess = parentDoc.children?.some(
  (childId) => childId.toString() === studentId
) ?? false;

if (!hasAccess) {
  return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
}

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

    // Don't expose full details if not paid
    const safeReports = reports.map((r) => {
      const report = r as typeof r & { paymentStatus: string; subjects?: unknown[] };
      if (report.paymentStatus !== PaymentStatus.PAID) {
        return {
          _id: report._id,
          student: report.student,
          className: (report as { className?: string }).className,
          sessionName: (report as { sessionName?: string }).sessionName,
          termName: (report as { termName?: string }).termName,
          paymentStatus: report.paymentStatus,
          status: (report as { status?: string }).status,
          session: (report as { session?: unknown }).session,
          term: (report as { term?: unknown }).term,
          isLocked: true,
        };
      }
      return { ...r, isLocked: false };
    });

    return NextResponse.json({ success: true, data: safeReports });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
