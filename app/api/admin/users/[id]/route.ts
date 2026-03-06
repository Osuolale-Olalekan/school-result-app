import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import mongoose from "mongoose";
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
      .populate("parents", "surname firstName otherName email phone")
      .populate({
        path: "children",
        select: "surname firstName otherName admissionNumber profilePhoto gender studentStatus currentClass",
        populate: { path: "currentClass", select: "name section" },
      })
      .lean();

    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    // Fetch class assignments if teacher
    let classAssignments: Array<{ className: string; section?: string; session: string }> = [];
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
        className: (a.class as unknown as { name: string; section?: string })?.name ?? "Unknown",
        section: (a.class as unknown as { name: string; section?: string })?.section,
        session: (a.session as unknown as { name: string })?.name ?? "Unknown",
      }));
    }

    return NextResponse.json({
      success: true,
      data: { ...user, classAssignments },
    });

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

    // Raw collection reference — bypasses discriminator scoping
    const collection = mongoose.connection.collection("users");

    let auditAction = AuditAction.UPDATE;
    let description = `Updated user ${user.surname} ${user.firstName} ${user.otherName}`;

    if (action === "activate") {
      user.status = UserStatus.ACTIVE;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.ACTIVE,
        });
      }
      auditAction = AuditAction.ACTIVATE;
      description = `Activated account for ${user.surname} ${user.firstName} ${user.otherName}`;
      await user.save();
    } else if (action === "deactivate") {
      user.status = UserStatus.INACTIVE;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.INACTIVE,
        });
      }
      auditAction = AuditAction.DEACTIVATE;
      description = `Deactivated account for ${user.surname} ${user.firstName} ${user.otherName}`;
      await user.save();
    } else if (action === "suspend") {
      user.status = UserStatus.SUSPENDED;
      if (user.activeRole === UserRole.STUDENT) {
        await StudentModel.findByIdAndUpdate(id, {
          studentStatus: StudentStatus.SUSPENDED,
        });
      }
      auditAction = AuditAction.SUSPEND;
      description = `Suspended account for ${user.surname} ${user.firstName} ${user.otherName}`;
      await user.save();
    } else {
      let skipSave = false;
  console.log("user.roles:", user.roles);
  console.log("UserRole.PARENT value:", UserRole.PARENT);
  console.log("includes check:", user.roles.includes(UserRole.PARENT));
  

      // ── 1. Basic allowed fields ──────────────────────────────────
      const allowedFields = [
        "surname",
        "firstName",
        "otherName",
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
      // Then override just phone after the loop
if (updateData.phone) {
  (user as unknown as Record<string, unknown>).phone = sanitizePhone(updateData.phone);
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

      // ── 3. Roles + children (teacher gaining/losing parent role) ──
      if (updateData.roles && Array.isArray(updateData.roles)) {
        const newRoles = updateData.roles as UserRole[];
        const newChildren = Array.isArray(updateData.children)
          ? (updateData.children as string[])
          : [];

        // Fetch old children directly from raw collection
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
          await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            {
              $set: {
                roles: newRoles,
                children: newChildren.map(
                  (c) => new mongoose.Types.ObjectId(c),
                ),
              },
            },
          );
        } else {
          // Teacher removing parent role — clean up all child links
          if (oldChildren.length > 0) {
            await StudentModel.updateMany(
              { _id: { $in: oldChildren } },
              { $pull: { parents: id } },
            );
          }
          await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: { roles: newRoles, children: [] } },
          );
        }

        skipSave = true;
      }

      // ── 4. Children update for pure parents (no role change) ────
      if (
  !updateData.roles &&
  Array.isArray(updateData.children) &&
  (user.activeRole === UserRole.PARENT || user.roles?.includes(UserRole.PARENT))
) {
        const newChildren = updateData.children as string[];

        console.log("=== BLOCK 4 RUNNING ===");
        console.log("newChildren:", newChildren);
        console.log("user.roles:", user.roles);

        const rawDoc = await collection.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });

        console.log("rawDoc.children before update:", rawDoc?.children);

        const oldChildren: string[] = (rawDoc?.children ?? []).map(
          (c: unknown) => c?.toString() ?? "",
        );

        const removedChildren = oldChildren.filter(
          (c) => !newChildren.includes(c),
        );

        console.log("oldChildren:", oldChildren);
        console.log("removedChildren:", removedChildren);

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

        const updateResult = await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          {
            $set: {
              children: newChildren.map((c) => new mongoose.Types.ObjectId(c)),
            },
          },
        );

        console.log("updateResult:", updateResult);

        // Verify it was saved
        const afterDoc = await collection.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        console.log("rawDoc.children AFTER update:", afterDoc?.children);

        skipSave = true;
        console.log("skipSave set to:", skipSave);
      }

      console.log("=== FINAL skipSave value:", skipSave, "===");

      if (!skipSave) {
        await user.save();
      } else {
        console.log("=== SKIPPING user.save() ===");
      }
    }

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.otherName}`,
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
      .populate("children", "surname firstName otherName admissionNumber")
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

    const userName = `${user.surname} ${user.firstName} ${user.otherName}`;
    const userRole = user.activeRole;

    // await user.deleteOne();
    await UserModel.findByIdAndDelete(id);

    await createAuditLog({
      actorId: session.user.id,
      actorName: ` ${session.user.firstName} ${session.user.otherName}`,
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


