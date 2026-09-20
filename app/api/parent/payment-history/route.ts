// ─── app/api/parent/payment-history/route.ts ─────────────────────────────────
// Parent: GET all payment records for their children

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import { UserRole } from "@/types/enums";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const UserModel = (await import("@/models/User")).default;
    const parent    = await UserModel.findById(session.user.id, { children: 1 }).lean();

    if (!parent?.children?.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = parent.children.map((c: unknown) => String(c));

    const payments = await PaymentRecordModel.find({
      student: { $in: childIds },
    })
      .populate("session", "name")
      .populate("term",    "name")
      .populate("student", "firstName surname admissionNumber")
      .sort({ createdAt: -1 })
      .lean();

    // Only return paid records in history
    // const paid = payments.filter((p) => p.status === "paid" || p.amount);
    const paid = payments.filter((p) => p.status === "paid");

    return NextResponse.json({ success: true, data: paid });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
