import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import StudentModel from "@/models/Student";
import { AuditAction, ClassLevel, Department, StudentStatus, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { CLASS_PROGRESSION, getSSSClassName } from "@/lib/promotion";
import type { ApiResponse } from "@/types";
import { Types } from "mongoose";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<object>>> {
  const { studentId } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { targetClassId, department } = await request.json() as {
      targetClassId?: string;
      department?: Department;
    };

    const student = await StudentModel.findById(studentId).populate("currentClass") as unknown as {
      surname: string;
      firstName: string;
      otherName: string;
      currentClass: { name: ClassLevel; _id: string };
    };
    if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });

    const currentClass = student.currentClass as unknown as { name: ClassLevel; _id: string };

    let newClassId: string;
    let newClassName: string;

    if (targetClassId === "graduate") {
      // Admin manually graduates the student
      await StudentModel.findByIdAndUpdate(studentId, { studentStatus: StudentStatus.GRADUATED });
      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.PROMOTE,
        entity: "Student",
        entityId: studentId,
        description: `Manually graduated student ${student.surname} ${student.firstName} ${student.otherName}`,
      });
      return NextResponse.json({ success: true, message: "Student graduated successfully" });
    } else if (targetClassId) {
      // Manual override: admin picks target class
      const targetClass = await ClassModel.findById(targetClassId);
      if (!targetClass) return NextResponse.json({ success: false, error: "Target class not found" }, { status: 404 });
      newClassId = targetClass._id.toString();
      newClassName = targetClass.name;
    } else {
      // Auto-promotion
      const nextClassName = CLASS_PROGRESSION[currentClass.name];

      if (nextClassName === null) {
        // Graduate the student
        await StudentModel.findByIdAndUpdate(studentId, { studentStatus: StudentStatus.GRADUATED });
        await createAuditLog({
          actorId: session.user.id,
          actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
          actorRole: UserRole.ADMIN,
          action: AuditAction.PROMOTE,
          entity: "Student",
          entityId: studentId,
          description: `Graduated student ${student.surname} ${student.firstName} ${student.otherName} (${(currentClass as { name: string }).name})`,
        });
        return NextResponse.json({ success: true, message: "Student graduated successfully" });
      }

      if (nextClassName === "SSS_1_DEPT_REQUIRED") {
        if (!department || department === Department.NONE) {
          return NextResponse.json(
            { success: false, error: "Department must be assigned when promoting from JSS 3 to SSS 1" },
            { status: 400 }
          );
        }
        // Find SSS 1 class with the department
        const sss1Class = await ClassModel.findOne({ name: ClassLevel.SSS_1, department });
        if (!sss1Class) {
          return NextResponse.json(
            { success: false, error: `SSS 1 ${department} department class not found` },
            { status: 404 }
          );
        }
        newClassId = sss1Class._id.toString();
        newClassName = sss1Class.name;
      } else {
        const nextClass = await ClassModel.findOne({ name: nextClassName });
        if (!nextClass) {
          return NextResponse.json({ success: false, error: "Next class not found" }, { status: 404 });
        }
        newClassId = nextClass._id.toString();
        newClassName = nextClass.name;
      }
    }

    const updateData: Record<string, unknown> = { currentClass: new Types.ObjectId(newClassId) };
    if (department && department !== Department.NONE) {
      updateData.department = department;
    }

    await StudentModel.findByIdAndUpdate(studentId, updateData);

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.PROMOTE,
      entity: "Student",
      entityId: studentId,
      description: `Promoted ${student.surname} ${student.firstName} ${student.otherName} from ${currentClass.name} to ${newClassName}`,
    });

    return NextResponse.json({
      success: true,
      message: `Student promoted to ${newClassName} successfully`,
    });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
