// app/api/admin/assignments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import AssignmentModel from "@/models/Assignment";
import { AuditAction, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";

// ─── GET /api/admin/assignments ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page")  ?? "1");
    const limit    = parseInt(searchParams.get("limit") ?? "15");
    const status   = searchParams.get("status");
    const classId  = searchParams.get("classId");

    const query: Record<string, unknown> = {};
    if (status)  query.status  = status;
    if (classId) query.classId = classId;

    const total       = await AssignmentModel.countDocuments(query);
    const assignments = await AssignmentModel.find(query)
      .populate("classId",   "name section")
      .populate("subjectId", "name")
      .populate("createdBy", "firstName surname")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: assignments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/assignments ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      title:        string;
      description?: string;
      classId:      string;
      subjectId?:   string;
      dueDate:      string;
      maxScore?:    number;
      attachments?: string[];
      status?:      "draft" | "published";
    };

    const { title, description, classId, subjectId, dueDate, maxScore, attachments, status } = body;

    if (!title?.trim() || !classId || !dueDate) {
      return NextResponse.json({ success: false, error: "Title, class and due date are required" }, { status: 400 });
    }

    const assignment = await AssignmentModel.create({
      title:       title.trim(),
      description: description?.trim(),
      classId,
      subjectId:   subjectId || undefined,
      createdBy:   session.user.id,
      dueDate:     new Date(dueDate),
      maxScore:    maxScore ?? 100,
      attachments: attachments ?? [],
      status:      status ?? "draft",
    });

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.CREATE,
      entity:      "Assignment",
      entityId:    assignment._id.toString(),
      description: `Created assignment "${title.trim()}"`,
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}