import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ReportCardModel from "@/models/ReportCard";
import { ReportStatus, UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");
    const termId = searchParams.get("termId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (sessionId) query.session = sessionId;
    if (termId) query.term = termId;

    const total = await ReportCardModel.countDocuments(query);
    const reports = await ReportCardModel.find(query)
      .populate("submittedBy", "surname firstName otherName email")
      .populate("class", "name section")
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
   
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

