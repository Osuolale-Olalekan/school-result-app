// app/api/admin/fee-structure/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import FeeStructureModel, { IFeeLineItem } from "@/models/FeeStructure";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const structure = await FeeStructureModel.findById(id)
      .populate("classId",   "name section")
      .populate("sessionId", "name")
      .populate("termId",    "name")
      .lean();

    if (!structure) {
      return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: structure });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const structure = await FeeStructureModel.findById(id);
    if (!structure) {
      return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
    }

    const body = await request.json() as { items: IFeeLineItem[] };

    if (!Array.isArray(body.items) || !body.items.length) {
      return NextResponse.json(
        { success: false, error: "At least one fee item is required" },
        { status: 400 }
      );
    }

    structure.items = body.items;
    await structure.save();

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.UPDATE,
      entity:      "FeeStructure",
      entityId:    id,
      description: `Updated fee structure items`,
    });

    return NextResponse.json({ success: true, data: structure });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const structure = await FeeStructureModel.findByIdAndDelete(id);
    if (!structure) {
      return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
    }

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.DELETE,
      entity:      "FeeStructure",
      entityId:    id,
      description: `Deleted fee structure`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}