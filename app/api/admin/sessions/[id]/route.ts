import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
// import { getServerSession } from "next-auth";
import { getSession } from "@/lib/session";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SessionModel, TermModel } from "@/models/Session";
import {
  AuditAction,
  SessionStatus,
  TermStatus,
  UserRole,
} from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<object>>> {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const body = (await request.json()) as {
      name?: string;
      startYear?: number;
      endYear?: number;
      status?: SessionStatus;
      termId?: string;
      termStatus?: TermStatus;
      termData?: {
        startDate?: string;
        endDate?: string;
        resumptionDate?: string;
        schoolDaysOpen?: number;
      };
      addTerm?: {
        name: string;
        startDate?: string;
        endDate?: string;
        resumptionDate?: string;
        schoolDaysOpen?: number;
        status?: TermStatus;
      }; // ← add this
    };

    const academicSession = await SessionModel.findById(id);
    if (!academicSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    if (body.status) {
      academicSession.status = body.status;
      await academicSession.save();

      await createAuditLog({
        actorId: session.user.id,
        actorName: `${session.user.surname} ${session.user.firstName} ${session.user.otherName}`,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entity: "Session",
        entityId: id,
        description: `Updated session ${academicSession.name} status to ${body.status}`,
      });
    }

    if (body.termId && body.termStatus) {
      await TermModel.findByIdAndUpdate(body.termId, {
        status: body.termStatus,
      });
    }

    if (body.termId && body.termData) {
      await TermModel.findByIdAndUpdate(body.termId, { ...body.termData });
    }

    // Handle adding a new term to an existing session
    if (body.addTerm) {
      const newTerm = await TermModel.create({
        name: body.addTerm.name,
        status: body.addTerm.status ?? TermStatus.UPCOMING,
        startDate: body.addTerm.startDate,
        endDate: body.addTerm.endDate,
        resumptionDate: body.addTerm.resumptionDate,
        schoolDaysOpen: body.addTerm.schoolDaysOpen ?? 0,
        session: id,
      });

      academicSession.terms.push(newTerm._id);
      await academicSession.save();
    }

    // Handle updating session name/years
    if (body.name || body.startYear || body.endYear) {
      if (body.name) academicSession.name = body.name;
      if (body.startYear) academicSession.startYear = body.startYear;
      if (body.endYear) academicSession.endYear = body.endYear;
      await academicSession.save();
    }

    const updated = await SessionModel.findById(id).populate("terms").lean();
    return NextResponse.json({ success: true, data: updated! });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
