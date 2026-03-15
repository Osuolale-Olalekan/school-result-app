// app/api/notifications/[id]/route.ts
// PATCH — mark a single notification as read

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import NotificationModel from "@/models/Notification";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, recipient: session.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notification });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}