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

// ─── GET /api/admin/announcements/[id] ───────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<IAnnouncement>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const announcement = await AnnouncementModel.findById(params.id)
      .populate("createdBy", "surname firstName")
      .lean();

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcement as unknown as IAnnouncement,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/admin/announcements/[id] ─────────────────────────────────────
// Handles: edit draft fields, publish a draft, archive a published announcement

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<IAnnouncement>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const existing = await AnnouncementModel.findById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    const body = await request.json() as Partial<{
      title: string;
      body: string;
      audience: AnnouncementAudience;
      targetRoles: UserRole[];
      targetClassIds: string[];
      priority: AnnouncementPriority;
      status: AnnouncementStatus;
      expiresAt: string;
    }>;

    const wasPublished = existing.status === AnnouncementStatus.PUBLISHED;
    const isBeingPublished =
      body.status === AnnouncementStatus.PUBLISHED &&
      existing.status === AnnouncementStatus.DRAFT;

    // Guard: can't edit content of a published announcement, only archive it
    if (wasPublished && body.status !== AnnouncementStatus.ARCHIVED) {
      return NextResponse.json(
        {
          success: false,
          error: "Published announcements cannot be edited. Archive it first.",
        },
        { status: 400 }
      );
    }

    // Apply field updates
    if (body.title !== undefined) existing.title = body.title.trim();
    if (body.body !== undefined) existing.body = body.body;
    if (body.audience !== undefined) existing.audience = body.audience;
    if (body.targetRoles !== undefined) existing.targetRoles = body.targetRoles;
    if (body.targetClassIds !== undefined)
      existing.targetClassIds =
        body.targetClassIds as unknown as import("mongoose").Types.ObjectId[];
    if (body.priority !== undefined) existing.priority = body.priority;
    if (body.expiresAt !== undefined) existing.expiresAt = new Date(body.expiresAt);
    if (body.status !== undefined) {
      existing.status = body.status;
      if (isBeingPublished) existing.publishedAt = new Date();
    }

    await existing.save();

    // Fire notifications only when transitioning draft → published
    if (isBeingPublished) {
      await sendAnnouncementNotifications(existing._id.toString(), {
        title: existing.title,
        audience: existing.audience,
        targetRoles: existing.targetRoles,
        targetClassIds: existing.targetClassIds.map((id) => id.toString()),
        priority: existing.priority,
      });
    }

    // ✅ Correct signature — actorId not actor
    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName}`,
      actorRole: session.user.activeRole,
      action: AuditAction.UPDATE,
      entity: "Announcement",
      entityId: existing._id.toString(),
      description: `Updated announcement: "${existing.title}" → status: ${existing.status}`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: existing.toObject() as unknown as IAnnouncement,
      message: isBeingPublished
        ? "Announcement published and notifications sent"
        : "Announcement updated",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/admin/announcements/[id] ────────────────────────────────────
// Only drafts and archived announcements can be permanently deleted

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const announcement = await AnnouncementModel.findById(params.id);
    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete a published announcement. Archive it first.",
        },
        { status: 400 }
      );
    }

    await AnnouncementModel.findByIdAndDelete(params.id);

    // ✅ Correct signature — actorId not actor
    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName}`,
      actorRole: session.user.activeRole,
      action: AuditAction.DELETE,
      entity: "Announcement",
      entityId: params.id,
      description: `Deleted announcement: "${announcement.title}"`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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