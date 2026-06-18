import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import { ReportStatus } from "@/types/enums";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();

    const report = await ReportCardModel.findById(id)
      .populate("session", "name")
      .populate("term", "name")
      .populate("class", "name section")
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    const typedReport = report as typeof report & { status: ReportStatus };

    // Only expose approved reports
    if (typedReport.status !== ReportStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: "Report not available" },
        { status: 403 },
      );
    }

    const snapshot = report.studentSnapshot as Record<string, unknown>;
    const session = report.session as { name?: string } | null;
    const term = report.term as { name?: string } | null;
    const cls = report.class as { name?: string; section?: string } | null;

    // Return only what's needed for public verification
    return NextResponse.json({
      success: true,
      data: {
        studentName: `${snapshot.surname} ${snapshot.firstName} ${snapshot.otherName}`,
        admissionNumber: snapshot.admissionNumber,
        className: cls?.section ? `${cls.name} ${cls.section}` : cls?.name,
        sessionName: session?.name,
        termName: term?.name,
        grade: report.grade,
        percentage: report.percentage,
        totalObtained: report.totalObtained,
        totalObtainable: report.totalObtainable,
        status: report.status,
      },
    });

  } catch (error) {
    console.error("[verify-report] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}