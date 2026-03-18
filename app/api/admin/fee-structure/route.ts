// ─── app/api/admin/fee-structure/route.ts ────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import FeeStructureModel from "@/models/FeeStructure";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId   = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    const query: Record<string, unknown> = {};
    if (classId)   query.classId   = classId;
    if (sessionId) query.sessionId = sessionId;
    if (termId)    query.termId    = termId;

    const structures = await FeeStructureModel.find(query)
      .populate("classId",   "name section")
      .populate("sessionId", "name")
      .populate("termId",    "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: structures });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      classId:   string;
      sessionId: string;
      termId:    string;
      items:     Array<{
        feeType:     string;
        label:       string;
        amount:      number;
        isCompulsory?: boolean;
      }>;
    };

    const { classId, sessionId, termId, items } = body;

    if (!classId || !sessionId || !termId) {
      return NextResponse.json(
        { success: false, error: "Class, session and term are required" },
        { status: 400 }
      );
    }

    if (!items?.length) {
      return NextResponse.json(
        { success: false, error: "At least one fee item is required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await FeeStructureModel.findOne({ classId, sessionId, termId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A fee structure already exists for this class and term. Edit it instead." },
        { status: 409 }
      );
    }

    const structure = await FeeStructureModel.create({
      classId,
      sessionId,
      termId,
      items,
      createdBy: session.user.id,
    });

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.CREATE,
      entity:      "FeeStructure",
      entityId:    structure._id.toString(),
      description: `Created fee structure for class ${classId}`,
    });

    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}