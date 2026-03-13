// app/api/parent/assignments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const UserModel       = (await import("@/models/User")).default;
    const StudentModel    = (await import("@/models/Student")).default;
    const SubmissionModel = (await import("@/models/Submission")).default;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    const parent = await UserModel.findById(session.user.id, { children: 1 }).lean();
    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = childId
      ? [childId]
      : parent.children.map((c: unknown) => String(c));

    // Get each child's class
    const childDocs = await StudentModel.find(
      { _id: { $in: childIds } },
      { currentClass: 1, firstName: 1, surname: 1 }
    ).lean();

    const classIds = [
      ...new Set(
        childDocs.map((c) => c.currentClass?.toString()).filter(Boolean)
      ),
    ];

    if (!classIds.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const assignments = await AssignmentModel.find({
      classId: { $in: classIds },
      status:  "published",
    })
      .populate("classId",   "name")
      .populate("subjectId", "name")
      .populate("createdBy", "firstName surname")
      .sort({ dueDate: 1 })
      .lean();

    if (!assignments.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const assignmentIds = assignments.map((a) => a._id);

    const submissions = await SubmissionModel.find({
      assignmentId: { $in: assignmentIds },
      studentId:    { $in: childIds },
    })
      .populate("studentId", "firstName surname admissionNumber")
      .lean();

    // Group submissions by assignmentId
    const subMap = new Map<string, typeof submissions>();
    for (const sub of submissions) {
      const key = sub.assignmentId.toString();
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key)!.push(sub);
    }

    const enriched = assignments.map((a) => ({
      ...a,
      submissions: subMap.get(a._id.toString()) ?? [],
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}