import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
// import { AuthAction } from "next-auth";
import { connectDB } from "@/lib/db";
import AuditLogModel from "@/models/AuditLog";
import { UserRole } from "@/types/enums";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const actorId = searchParams.get("actorId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorId) query.actor = actorId;

    const total = await AuditLogModel.countDocuments(query);
    const logs = await AuditLogModel.find(query)
      .populate("actor", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
