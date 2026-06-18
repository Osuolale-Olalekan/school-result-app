import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import mongoose from "mongoose";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import ReportCardModel from "@/models/ReportCard";
import PaymentRecordModel from "@/models/PaymentRecord";
import BehaviourRecordModel from "@/models/BehaviourRecord";
import NotificationModel from "@/models/Notification";
import {
  AuditAction,
  UserRole,
  UserStatus,
  StudentStatus,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";
import ClassAssignmentModel from "@/models/ClassAssignment";
import { sanitizePhone } from "@/lib/utils";

async function requireAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const user = await UserModel.findById(id)
      .select("-password")
      .populate("currentClass", "name section department")
      .populate("parents", "surname firstName otherName email phone")
      .populate({
        path: "children",
        select:
          "surname firstName otherName admissionNumber profilePhoto gender studentStatus currentClass",
        populate: { path: "currentClass", select: "name section" },
      })
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    let classAssignments: Array<{
      className: string;
      section?: string;
      session: string;
    }> = [];
    const typedUser = user as { roles?: string[] };
    if (typedUser.roles?.includes("teacher")) {
      const assignments = await ClassAssignmentModel.find({
        teacher: id,
        isActive: true,
      })
        .populate("class", "name section")
        .populate("session", "name")
        .lean();

      classAssignments = assignments.map((a) => ({
        className:
          (a.class as unknown as { name: string; section?: string })?.name ??
          "Unknown",
        section: (a.class as unknown as { name: string; section?: string })
          ?.section,
        session: (a.session as unknown as { name: string })?.name ?? "Unknown",
      }));
    }

    return NextResponse.json({
      success: true,
      data: { ...user, classAssignments },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/admin/users/[id] ──────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const body = (await request.json()) as Record<string, unknown>;
    const { action, ...updateData } = body;

    const user = await UserModel.findById(id).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const collection = mongoose.connection.collection("users");

    let auditAction = AuditAction.UPDATE;
    let description = `Updated user ${user.surname} ${user.firstName} ${user.otherName}`;

    if (action === "activate") {
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { status: UserStatus.ACTIVE } },
      );
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.ACTIVE,
        });
      }
      auditAction = AuditAction.ACTIVATE;
      description = `Activated account for ${user.surname} ${user.firstName} ${user.otherName}`;
    } else if (action === "deactivate") {
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { status: UserStatus.INACTIVE } },
      );
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.INACTIVE,
        });
      }
      auditAction = AuditAction.DEACTIVATE;
      description = `Deactivated account for ${user.surname} ${user.firstName} ${user.otherName}`;
    } else if (action === "suspend") {
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { status: UserStatus.SUSPENDED } },
      );
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.SUSPENDED,
        });
      }
      auditAction = AuditAction.SUSPEND;
      description = `Suspended account for ${user.surname} ${user.firstName} ${user.otherName}`;
    } else {
      const $set: Record<string, unknown> = {};

      const allowedFields = [
        "surname", "firstName", "otherName", "profilePhoto", "address",
        "guardianName", "guardianPhone", "department", "qualification",
        "specialization", "occupation", "stateOfOrigin", "localGovernment",
        "religion", "bloodGroup", "dateOfBirth", "gender", "currentClass",
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === "currentClass" && updateData[field]) {
            $set[field] = new mongoose.Types.ObjectId(updateData[field] as string);
          } else {
            $set[field] = updateData[field];
          }
        }
      }

      if (updateData.phone !== undefined) {
        $set.phone = updateData.phone ? sanitizePhone(updateData.phone) : undefined;
      }

      if (updateData.admissionNumber) {
        const existing = await StudentModel.findOne({
          admissionNumber: (updateData.admissionNumber as string).toUpperCase(),
          _id: { $ne: id },
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: "Admission number already taken" },
            { status: 409 },
          );
        }
        $set.admissionNumber = (updateData.admissionNumber as string).toUpperCase();
      }

      if (updateData.roles && Array.isArray(updateData.roles)) {
        const newRoles = updateData.roles as UserRole[];
        const newChildren = Array.isArray(updateData.children)
          ? (updateData.children as string[])
          : [];

        const rawDoc = await collection.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        const oldChildren: string[] = (rawDoc?.children ?? []).map(
          (c: unknown) => c?.toString() ?? "",
        );

        if (newRoles.includes(UserRole.PARENT)) {
          const removedChildren = oldChildren.filter(
            (c) => !newChildren.includes(c),
          );
          if (removedChildren.length > 0) {
            await StudentModel.updateMany(
              { _id: { $in: removedChildren } },
              { $pull: { parents: id } },
            );
          }
          if (newChildren.length > 0) {
            await StudentModel.updateMany(
              { _id: { $in: newChildren } },
              { $addToSet: { parents: id } },
            );
          }
          $set.roles = newRoles;
          $set.children = newChildren.map((c) => new mongoose.Types.ObjectId(c));
        } else {
          if (oldChildren.length > 0) {
            await StudentModel.updateMany(
              { _id: { $in: oldChildren } },
              { $pull: { parents: id } },
            );
          }
          $set.roles = newRoles;
          $set.children = [];
        }
      }

      if (
        !updateData.roles &&
        Array.isArray(updateData.children) &&
        (user.activeRole === UserRole.PARENT ||
          user.roles?.includes(UserRole.PARENT))
      ) {
        const newChildren = updateData.children as string[];
        const rawDoc = await collection.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        const oldChildren: string[] = (rawDoc?.children ?? []).map(
          (c: unknown) => c?.toString() ?? "",
        );
        const removedChildren = oldChildren.filter(
          (c) => !newChildren.includes(c),
        );

        if (removedChildren.length > 0) {
          await StudentModel.updateMany(
            { _id: { $in: removedChildren } },
            { $pull: { parents: id } },
          );
        }
        if (newChildren.length > 0) {
          await StudentModel.updateMany(
            { _id: { $in: newChildren } },
            { $addToSet: { parents: id } },
          );
        }
        $set.children = newChildren.map((c) => new mongoose.Types.ObjectId(c));
      }

      if (Object.keys($set).length > 0) {
        await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set },
        );
      }
    }

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.surname}`,
      actorRole: UserRole.ADMIN,
      action: auditAction,
      entity: user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1),
      entityId: id,
      description,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    const updated = await UserModel.findById(id)
      .select("-password")
      .populate("children", "surname firstName otherName admissionNumber")
      .lean();

    return NextResponse.json({
      success: true,
      data: updated ?? {},
      message: "User updated successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/users/[id] ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const user = await UserModel.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    if (user.roles.includes(UserRole.ADMIN)) {
      const adminCount = await UserModel.countDocuments({ roles: UserRole.ADMIN });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin account" },
          { status: 400 },
        );
      }
    }

    const userName = `${user.surname} ${user.firstName} ${user.otherName}`;
    const userRole = user.activeRole;
    const studentId = new mongoose.Types.ObjectId(id);

    // ── Cascade deletion based on role ────────────────────────────────────────

    if (userRole === UserRole.STUDENT) {
      // Delete all report cards belonging to this student
      await ReportCardModel.deleteMany({ student: studentId });

      // Delete all payment records belonging to this student
      await PaymentRecordModel.deleteMany({ student: studentId });

      // Delete all behaviour records for this student
      await BehaviourRecordModel.deleteMany({ student: studentId });

      // Delete all notifications sent to this student
      await NotificationModel.deleteMany({ recipient: studentId });

      // Remove this student from all parents' children arrays
      await UserModel.updateMany(
        { children: studentId },
        { $pull: { children: studentId } },
      );
    }

    if (userRole === UserRole.PARENT) {
      // Remove this parent from all students' parents arrays
      await StudentModel.updateMany(
        { parents: studentId },
        { $pull: { parents: studentId } },
      );

      // Delete notifications for this parent
      await NotificationModel.deleteMany({ recipient: studentId });
    }

    if (userRole === UserRole.TEACHER) {
      // Delete notifications for this teacher
      await NotificationModel.deleteMany({ recipient: studentId });
      // Note: we intentionally keep class assignments and submitted reports
      // so historical data is preserved — they just lose their submittedBy reference
    }

    // ── Delete the user document itself ──────────────────────────────────────
    await UserModel.findByIdAndDelete(id);

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.surname}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.DELETE,
      entity: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      entityId: id,
      description: `Deleted ${userRole} account: ${userName} — cascade deleted all related records`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: `${userName} and all related records deleted successfully`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}



