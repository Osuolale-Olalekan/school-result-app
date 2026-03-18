// ─── app/api/admin/outstanding-balances/route.ts ─────────────────────────────
// Admin: GET summary of unpaid/partial payments grouped by class

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import FeeStructureModel from "@/models/FeeStructure";
import { PaymentStatus, UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");

    if (!sessionId || !termId) {
      return NextResponse.json(
        { success: false, error: "Session and term are required" },
        { status: 400 }
      );
    }

    // Get all payment records for this session/term
    const payments = await PaymentRecordModel.find({
      session: sessionId,
      term:    termId,
      type:    "school_fees",
    })
      .populate({
        path:     "student",
        select:   "surname firstName admissionNumber currentClass",
        populate: { path: "currentClass", select: "name section" },
      })
      .lean();

    // Get fee structures to know expected amounts
    const feeStructures = await FeeStructureModel.find({
      sessionId,
      termId,
    })
      .populate("classId", "name section")
      .lean();

    const feeMap = new Map(
      feeStructures.map((fs) => [
        fs.classId?.toString(),
        fs.items.reduce((sum, item) => sum + (item.isCompulsory ? item.amount : 0), 0),
      ])
    );

    // Group by class
    const classMap = new Map<string, {
      className:   string;
      classId:     string;
      total:       number;
      paid:        number;
      unpaid:      number;
      partial:     number;
      totalOwed:   number;
      students:    Array<{
        _id:             string;
        name:            string;
        admissionNumber: string;
        status:          string;
        amountPaid?:     number;
        amountOwed:      number;
      }>;
    }>();

    for (const p of payments) {
      const student = p.student as unknown as {
        _id: { toString(): string };
        surname: string;
        firstName: string;
        admissionNumber: string;
        currentClass?: { _id: { toString(): string }; name: string };
      };

      if (!student?.currentClass) continue;

      const classId   = student.currentClass._id.toString();
      const className = student.currentClass.name;
      const expected  = feeMap.get(classId) ?? 0;
      const paid      = p.amount ?? 0;
      const owed      = Math.max(0, expected - paid);

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          className,
          classId,
          total:     0,
          paid:      0,
          unpaid:    0,
          partial:   0,
          totalOwed: 0,
          students:  [],
        });
      }

      const group = classMap.get(classId)!;
      group.total++;
      if (p.status === PaymentStatus.PAID)    group.paid++;
      if (p.status === PaymentStatus.UNPAID)  group.unpaid++;
      if (p.status === PaymentStatus.PARTIAL) group.partial++;
      if (p.status !== PaymentStatus.PAID)    group.totalOwed += owed;

      if (p.status !== PaymentStatus.PAID) {
        group.students.push({
          _id:             student._id.toString(),
          name:            `${student.surname} ${student.firstName}`,
          admissionNumber: student.admissionNumber,
          status:          p.status,
          amountPaid:      p.amount,
          amountOwed:      owed,
        });
      }
    }

    const summary = Array.from(classMap.values()).sort((a, b) =>
      a.className.localeCompare(b.className)
    );

    return NextResponse.json({ success: true, data: summary });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}