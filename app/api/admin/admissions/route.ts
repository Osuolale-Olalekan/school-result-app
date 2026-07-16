import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AdmissionInquiryModel, { AdmissionInquiryStatus } from "@/models/AdmissionInquiry";
import { UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

// ─── GET /api/admin/admissions ────────────────────────────────────────────────
// Admin-only. Lists admission inquiries, newest first, optionally filtered by status.
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status && Object.values(AdmissionInquiryStatus).includes(status as AdmissionInquiryStatus)) {
      query.status = status;
    }

    const total = await AdmissionInquiryModel.countDocuments(query);
    const inquiries = await AdmissionInquiryModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/admissions ──────────────────────────────────────────────
// Admin-only. Body: { id: string, status: AdmissionInquiryStatus }
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = (await request.json()) as { id?: string; status?: string };
    if (!id || !status || !Object.values(AdmissionInquiryStatus).includes(status as AdmissionInquiryStatus)) {
      return NextResponse.json({ success: false, error: "id and a valid status are required" }, { status: 400 });
    }

    await connectDB();
    const updated = await AdmissionInquiryModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
