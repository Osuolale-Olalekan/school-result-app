import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import SchoolSettingsModel from "@/models/SchoolSettings";
import { UserRole } from "@/types/enums";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const settings = await SchoolSettingsModel.findOne().lean();
    return NextResponse.json({ success: true, data: settings ?? {} });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json() as { principalSignature?: string };

    const settings = await SchoolSettingsModel.findOneAndUpdate(
      {},
      { $set: body },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { type, months } = await request.json() as { type: "audit" | "notifications" | "both"; months: number };

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    let auditDeleted = 0;
    let notifDeleted = 0;

    if (type === "audit" || type === "both") {
      const AuditLogModel = (await import("@/models/AuditLog")).default;
      const result = await AuditLogModel.deleteMany({ createdAt: { $lt: cutoffDate } });
      auditDeleted = result.deletedCount;
    }

    if (type === "notifications" || type === "both") {
      const NotificationModel = (await import("@/models/Notification")).default;
      const result = await NotificationModel.deleteMany({ createdAt: { $lt: cutoffDate } });
      notifDeleted = result.deletedCount;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${auditDeleted} audit logs and ${notifDeleted} notifications`,
      data: { auditDeleted, notifDeleted },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}