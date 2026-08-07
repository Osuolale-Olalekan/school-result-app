import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    await connectDB();

    const UserModel            = (await import("@/models/User")).default;
    const ClassAssignmentModel = (await import("@/models/ClassAssignment")).default;

    // ── 1. Get classes assigned to this teacher ───────────────────────────
    const assignments = await ClassAssignmentModel.find(
      { teacher: session.user.id },
      { class: 1 }
    ).lean();

    const assignedClassIds = assignments.map((a) => a.class);
    if (assignedClassIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // ── 2. Split query into words — every word must match somewhere ───────
    const words = q.split(/\s+/).filter(Boolean);
    const wordConditions = words.map((word) => {
      const regex = new RegExp(word, "i");
      return {
        $or: [
          { firstName:       regex },
          { surname:         regex },
          { otherName:       regex },
          { admissionNumber: regex },
        ],
      };
    });

    const students = await UserModel.find(
      {
        currentClass:  { $in: assignedClassIds },
        studentStatus: "active",
        $and: wordConditions,
      },
      { firstName: 1, surname: 1, otherName: 1, admissionNumber: 1, currentClass: 1 }
    )
      .populate("currentClass", "name")
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, data: students });
  } catch (err) {
    console.error("[search-students]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}