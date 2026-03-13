import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
// import AnnouncementModel from "@/models/Announcement";
import AnnouncementModel from "@/models/Announcements";
import UserModel from "@/models/User";
import { createBulkNotifications } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementStatus,
  AuditAction,
  NotificationType,
  UserRole,
} from "@/types/enums";
import type { ApiResponse, IAnnouncement } from "@/types";

// ─── GET /api/admin/announcements ─────────────────────────────────────────────

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<IAnnouncement[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const total = await AnnouncementModel.countDocuments(query);
    const announcements = await AnnouncementModel.find(query)
      .populate("createdBy", "surname firstName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: announcements as unknown as IAnnouncement[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/admin/announcements ────────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<IAnnouncement>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      title: string;
      body: string;
      audience: AnnouncementAudience;
      targetRoles?: UserRole[];
      targetClassIds?: string[];
      priority?: AnnouncementPriority;
      status?: AnnouncementStatus;
      expiresAt?: string;
    };

    const {
      title,
      body: announcementBody,
      audience,
      targetRoles,
      targetClassIds,
      priority,
      status,
      expiresAt,
    } = body;

    if (!title?.trim() || !announcementBody?.trim() || !audience) {
      return NextResponse.json(
        { success: false, error: "Title, body, and audience are required" },
        { status: 400 }
      );
    }

    if (
      audience === AnnouncementAudience.ROLE &&
      (!targetRoles || targetRoles.length === 0)
    ) {
      return NextResponse.json(
        { success: false, error: "At least one target role is required for role-based announcements" },
        { status: 400 }
      );
    }

    if (
      audience === AnnouncementAudience.CLASS &&
      (!targetClassIds || targetClassIds.length === 0)
    ) {
      return NextResponse.json(
        { success: false, error: "At least one target class is required for class-based announcements" },
        { status: 400 }
      );
    }

    const isPublishing = status === AnnouncementStatus.PUBLISHED;

    const announcement = await AnnouncementModel.create({
      title: title.trim(),
      body: announcementBody,
      audience,
      targetRoles: targetRoles ?? [],
      targetClassIds: targetClassIds ?? [],
      priority: priority ?? AnnouncementPriority.NORMAL,
      status: status ?? AnnouncementStatus.DRAFT,
      createdBy: session.user.id,
      publishedAt: isPublishing ? new Date() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    if (isPublishing) {
      await sendAnnouncementNotifications(announcement._id.toString(), {
        title,
        audience,
        targetRoles: targetRoles ?? [],
        targetClassIds: targetClassIds ?? [],
        priority: priority ?? AnnouncementPriority.NORMAL,
      });
    }

    // ✅ Correct signature — actorId not actor
    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName}`,
      actorRole: session.user.activeRole,
      action: AuditAction.CREATE,
      entity: "Announcement",
      entityId: announcement._id.toString(),
      description: `Created announcement: "${title}" (${status ?? "draft"})`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: announcement.toObject() as unknown as IAnnouncement,
        message: "Announcement created",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Helper: resolve matched users and send notifications ────────────────────

async function sendAnnouncementNotifications(
  announcementId: string,
  params: {
    title: string;
    audience: AnnouncementAudience;
    targetRoles: UserRole[];
    targetClassIds: string[];
    priority: AnnouncementPriority;
  }
) {
  const { title, audience, targetRoles, targetClassIds, priority } = params;

  let userQuery: Record<string, unknown> = { status: "active" };

  if (audience === AnnouncementAudience.ROLE) {
    userQuery = { ...userQuery, roles: { $in: targetRoles } };
  } else if (audience === AnnouncementAudience.CLASS) {
    const StudentModel = (await import("@/models/Student")).default;
    const students = await StudentModel.find(
      { currentClass: { $in: targetClassIds }, studentStatus: "active" },
      { _id: 1, parents: 1 }
    ).lean();
    const studentIds = students.map((s) => s._id);
    const parentIds = students.flatMap((s) => s.parents ?? []);
    userQuery = { _id: { $in: [...studentIds, ...parentIds] } };
  }

  const users = await UserModel.find(userQuery, { _id: 1, roles: 1 }).lean();
  if (users.length === 0) return;

  const notificationTitle =
    priority === AnnouncementPriority.URGENT ? `⚠️ URGENT: ${title}` : title;

  await createBulkNotifications(
    users.map((user) => ({
      recipientId: user._id.toString(),
      recipientRole: (user.roles as UserRole[])[0] ?? UserRole.STUDENT,
      type: NotificationType.ANNOUNCEMENT,
      title: notificationTitle,
      message: `New school announcement: ${title}`,
      metadata: { announcementId, priority },
      link: `/announcements/${announcementId}`,
    }))
  );
}