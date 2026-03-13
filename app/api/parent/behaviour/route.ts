// ─── app/api/parent/behaviour/route.ts ───────────────────────────────────────
// Parent views behaviour records for ALL their children

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BehaviourRecordModel from "@/models/BehaviourRecord";
import UserModel from "@/models/User";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page") ?? "1");
    const limit    = parseInt(searchParams.get("limit") ?? "20");
    const type     = searchParams.get("type");
    const childId  = searchParams.get("childId"); // optional: filter to one child

    // Get parent's children
    const parent = await UserModel.findById(session.user.id, { children: 1 }).lean();
    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const childIds = childId
      ? [childId] // filtered to one child
      : parent.children.map((c: unknown) => c!.toString());

    const query: Record<string, unknown> = { studentId: { $in: childIds } };
    if (type) query.type = type;

    const total   = await BehaviourRecordModel.countDocuments(query);
    const records = await BehaviourRecordModel.find(query)
      .populate("studentId", "firstName surname admissionNumber")
      .populate("loggedBy",  "firstName surname")
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