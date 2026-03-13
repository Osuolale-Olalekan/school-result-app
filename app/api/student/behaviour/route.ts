// ─── app/api/student/behaviour/route.ts ──────────────────────────────────────
// Student views their own behaviour records (all types)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BehaviourRecordModel from "@/models/BehaviourRecord";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const type  = searchParams.get("type");

    const query: Record<string, unknown> = { studentId: session.user.id };
    if (type) query.type = type;

    const total   = await BehaviourRecordModel.countDocuments(query);
    const records = await BehaviourRecordModel.find(query)
      .populate("loggedBy", "firstName surname")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}