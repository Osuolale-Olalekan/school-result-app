
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ReportCardModel from "@/models/ReportCard";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student";
import { UserRole, StudentStatus } from "@/types/enums";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status    = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");
    const classId   = searchParams.get("classId");
    const page      = parseInt(searchParams.get("page") ?? "1");
    const limit     = parseInt(searchParams.get("limit") ?? "20");

    const query: Record<string, unknown> = {};
    if (status)    query.status  = status;
    if (sessionId) query.session = sessionId;
    if (termId)    query.term    = termId;
    if (classId)   query.class   = classId;

    const total = await ReportCardModel.countDocuments(query);
    const reports = await ReportCardModel.find(query)
      .populate("submittedBy", "surname firstName otherName email")
      .populate("class", "name section")
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ── Fetch latest profile photos for all students in one query ──────────
    const studentIds = reports
      .map((r) => (r as unknown as { student: string }).student)
      .filter(Boolean);

    const freshStudents = await StudentModel.find(
      { _id: { $in: studentIds } },
      { profilePhoto: 1 }
    ).lean();

    const photoMap: Record<string, string> = {};
    for (const s of freshStudents) {
      const photo = (s as unknown as { profilePhoto?: string }).profilePhoto;
      if (photo) photoMap[s._id.toString()] = photo;
    }
    // ───────────────────────────────────────────────────────────────────────

    // ── Build class-wide student counts ────────────────────────────────────
    // const uniqueClassIds = [...new Set(
    //   reports
    //     .map((r) => {
    //       const cls = r.class as { _id: { toString(): string } } | null;
    //       return cls?._id?.toString();
    //     })
    //     .filter(Boolean) as string[]
    // )];

    // const classCounts: Record<string, number> = {};
    // await Promise.all(
    //   uniqueClassIds.map(async (cId) => {
    //     const count = await UserModel.countDocuments({
    //       $or: [{ activeRole: "student" }, { role: "student" }],
    //       currentClass: new mongoose.Types.ObjectId(cId),
    //       studentStatus: StudentStatus.ACTIVE,
    //     });
    //     classCounts[cId] = count;
    //   })
    // );
    // ───────────────────────────────────────────────────────────────────────

    // ── Build department-scoped student counts ─────────────────────────────
    // Key format: "classId:department"
    // We collect unique class+department pairs from the reports, then count
    // active students for each combination in one pass.
    // const uniqueClassDeptPairs = [...new Set(
    //   reports.map((r) => {
    //     const cls = r.class as { _id: { toString(): string } } | null;
    //     const cId = cls?._id?.toString() ?? "";
    //     const snap = r.studentSnapshot as { department?: string } | undefined;
    //     const dept = snap?.department ?? "none";
    //     return `${cId}:${dept}`;
    //   })
    // )];

    // const deptCounts: Record<string, number> = {};
    // await Promise.all(
    //   uniqueClassDeptPairs.map(async (pair) => {
    //     const colonIndex = pair.indexOf(":");
    //     const cId  = pair.slice(0, colonIndex);
    //     const dept = pair.slice(colonIndex + 1);

    //     if (!cId) return;

    //     const deptQuery =
    //       dept === "none"
    //         ? { $in: [null, "none", undefined] }
    //         : dept;

    //     const count = await UserModel.countDocuments({
    //       $or: [{ activeRole: "student" }, { role: "student" }],
    //       currentClass: new mongoose.Types.ObjectId(cId),
    //       studentStatus: StudentStatus.ACTIVE,
    //       department: deptQuery,
    //     });

    //     deptCounts[pair] = count;
    //   })
    // );
    // ───────────────────────────────────────────────────────────────────────

    // ── Determine if a class uses department-based ranking ─────────────────
    // A class uses department ranking only when it has students in 2+ different
    // non-"none" departments. Otherwise everyone is ranked together.
    // We figure this out from the reports we already have in memory.
    // const classDeptSets: Record<string, Set<string>> = {};
    // for (const r of reports) {
    //   const cls = r.class as { _id: { toString(): string } } | null;
    //   const cId = cls?._id?.toString() ?? "";
    //   const snap = r.studentSnapshot as { department?: string } | undefined;
    //   const dept = snap?.department ?? "none";
    //   if (!classDeptSets[cId]) classDeptSets[cId] = new Set();
    //   classDeptSets[cId].add(dept);
    // }

    // A class splits by dept when it has at least 1 meaningful dept AND
    // more than one distinct group total (same check as recalculatePositions).
    // const classUsesDeptRanking: Record<string, boolean> = {};
    // for (const [cId, deptSet] of Object.entries(classDeptSets)) {
    //   const meaningfulDepts = [...deptSet].filter((d) => d !== "none");
    //   classUsesDeptRanking[cId] = meaningfulDepts.length >= 1 && deptSet.size > 1;
    // }
    // ───────────────────────────────────────────────────────────────────────

//     const patchedReports = reports.map((r) => {
//   const cls       = r.class as { _id: { toString(): string } } | null;
//   const cId       = cls?._id?.toString() ?? "";
//   const studentId = (r as unknown as { student: string }).student?.toString();
//   const snapshot  = r.studentSnapshot as Record<string, unknown>;
//   const dept      = (snapshot?.department as string) ?? "none";
//   const deptKey   = `${cId}:${dept}`;

//   const usesDeptRanking = classUsesDeptRanking[cId] ?? false;

//   const resolvedDeptCount = usesDeptRanking
//     ? (deptCounts[deptKey] ?? (r as unknown as { totalStudentsInDept?: number }).totalStudentsInDept ?? 0)
//     : (classCounts[cId] ?? r.totalStudentsInClass ?? 0);

//   return {
//     ...r,
//     totalStudentsInClass: cId ? (classCounts[cId] ?? r.totalStudentsInClass) : r.totalStudentsInClass,
//     totalStudentsInDept: resolvedDeptCount,
//     // ── ADDED ──
//     overallPosition: (r as unknown as { overallPosition?: number }).overallPosition ?? r.position,
//     studentSnapshot: {
//       ...snapshot,
//       profilePhoto: studentId
//         ? (photoMap[studentId] ?? snapshot.profilePhoto)
//         : snapshot.profilePhoto,
//     },
//   };
// });
const patchedReports = reports.map((r) => {
  const studentId = (r as unknown as { student: string }).student?.toString();
  const snapshot  = r.studentSnapshot as Record<string, unknown>;

  return {
    ...r,
    totalStudentsInClass: r.totalStudentsInClass,
    totalStudentsInDept: (r as unknown as { totalStudentsInDept?: number }).totalStudentsInDept ?? r.totalStudentsInClass,
    overallPosition: (r as unknown as { overallPosition?: number }).overallPosition ?? r.position,
    studentSnapshot: {
      ...snapshot,
      profilePhoto: studentId
        ? (photoMap[studentId] ?? snapshot.profilePhoto)
        : snapshot.profilePhoto,
    },
  };
});

    return NextResponse.json({
      success: true,
      data: patchedReports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}