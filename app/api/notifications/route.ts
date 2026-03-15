import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const query: Record<string, unknown> = { recipient: session.user.id };
    if (unreadOnly) query.isRead = false;

    const [total, unreadCount, notifications] = await Promise.all([
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ recipient: session.user.id, isRead: false }),
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
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { markAll, notificationId } = await request.json() as {
      markAll?: boolean;
      notificationId?: string;
    };

    if (markAll) {
      await NotificationModel.updateMany(
        { recipient: session.user.id, isRead: false },
        { isRead: true }
      );
    } else if (notificationId) {
      await NotificationModel.findOneAndUpdate(
        { _id: notificationId, recipient: session.user.id },
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
