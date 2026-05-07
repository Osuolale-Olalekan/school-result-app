import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import ReportCardModel from "@/models/ReportCard";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import { UserRole, StudentStatus, ReportStatus } from "@/types/enums";
import { generateAIPrincipalComment } from "@/lib/aicomment";
import mongoose from "mongoose";
import type { ApiResponse } from "@/types";

// Reuse the same resolveDeptCount logic from the parent route
async function resolveDeptCount(
  classId: string,
  department: string,
  totalInClass: number,
): Promise<number> {
  const distinctDepts = await UserModel.distinct("department", {
    $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
    currentClass: new mongoose.Types.ObjectId(classId),
    studentStatus: StudentStatus.ACTIVE,
  });

  const meaningfulDepts = (distinctDepts as (string | null | undefined)[]).filter(
    (d) => d && d !== "none",
  );

  const shouldSplitByDept =
    meaningfulDepts.length >= 1 &&
    (distinctDepts.length > 1 || meaningfulDepts.length >= 1);

  if (!shouldSplitByDept) return totalInClass;

  const deptQuery =
    department === "none" ? { $in: [null, "none", undefined] } : department;

  return await UserModel.countDocuments({
    $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
    currentClass: new mongoose.Types.ObjectId(classId),
    studentStatus: StudentStatus.ACTIVE,
    department: deptQuery,
  });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<{ comment: string }>>> {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const report = await ReportCardModel.findById(id).lean();
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      return NextResponse.json(
        { success: false, error: "Report is not in submitted state" },
        { status: 400 },
      );
    }

    const classId = report.class?.toString() ?? "";
    const department =
      (report.studentSnapshot as { department?: string })?.department ?? "none";

    const totalInClass = classId
      ? await UserModel.countDocuments({
          $or: [{ activeRole: UserRole.STUDENT }, { role: UserRole.STUDENT }],
          currentClass: new mongoose.Types.ObjectId(classId),
          studentStatus: StudentStatus.ACTIVE,
        })
      : report.totalStudentsInClass;

    const totalInDept = classId
      ? await resolveDeptCount(classId, department, totalInClass)
      : (report as unknown as { totalStudentsInDept?: number })
          .totalStudentsInDept ?? report.totalStudentsInClass;

    const comment = await generateAIPrincipalComment({
      studentName: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName}`,
      className: report.className,
      termName: report.termName,
      percentage: report.percentage,
      position: report.position,
      totalStudentsInClass: totalInClass,
      totalStudentsInDept: totalInDept,
      grade: report.grade,
      subjects: report.subjects.map((s) => ({
        subjectName: s.subjectName,
        grade: s.grade,
        totalScore: s.totalScore,
        maxTotalScore: s.maxTotalScore,
      })),
    });

    return NextResponse.json({ success: true, data: { comment } });
  } catch (error) {
    console.error("[AI Comment Preview] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate comment" },
      { status: 500 },
    );
  }
}