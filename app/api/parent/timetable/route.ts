// app/api/parent/timetable/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import TimetableModel from "@/models/TimeTable";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const UserModel    = (await import("@/models/User")).default;
    const StudentModel = (await import("@/models/Student")).default;

    const { searchParams } = new URL(request.url);
    const childId   = searchParams.get("childId");
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    const parent = await UserModel.findById(session.user.id, { children: 1 }).lean();
    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = childId
      ? [childId]
      : parent.children.map((c: unknown) => String(c));

    // const children = await StudentModel.find(
    //   { _id: { $in: childIds } },
    //   { currentClass: 1, firstName: 1, surname: 1 }
    // ).lean();

    // const results = await Promise.all(
    //   children.map(async (child) => {
    //     const query: Record<string, unknown> = { classId: child.currentClass };
    //     if (sessionId) query.sessionId = sessionId;
    //     if (termId)    query.termId    = termId;

    //     const timetable = await TimetableModel.findOne(query)
    //       .populate("classId",           "name section")
    //       .populate("sessionId",         "name")
    //       .populate("termId",            "name")
    //       .populate("periods.subjectId", "name")
    //       .populate("periods.teacherId", "firstName surname")
    //       .lean();

    //     return {
    //       child: {
    //         _id:       child._id,
    //         firstName: child.firstName,
    //         surname:   child.surname,
    //       },
    //       timetable: timetable ?? null,
    //     };
    //   })
    // );
    const children = await StudentModel.find(
  { _id: { $in: childIds } },
  { currentClass: 1 }
).lean();

// Fetch names from UserModel (base schema)
const childUserDocs = await UserModel.find(
  { _id: { $in: childIds } },
  { firstName: 1, surname: 1 }
).lean();

// Map for quick lookup
const nameMap = new Map(
  childUserDocs.map((u) => [u._id.toString(), { firstName: u.firstName, surname: u.surname }])
);

const results = await Promise.all(
  children.map(async (child) => {
    const query: Record<string, unknown> = { classId: child.currentClass };
    if (sessionId) query.sessionId = sessionId;
    if (termId)    query.termId    = termId;

    const timetable = await TimetableModel.findOne(query)
      .populate("classId",           "name section")
      .populate("sessionId",         "name")
      .populate("termId",            "name")
      .populate("periods.subjectId", "name")
      .populate("periods.teacherId", "firstName surname")
      .lean();

    const names = nameMap.get(child._id.toString());

    return {
      child: {
        _id:       child._id,
        firstName: names?.firstName ?? "",
        surname:   names?.surname   ?? "",
      },
      timetable: timetable ?? null,
    };
  })
);

    return NextResponse.json({ success: true, data: results });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}