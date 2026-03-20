// app/api/notifications/route.ts
// GET  — fetch paginated notifications (excludes cleared)
// PATCH — mark all read OR clear all OR clear/read single

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import NotificationModel from "@/models/Notification";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    // Always exclude cleared notifications from view
    const query = { recipient: session.user.id, isCleared: { $ne: true } };

    const [total, unreadCount, notifications] = await Promise.all([
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ ...query, isRead: false }),
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      markAll?:       boolean;
      clearAll?:      boolean;
      notificationId?: string;
      action?:        "read" | "clear";
    };

    const { markAll, clearAll, notificationId, action } = body;

    // Mark all as read
    if (markAll) {
      await NotificationModel.updateMany(
        { recipient: session.user.id, isRead: false, isCleared: { $ne: true } },
        { $set: { isRead: true } }
      );
    }

    // Clear all notifications (hide from view)
    if (clearAll) {
      await NotificationModel.updateMany(
        { recipient: session.user.id, isCleared: { $ne: true } },
        { $set: { isCleared: true, isRead: true } }
      );
    }

    // Single notification — mark read or clear
    if (notificationId) {
      const update: Record<string, unknown> = {};
      if (action === "clear") {
        update.isCleared = true;
        update.isRead    = true;
      } else {
        update.isRead = true;
      }
      await NotificationModel.findOneAndUpdate(
        { _id: notificationId, recipient: session.user.id },
        { $set: update }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}