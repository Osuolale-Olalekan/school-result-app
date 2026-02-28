import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import TeacherModel from "@/models/Teacher";
import ParentModel from "@/models/Parent";
import {
  AuditAction,
  UserRole,
  UserStatus,
  StudentStatus,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  try {
    await connectDB();
    const user = await UserModel.findById(id)
      .select("-password")
      .populate("currentClass", "name section department")
      .populate("parents", "firstName lastName email phone")
      .populate("children", "firstName lastName admissionNumber currentClass")
      .lean();

    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  try {
    await connectDB();

    const body = (await request.json()) as Record<string, unknown>;
    const { action, ...updateData } = body;

    const user = await UserModel.findById(id).select("-password");
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    let auditAction = AuditAction.UPDATE;
    let description = `Updated user ${user.firstName} ${user.lastName}`;

    if (action === "activate") {
      user.status = UserStatus.ACTIVE;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.ACTIVE,
        });
      }
      auditAction = AuditAction.ACTIVATE;
      description = `Activated account for ${user.firstName} ${user.lastName}`;
      await user.save();
    } else if (action === "deactivate") {
      user.status = UserStatus.INACTIVE;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.INACTIVE,
        });
      }
      auditAction = AuditAction.DEACTIVATE;
      description = `Deactivated account for ${user.firstName} ${user.lastName}`;
      await user.save();
    } else if (action === "suspend") {
      user.status = UserStatus.SUSPENDED;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.SUSPENDED,
        });
      }
      auditAction = AuditAction.SUSPEND;
      description = `Suspended account for ${user.firstName} ${user.lastName}`;
      await user.save();
    } else {
      // ── 1. Basic allowed fields ──────────────────────────────────
      const allowedFields = [
        "firstName",
        "lastName",
        "phone",
        "profilePhoto",
        "address",
        "guardianName",
        "guardianPhone",
        "department",
        "qualification",
        "specialization",
        "occupation",
        "stateOfOrigin",
        "localGovernment",
        "religion",
        "bloodGroup",
        "dateOfBirth",
        "gender",
        "currentClass",
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          (user as unknown as Record<string, unknown>)[field] =
            updateData[field];
        }
      }

      // ── 2. Admission number (students only, uniqueness check) ────
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
        (user as unknown as Record<string, unknown>).admissionNumber = (
          updateData.admissionNumber as string
        ).toUpperCase();
      }

      // ── 3. Roles + children (uses findByIdAndUpdate to bypass Mongoose tracking) ──
      // ── 3. Roles + children
      if (updateData.roles && Array.isArray(updateData.roles)) {
        const newRoles = updateData.roles as UserRole[];
        const newChildren = Array.isArray(updateData.children)
          ? (updateData.children as string[])
          : [];
        const oldChildren =
          ((user as unknown as Record<string, unknown>).children as string[]) ??
          [];

        if (newRoles.includes(UserRole.PARENT)) {
          const removedChildren = oldChildren.filter(
            (c) => !newChildren.includes(c.toString()),
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

          // const updateResult = await TeacherModel.findByIdAndUpdate(
          await UserModel.findByIdAndUpdate(
            id,
            { $set: { roles: newRoles, children: newChildren } },
            { new: true },
          );
        }
      }

      // ── 4. Children update for pure parents (no role change) ────
      if (
        !updateData.roles &&
        user.roles.includes(UserRole.PARENT) &&
        Array.isArray(updateData.children)
      ) {
        const oldChildren =
          ((user as unknown as Record<string, unknown>).children as string[]) ??
          [];
        const newChildren = updateData.children as string[];

        const removedChildren = oldChildren.filter(
          (c) => !newChildren.includes(c.toString()),
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
        await UserModel.findByIdAndUpdate(id, {
          $set: { children: newChildren },
        });
      }

      // Save basic field changes
      await user.save();
    }

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.lastName}`,
      actorRole: UserRole.ADMIN,
      action: auditAction,
      entity:
        user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1),
      entityId: id,
      description,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    // Return fresh data from DB
    const updated = await UserModel.findById(id)
      .select("-password")
      .populate("children", "firstName lastName admissionNumber")
      .lean();

    return NextResponse.json({
      success: true,
      data: updated ?? {},
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  try {
    await connectDB();
    const user = await UserModel.findById(id);
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    // Prevent deleting your own account
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    // Prevent deleting the last admin
    if (user.roles.includes(UserRole.ADMIN)) {
      const adminCount = await UserModel.countDocuments({
        roles: UserRole.ADMIN,
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin account" },
          { status: 400 },
        );
      }
    }

    const userName = `${user.firstName} ${user.lastName}`;
    const userRole = user.activeRole;

    // await user.deleteOne();
    await UserModel.findByIdAndDelete(id);

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.lastName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.DELETE,
      entity: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      entityId: id,
      description: `Deleted ${userRole} account: ${userName}`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
