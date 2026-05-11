import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import TermSubjectConfigModel from "@/models/TermSubjectConfig";
import ClassAssignmentModel from "@/models/ClassAssignment";
import "@/lib/registerModels";

// ─── GET /api/teacher/subject-schedule?classId=&sessionId=&term= ─────────────
// Returns excluded subject IDs for the teacher's class/term
// Teacher must be assigned to the class

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId   = searchParams.get("classId");
  const sessionId = searchParams.get("sessionId");
  const term      = searchParams.get("term") as TermName | null;

  if (!classId || !sessionId || !term) {
    return Response.json(
      { success: false, error: "classId, sessionId, and term are required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verify teacher is assigned to this class
    const assignment = await ClassAssignmentModel.findOne({
      teacher: session.user.id,
      class: classId,
      isActive: true,
    });
    if (!assignment) {
      return Response.json(
        { success: false, error: "Not assigned to this class" },
        { status: 403 }
      );
    }

    const config = await TermSubjectConfigModel.findOne({
      class: classId,
      session: sessionId,
      term,
    }).lean();

    const excludedSubjectIds = (config?.excludedSubjects ?? []).map((id) =>
      id.toString()
    );

    return Response.json({ success: true, data: { excludedSubjectIds } });
  } catch (error) {
    console.error("[GET /api/teacher/subject-schedule]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}