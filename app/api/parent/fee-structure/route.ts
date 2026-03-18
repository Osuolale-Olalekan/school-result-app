// ─── app/api/parent/fee-structure/route.ts ───────────────────────────────────
// Parent: GET fee structures for their children's classes

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import FeeStructureModel from "@/models/FeeStructure";
import PaymentRecordModel from "@/models/PaymentRecord";
import { PaymentStatus, UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const UserModel    = (await import("@/models/User")).default;
    const StudentModel = (await import("@/models/Student")).default;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const termId    = searchParams.get("termId");
    const childId   = searchParams.get("childId");

    const parent = await UserModel.findById(session.user.id, { children: 1 }).lean();
    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = childId
      ? [childId]
      : parent.children.map((c: unknown) => String(c));

    const children = await StudentModel.find(
      { _id: { $in: childIds } },
      { currentClass: 1 }
    ).lean();

    const UserModelForNames = (await import("@/models/User")).default;
    const childNames = await UserModelForNames.find(
      { _id: { $in: childIds } },
      { firstName: 1, surname: 1 }
    ).lean();

    const nameMap = new Map(
      childNames.map((u) => [u._id.toString(), { firstName: u.firstName, surname: u.surname }])
    );

    const results = await Promise.all(
      children.map(async (child) => {
        const query: Record<string, unknown> = { classId: child.currentClass };
        if (sessionId) query.sessionId = sessionId;
        if (termId)    query.termId    = termId;

        const feeStructure = await FeeStructureModel.findOne(query)
          .populate("classId",   "name section")
          .populate("sessionId", "name")
          .populate("termId",    "name")
          .lean();

        // Get payment status for this child
        const paymentQuery: Record<string, unknown> = {
          student: child._id,
          type:    "school_fees",
        };
        if (sessionId) paymentQuery.session = sessionId;
        if (termId)    paymentQuery.term    = termId;

        const payment = await PaymentRecordModel.findOne(paymentQuery).lean();

        const names = nameMap.get(child._id.toString());

        return {
          child: {
            _id:       child._id,
            firstName: names?.firstName ?? "",
            surname:   names?.surname   ?? "",
            classId:   child.currentClass,
          },
          feeStructure: feeStructure ?? null,
          payment: payment
            ? {
                status:    payment.status,
                amount:    payment.amount,
                paidAt:    payment.paidAt,
                method:    payment.paymentMethod,
              }
            : null,
          totalDue: feeStructure
            ? feeStructure.items
                .filter((i) => i.isCompulsory)
                .reduce((sum, i) => sum + i.amount, 0)
            : 0,
          amountPaid:    payment?.amount ?? 0,
          paymentStatus: payment?.status ?? PaymentStatus.UNPAID,
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}