import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { AuditAction } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { token, password } = (await request.json()) as {
      token: string;
      password: string;
    };

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      actorId: user._id.toString(),
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.activeRole,
      action: AuditAction.PASSWORD_RESET,
      entity: "User",
      entityId: user._id.toString(),
      description: "Password reset successfully",
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
   
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
