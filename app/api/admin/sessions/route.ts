import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
// import { getServerSession } from "next-auth";
import { getSession } from "@/lib/session";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SessionModel, TermModel } from "@/models/Session";
import { AuditAction, SessionStatus, TermName, TermStatus, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) return null;
  return session;
}

export async function GET(): Promise<NextResponse<ApiResponse<object[]>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const sessions = await SessionModel.find()
      .populate("terms")
      .sort({ startYear: -1 })
      .lean();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<object>>> {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const body = await request.json() as {
      name: string;
      startYear: number;
      endYear: number;
      terms: Array<{
        name: TermName;
        startDate: string;
        endDate: string;
        resumptionDate?: string;
        schoolDaysOpen?: number;
      }>;
    };

    const existingSession = await SessionModel.findOne({ name: body.name });
    if (existingSession) {
      return NextResponse.json({ success: false, error: "Session already exists" }, { status: 409 });
    }

    // Create session
    const newSession = await SessionModel.create({
      name: body.name,
      startYear: body.startYear,
      endYear: body.endYear,
      status: SessionStatus.UPCOMING,
    });

    // Create 3 terms for the session
    const termNames = [TermName.FIRST, TermName.SECOND, TermName.THIRD];
    const termIds: unknown[] = [];

    for (let i = 0; i < 3; i++) {
      const termData = body.terms[i];
      const term = await TermModel.create({
        name: termData?.name ?? termNames[i],
        status: TermStatus.UPCOMING,
        startDate: termData?.startDate ?? new Date(),
        endDate: termData?.endDate ?? new Date(),
        resumptionDate: termData?.resumptionDate,
        schoolDaysOpen: termData?.schoolDaysOpen ?? 0,
        session: newSession._id,
      });
      termIds.push(term._id);
    }

    newSession.terms = termIds as typeof newSession.terms;
    await newSession.save();

    await createAuditLog({
      actorId: session.user.id,
      actorName: `${session.user.firstName} ${session.user.lastName}`,
      actorRole: UserRole.ADMIN,
      action: AuditAction.CREATE,
      entity: "Session",
      entityId: newSession._id.toString(),
      description: `Created academic session: ${body.name}`,
    });

    const populated = await SessionModel.findById(newSession._id).populate("terms").lean();
    return NextResponse.json({ success: true, data: populated!, message: "Session created successfully" }, { status: 201 });
  } catch (error) {
   
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
