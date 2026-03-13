import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
// import AnnouncementModel from "@/models/Announcement";
import AnnouncementModel from "@/models/Announcements";
import { AnnouncementAudience, AnnouncementStatus, UserRole } from "@/types/enums";
import type { ApiResponse, IAnnouncement } from "@/types";
import UserModel from "@/models/User";

// ─── GET /api/announcements ───────────────────────────────────────────────────
// Any authenticated user fetches announcements relevant to them.
// Filters: published, not expired, matches their role or class.

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<IAnnouncement[]>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const now = new Date();
    const activeRole = session.user.activeRole as UserRole;

    // Resolve the current user's classId (students & parents need class-targeted announcements)
    let classId: string | null = null;

    if (activeRole === UserRole.STUDENT) {
      const StudentModel = (await import("@/models/Student")).default;
      const student = await StudentModel.findById(session.user.id, { currentClass: 1 }).lean();
      classId = student?.currentClass?.toString() ?? null;
    } else if (activeRole === UserRole.PARENT) {
      // For parents: use the first child's class (covers the most common case)
      const UserModel = (await import("@/models/User")).default;
      const StudentModel = (await import("@/models/Student")).default;
      const parent = await UserModel.findById(session.user.id, { children: 1 }).lean();
      if (parent?.children?.length) {
        const child = await StudentModel.findById(parent.children[0], { currentClass: 1 }).lean();
        classId = child?.currentClass?.toString() ?? null;
      }
    }

    // Build the query: published, not expired, AND matches audience
    const audienceConditions = [
      // Always show "all" announcements
      { audience: AnnouncementAudience.ALL },
      // Show role-targeted ones where their role is included
      { audience: AnnouncementAudience.ROLE, targetRoles: activeRole },
    ];

    // Show class-targeted ones if we resolved a classId
    if (classId) {
      audienceConditions.push({
        audience: AnnouncementAudience.CLASS,
        targetClassIds: classId,
      } as typeof audienceConditions[0]);
    }

    const query = {
      status: AnnouncementStatus.PUBLISHED,
      $or: [
        { expiresAt: { $gt: now } },  // not yet expired
        { expiresAt: null },           // or no expiry set
        { expiresAt: { $exists: false } },
      ],
      $and: [{ $or: audienceConditions }],
    };

    const total = await AnnouncementModel.countDocuments(query);
    const announcements = await AnnouncementModel.find(query)
      .populate("createdBy", "surname firstName")
      .sort({ priority: -1, publishedAt: -1 }) // urgent first, then newest
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