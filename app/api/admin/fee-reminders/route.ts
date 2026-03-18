// app/api/admin/fee-reminders/route.ts
// POST — send fee reminder notifications to parents of unpaid students

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import { createBulkNotifications } from "@/lib/notifications";
import { NotificationType, PaymentStatus, UserRole } from "@/types/enums";
import { createAuditLog } from "@/lib/audit";
import { AuditAction } from "@/types/enums";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json() as {
      sessionId:   string;
      termId:      string;
      classId?:    string;
      studentIds?: string[];  // optional: target specific students
      message?:    string;    // optional custom message
    };

    const { sessionId, termId, classId, studentIds, message } = body;

    if (!sessionId || !termId) {
      return NextResponse.json(
        { success: false, error: "Session and term are required" },
        { status: 400 }
      );
    }

    // Find unpaid/partial school fees records
    const query: Record<string, unknown> = {
      session: sessionId,
      term:    termId,
      type:    "school_fees",
      status:  { $in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
    };
    if (studentIds?.length) query.student = { $in: studentIds };

    const unpaidRecords = await PaymentRecordModel.find(query)
      .populate({
        path:     "student",
        select:   "surname firstName currentClass parents",
        populate: { path: "currentClass", select: "name" },
      })
      .populate("term",    "name")
      .populate("session", "name")
      .lean();

    if (unpaidRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "No unpaid fee records found" },
        { status: 404 }
      );
    }

    // Filter by class if provided
    const filtered = classId
      ? unpaidRecords.filter((r) => {
          const student = r.student as { currentClass?: { _id: { toString(): string } } };
          return student?.currentClass?._id?.toString() === classId;
        })
      : unpaidRecords;

    // Collect all parent IDs
    const StudentModel = (await import("@/models/Student")).default;
    const notifications: Array<{
      recipientId:   string;
      recipientRole: UserRole;
      type:          NotificationType;
      title:         string;
      message:       string;
      link:          string;
    }> = [];

    for (const record of filtered) {
      const student = record.student as unknown as {
        _id: { toString(): string };
        surname: string;
        firstName: string;
        currentClass?: { name: string };
      };

      const studentDoc = await StudentModel.findById(
        student._id.toString(),
        { parents: 1 }
      ).lean();

      if (!studentDoc?.parents?.length) continue;

      const termName    = typeof record.term    === "object" ? (record.term as unknown as { name: string }).name    : "";
      const sessionName = typeof record.session === "object" ? (record.session as unknown as { name: string }).name : "";
      const studentName = `${student.surname} ${student.firstName}`;
      const statusLabel = record.status === PaymentStatus.PARTIAL ? "partially paid" : "unpaid";

      const notifMessage = message?.trim()
        || `School fees for ${studentName} (${student.currentClass?.name ?? ""}) for ${termName} term, ${sessionName} are ${statusLabel}. Please make payment as soon as possible.`;

      for (const parentId of studentDoc.parents) {
        notifications.push({
          recipientId:   String(parentId),
          recipientRole: UserRole.PARENT,
          type:          NotificationType.GENERAL,
          title:         `Fee Reminder — ${studentName}`,
          message:       notifMessage,
          link:          `/parent/payments`,
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json(
        { success: false, error: "No parents found to notify" },
        { status: 404 }
      );
    }

    await createBulkNotifications(notifications);

    await createAuditLog({
      actorId:     session.user.id,
      actorName:   `${session.user.firstName} ${session.user.surname}`,
      actorRole:   UserRole.ADMIN,
      action:      AuditAction.CREATE,
      entity:      "FeeReminder",
      entityId:    sessionId,
      description: `Sent fee reminders to ${notifications.length} parent(s) for ${filtered.length} student(s)`,
    });

    return NextResponse.json({
      success: true,
      message: `Fee reminders sent to ${notifications.length} parent(s) for ${filtered.length} student(s)`,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}