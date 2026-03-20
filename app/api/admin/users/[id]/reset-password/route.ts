// app/api/admin/users/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import UserModel from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const user = await UserModel.findById(id).select("+password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Generate new password
    const newPassword    = Math.random().toString(36).slice(-8) + "A1!";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await UserModel.findByIdAndUpdate(id, { password: hashedPassword });

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.UPDATE,
      entity:      "User",
      entityId:    id,
      description: `Reset password for ${user.surname} ${user.firstName}${user.otherName ? ' ' + user.otherName : ''}`,
    });

    // If user has email — send it to them
    if (user.email) {
      await sendWelcomeEmail(user.email, user.firstName, user.activeRole, newPassword);
      return NextResponse.json({
        success: true,
        data:    { hasEmail: true },
        message: "Password reset and sent to user's email",
      });
    }

    // No email — return password to admin to share manually
    return NextResponse.json({
      success: true,
      data:    { hasEmail: false, newPassword },
      message: "Password reset successfully",
    });

  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}