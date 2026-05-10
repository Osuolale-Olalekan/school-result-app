import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { UserRole, TermName } from "@/types/enums";
import SchoolCalendarModel from "@/models/SchoolCalendar";
import type { CalendarEventType } from "@/models/SchoolCalendar";
import "@/lib/registerModels";

// ─── GET /api/admin/school-calendar?sessionId=&term= ─────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
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
      .sort({ startDate: 1 })
      .lean();
    return Response.json({ success: true, data: events });
  } catch (error) {
    console.error("[GET /api/admin/school-calendar]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/school-calendar ─────────────────────────────────────────

interface CalendarPayload {
  sessionId: string;
  term: TermName;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  blocksAttendance: boolean;
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = (await request.json()) as CalendarPayload;
    const { sessionId, term, title, type, startDate, endDate, blocksAttendance } = body;

    if (!sessionId || !term || !title || !type || !startDate || !endDate) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Normalise to midnight UTC
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    if (end < start) {
      return Response.json(
        { success: false, error: "End date cannot be before start date" },
        { status: 400 }
      );
    }

    const event = await SchoolCalendarModel.create({
      session: sessionId,
      term,
      title,
      type,
      startDate: start,
      endDate: end,
      blocksAttendance: blocksAttendance ?? true,
      createdBy: session.user.id,
    });

    return Response.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/school-calendar]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/school-calendar?id= ───────────────────────────────────

export async function DELETE(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, error: "id is required" }, { status: 400 });
  }

  try {
    await connectDB();
    await SchoolCalendarModel.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/school-calendar]", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}