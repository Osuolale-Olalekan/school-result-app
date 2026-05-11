import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import TermSubjectConfigModel from "@/models/TermSubjectConfig";
import ClassModel from "@/models/Class";
import "@/lib/registerModels";

// ─── GET /api/admin/subject-schedule?classId=&sessionId=&term= ───────────────
// Returns the excluded subjects for a class/session/term
// Also returns all subjects assigned to the class so the UI can render toggles

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
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

    // Get class with its subjects
    const classDoc = await ClassModel.findById(classId)
      .populate("subjects", "name code hasPractical department")
      .lean() as {
        _id: string;
        name: string;
        subjects: Array<{
          _id: string;
          name: string;
          code: string;
          hasPractical: boolean;
          department: string;
        }>;
      } | null;

    if (!classDoc) {
      return Response.json({ success: false, error: "Class not found" }, { status: 404 });
    }

    // Get existing config if any
    const config = await TermSubjectConfigModel.findOne({
      class: classId,
      session: sessionId,
      term,
    }).lean();

    const excludedSubjectIds = (config?.excludedSubjects ?? []).map((id) =>
      id.toString()
    );

    return Response.json({
      success: true,
      data: {
        subjects: classDoc.subjects,
        excludedSubjectIds,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/subject-schedule]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/subject-schedule ────────────────────────────────────────
// Upserts the excluded subjects config for a class/session/term
// Body: { classId, sessionId, term, excludedSubjectIds: string[] }

interface SubjectSchedulePayload {
  classId: string;
  sessionId: string;
  term: TermName;
  excludedSubjectIds: string[];
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = (await request.json()) as SubjectSchedulePayload;
    const { classId, sessionId, term, excludedSubjectIds } = body;

    if (!classId || !sessionId || !term || !Array.isArray(excludedSubjectIds)) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const config = await TermSubjectConfigModel.findOneAndUpdate(
      { class: classId, session: sessionId, term },
      {
        $set: {
          excludedSubjects: excludedSubjectIds,
          updatedBy: session.user.id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, data: config });
  } catch (error) {
    console.error("[POST /api/admin/subject-schedule]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}