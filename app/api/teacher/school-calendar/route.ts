import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import SchoolCalendarModel from "@/models/SchoolCalendar";
import "@/lib/registerModels";

// ─── GET /api/teacher/school-calendar?sessionId=&term= ───────────────────────
// Read-only — teachers can see holidays but cannot modify them

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.TEACHER) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const term = searchParams.get("term") as TermName | null;

  if (!sessionId || !term) {
    return Response.json(
      { success: false, error: "sessionId and term are required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const events = await SchoolCalendarModel.find({ session: sessionId, term })
      .select("title type startDate endDate blocksAttendance")
      .sort({ startDate: 1 })
      .lean();
    return Response.json({ success: true, data: events });
  } catch (error) {
    console.error("[GET /api/teacher/school-calendar]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}