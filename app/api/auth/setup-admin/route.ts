import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { UserRole, UserStatus, AuditAction } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ email: string }>>> {
  try {
    const body = (await request.json()) as {
      secret: string;
      surname: string;
      firstName: string;
      otherName: string;
      email: string;
      password: string;
      phone?: string;
    };

    const { secret, surname, firstName, otherName, email, password, phone } = body;

    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!surname || !firstName || !otherName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingAdmin = await UserModel.findOne({ roles: UserRole.ADMIN });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "An admin account already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await UserModel.create({
      surname: surname.trim(),
      firstName: firstName.trim(),
      otherName: otherName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      // role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await createAuditLog({
      actorId: admin._id.toString(),
      actorName: `${admin.surname} ${admin.firstName} ${admin.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "Admin",
      entityId: admin._id.toString(),
      description: "Initial admin account created via setup endpoint",
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: { email: admin.email },
        message: "Admin account created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
