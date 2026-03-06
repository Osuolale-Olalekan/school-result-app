import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
// import { auth } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels"
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import TeacherModel from "@/models/Teacher";
import ParentModel from "@/models/Parent";
import ClassModel from "@/models/Class";
import {
  AuditAction,
  UserRole,
  UserStatus,
  Department,
  StudentStatus,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { NotificationType } from "@/types/enums";
import { generateAdmissionNumber, generateEmployeeId } from "@/lib/utils";
import type { ApiResponse } from "@/types";
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeOptional } from "@/lib/utils";

async function requireAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return null;
  }
  return session;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole | null;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (role) query.roles = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { surname: {$regex: search, $options: "i"} },
        { firstName: { $regex: search, $options: "i" } },
        { otherName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await UserModel.countDocuments(query);
    const users = await UserModel.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("currentClass", "name section")
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
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
    const { role } = body as { role: UserRole };

    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    let created: {
      _id: unknown;
      surname: string;
      firstName: string;
      otherName: string;
      email: string;
      roles: UserRole[];
      activeRole: UserRole;
    } | null = null;

    if (role === UserRole.STUDENT) {
      let admissionNumber: string;

      if (body.admissionNumber) {
        // Manual entry — check uniqueness
        const existing = await StudentModel.findOne({
          admissionNumber: (body.admissionNumber as string).toUpperCase(),
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: "Admission number already exists" },
            { status: 409 },
          );
        }
        admissionNumber = (body.admissionNumber as string).toUpperCase();
      } else {
        const studentCount = await StudentModel.countDocuments();
        admissionNumber = generateAdmissionNumber(
          new Date().getFullYear(),
          studentCount + 1,
        );
      }
      const classDoc = await ClassModel.findById(body.currentClass);
      if (!classDoc) {
        return NextResponse.json(
          { success: false, error: "Class not found" },
          { status: 400 },
        );
      }

      // Validate department for SSS students
      const isSSS = (classDoc.name as string).startsWith("SSS");
      if (isSSS && (!body.department || body.department === Department.NONE)) {
        return NextResponse.json(
          { success: false, error: "Department is required for SSS students" },
          { status: 400 },
        );
      }

      created = (await StudentModel.create({
        surname: (body.surname as string).trim(),
        firstName: (body.firstName as string).trim(),
        otherName: (body.otherName as string).trim(),
        email: (body.email as string).toLowerCase().trim(),
        password: hashedPassword,
        phone:        sanitizePhone(body.phone),
        // role: UserRole.STUDENT,
        roles: [UserRole.STUDENT],
        activeRole: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        profilePhoto: body.profilePhoto,
        admissionNumber,
        admissionDate: body.admissionDate ?? new Date(),
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        address:      sanitizeOptional(body.address),
        guardianName: sanitizeOptional(body.guardianName),
        guardianPhone: body.guardianPhone ? sanitizePhone(body.guardianPhone) : undefined,
        currentClass: body.currentClass,
        department: body.department ?? Department.NONE,
        studentStatus: StudentStatus.ACTIVE,
        parents: body.parents ?? [],
        stateOfOrigin: body.stateOfOrigin,
        localGovernment: body.localGovernment,
        religion: body.religion,
        bloodGroup: body.bloodGroup,
      })) as unknown as {
        _id: unknown;
        surname: string;
        firstName: string;
        otherName: string;
        email: string;
        roles: UserRole[];
        activeRole: UserRole;
      };
    } else if (role === UserRole.TEACHER) {
      const teacherCount = await TeacherModel.countDocuments();
      const employeeId = generateEmployeeId(teacherCount + 1);

      created = (await TeacherModel.create({
        surname: (body.surname as string).trim(),
        firstName: (body.firstName as string).trim(),
        otherName: (body.otherName as string).trim(),
        email: (body.email as string).toLowerCase().trim(),
        password: hashedPassword,
        phone:           sanitizePhone(body.phone),
        // role: UserRole.TEACHER,
        roles: [UserRole.TEACHER],
        activeRole: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        profilePhoto: body.profilePhoto,
        employeeId,
        qualification:   sanitizeOptional(body.qualification),
  specialization:  sanitizeOptional(body.specialization),
        dateOfEmployment: body.dateOfEmployment ?? new Date(),
      })) as unknown as {
        _id: unknown;
        surname: string;
        firstName: string;
        otherName: string;
        email: string;
        roles: UserRole[];
        activeRole: UserRole;
      };
    } else if (role === UserRole.PARENT) {
      created = (await ParentModel.create({
        surname: (body.surname as string).trim(),
        firstName: (body.firstName as string).trim(),
        otherName: (body.otherName as string).trim(),
        email: (body.email as string).toLowerCase().trim(),
        password: hashedPassword,
        phone:           sanitizePhone(body.phone),
        // role: UserRole.PARENT,
        roles: [UserRole.PARENT],
        activeRole: UserRole.PARENT,
        status: UserStatus.ACTIVE,
        profilePhoto: body.profilePhoto,
        children: body.children ?? [],
        occupation: body.occupation,
        relationship: body.relationship,
      })) as unknown as {
        _id: unknown;
        surname: string;
        firstName: string;
        otherName: string;
        email: string;
        roles: UserRole[];
        activeRole: UserRole;
      };

      // Link parent to children
      if (Array.isArray(body.children) && body.children.length > 0) {
        await StudentModel.updateMany(
          { _id: { $in: body.children } },
          { $addToSet: { parents: created._id } },
        );
      }
    } else if (role === UserRole.ADMIN) {
      // Check email uniqueness
      const existing = await UserModel.findOne({
        email: (body.email as string).toLowerCase().trim(),
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 409 },
        );
      }

      created = (await UserModel.create({
        surname: (body.surname as string).trim(),
        firstName: (body.firstName as string).trim(),
        otherName: (body.otherName as string).trim(),
        email: (body.email as string).toLowerCase().trim(),
        password: hashedPassword,
        phone: body.phone,
        roles: [UserRole.ADMIN],
        activeRole: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      })) as unknown as {
        _id: unknown;
        surname: string;
        firstName: string;
        otherName: string;
        email: string;
        roles: UserRole[];
        activeRole: UserRole;
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    if (!created) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Send welcome email
    await sendWelcomeEmail(
      created.email,
      created.firstName,
      role,
      tempPassword,
    );

    // Create notification
    await createNotification({
      recipientId: created._id?.toString() ?? "",
      recipientRole: role,
      type: NotificationType.ACCOUNT_CREATED,
      title: "Welcome to God's Way Model Groups of Schools",
      message: `Your ${role} account has been created. Please check your email for login credentials.`,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: role.charAt(0).toUpperCase() + role.slice(1),
      entityId: created._id?.toString() ?? "",
      description: `Created ${role} account for ${created.surname} ${created.firstName} ${created.otherName}`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    const { ...safeUser } = created;
    return NextResponse.json(
      { success: true, data: safeUser, message: "User created successfully" },
      { status: 201 },
    );
  } catch (error) {
    const mongoError = error as {
      code?: number;
      keyValue?: Record<string, string>;
    };
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyValue ?? {})[0];
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

