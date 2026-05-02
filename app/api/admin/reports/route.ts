// import { NextRequest, NextResponse } from "next/server";
// // import { auth } from "@/lib/auth";
// import { getSession } from "@/lib/session";
// import { connectDB } from "@/lib/db";
// import ReportCardModel from "@/models/ReportCard";
// import { ReportStatus, UserRole } from "@/types/enums";
// import type { ApiResponse } from "@/types";

// async function requireAdmin() {
//   const session = await getSession();
//   if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
//   return session;
// }

// export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<object[]>>> {
//   const session = await requireAdmin();
//   if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

//   try {
//     await connectDB();
//     const { searchParams } = new URL(request.url);
//     const status = searchParams.get("status");
//     const sessionId = searchParams.get("sessionId");
//     const termId = searchParams.get("termId");
//     const page = parseInt(searchParams.get("page") ?? "1");
//     const limit = parseInt(searchParams.get("limit") ?? "20");

//     const query: Record<string, unknown> = {};
//     if (status) query.status = status;
//     if (sessionId) query.session = sessionId;
//     if (termId) query.term = termId;

//     const total = await ReportCardModel.countDocuments(query);
//     const reports = await ReportCardModel.find(query)
//       .populate("submittedBy", "surname firstName otherName email")
//       .populate("class", "name section")
//       .sort({ submittedAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     return NextResponse.json({
//       success: true,
//       data: reports,
//       pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
//     });
//   } catch (error) {
   
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose"
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import ReportCardModel from "@/models/ReportCard";
import UserModel from "@/models/User";
import StudentModel from "@/models/Student"; // ← add this import
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

    // ── Fetch latest profile photos for all students in one query ─────────
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
    // ─────────────────────────────────────────────────────────────────────

    const uniqueClassIds = [...new Set(
      reports
        .map((r) => {
          const cls = r.class as { _id: { toString(): string } } | null;
          return cls?._id?.toString();
        })
        .filter(Boolean)
    )];

    const classCounts: Record<string, number> = {};
    await Promise.all(
      uniqueClassIds.map(async (cId) => {
        const count = await UserModel.countDocuments({
          $or: [{ activeRole: "student" }, { role: "student" }],
          currentClass: new mongoose.Types.ObjectId(cId!),
          studentStatus: StudentStatus.ACTIVE,
        });
        classCounts[cId!] = count;
      })
    );

    const patchedReports = reports.map((r) => {
      const cls = r.class as { _id: { toString(): string } } | null;
      const cId = cls?._id?.toString();
      const studentId = (r as unknown as { student: string }).student?.toString();
      const snapshot = r.studentSnapshot as Record<string, unknown>;

      return {
        ...r,
        totalStudentsInClass: cId ? (classCounts[cId] ?? r.totalStudentsInClass) : r.totalStudentsInClass,
        // ── Inject latest profile photo into snapshot ──────────────────
        studentSnapshot: {
          ...snapshot,
          profilePhoto: studentId ? (photoMap[studentId] ?? snapshot.profilePhoto) : snapshot.profilePhoto,
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