import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";

import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import ReportCardModel from "@/models/ReportCard";
import AuditLogModel from "@/models/AuditLog";
import ClassModel from "@/models/Class";
import {
  UserRole,
  StudentStatus,
  ReportStatus,
  PaymentStatus,
} from "@/types/enums";
import type { ApiResponse, AdminAnalytics } from "@/types";

export async function GET(): Promise<
  NextResponse<ApiResponse<AdminAnalytics>>
> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const [
  totalStudents,
  totalTeachers,
  totalParents,
  activeStudents,
  graduatedStudents,
  totalClasses,        // ← currently gets UserModel.countDocuments($ne GRADUATED) — wrong
  pendingReports,
  approvedReports,
  recentAuditLogs,
] = await Promise.all([
  UserModel.countDocuments({ role: UserRole.STUDENT }),
  UserModel.countDocuments({ role: UserRole.TEACHER }),
  UserModel.countDocuments({ role: UserRole.PARENT }),
  UserModel.countDocuments({ role: UserRole.STUDENT, studentStatus: StudentStatus.ACTIVE }),
  UserModel.countDocuments({ role: UserRole.STUDENT, studentStatus: { $ne: StudentStatus.GRADUATED } }),
  ClassModel.countDocuments(),                                    // ← totalClasses should get this
  ReportCardModel.countDocuments({ status: ReportStatus.SUBMITTED }),
  ReportCardModel.countDocuments({ status: ReportStatus.APPROVED }),
  AuditLogModel.find().sort({ createdAt: -1 }).limit(10).lean(),
]);

    // Students by class
    // const studentsByClassRaw = await UserModel.aggregate([
    //   { $match: { role: UserRole.STUDENT } },
    //   { $lookup: { from: "classes", localField: "currentClass", foreignField: "_id", as: "classInfo" } },
    //   { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
    //   { $group: { _id: "$classInfo.name", count: { $sum: 1 } } },
    //   { $sort: { _id: 1 } },
    // ]);

    // Students by class — exclude graduated students
    const studentsByClassRaw = await UserModel.aggregate([
      {
        $match: {
          role: UserRole.STUDENT,
          studentStatus: { $ne: StudentStatus.GRADUATED },
        },
      }, // ✅ add this
      {
        $lookup: {
          from: "classes",
          localField: "currentClass",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
       { $match: { "classInfo.name": { $exists: true, $ne: null } } },
      { $group: { _id: "$classInfo.name", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Students by status
    const studentsByStatusRaw = await UserModel.aggregate([
      { $match: { role: UserRole.STUDENT } },
      { $group: { _id: "$studentStatus", count: { $sum: 1 } } },
    ]);

    // Reports by status
    const reportsByStatusRaw = await ReportCardModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Payment stats
    const paymentStats = await ReportCardModel.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    const paymentStatsMap: { paid: number; unpaid: number; partial: number } = {
      paid: 0,
      unpaid: 0,
      partial: 0,
    };
    for (const item of paymentStats) {
      if (item._id === PaymentStatus.PAID) paymentStatsMap.paid = item.count;
      else if (item._id === PaymentStatus.UNPAID)
        paymentStatsMap.unpaid = item.count;
      else if (item._id === PaymentStatus.PARTIAL)
        paymentStatsMap.partial = item.count;
    }

    const analytics: AdminAnalytics = {
      totalStudents,
      totalTeachers,
      totalParents,
      activeStudents,
      totalClasses,
      pendingReports,
      approvedReports,
      recentAuditLogs:
        recentAuditLogs as unknown as AdminAnalytics["recentAuditLogs"],
      studentsByClass: studentsByClassRaw.map((item) => ({
        className: (item._id as string) ?? "Unknown",
        count: item.count as number,
      })),
      studentsByStatus: studentsByStatusRaw.map((item) => ({
        status: (item._id as string) ?? "Unknown",
        count: item.count as number,
      })),
      reportsByStatus: reportsByStatusRaw.map((item) => ({
        status: (item._id as string) ?? "Unknown",
        count: item.count as number,
      })),
      paymentStats: paymentStatsMap,
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
