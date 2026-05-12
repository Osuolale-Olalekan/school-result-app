import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import ReportCardModel from "@/models/ReportCard";
import { PaymentStatus, UserRole } from "@/types/enums";
import { verifyPaystackPayment } from "@/lib/paystack";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.STUDENT) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const { reference } = (await request.json()) as { reference: string };

    const paystackResult = await verifyPaystackPayment(reference);

    if (paystackResult.status !== "success") {
      return NextResponse.json(
        { success: false, error: "Payment was not successful" },
        { status: 400 },
      );
    }

    const { studentId, sessionId, termId, type = "report_card" } =
      paystackResult.metadata as {
        studentId: string;
        sessionId: string;
        termId: string;
        type?: "report_card" | "school_fees";
      };

    // Security: ensure the payment belongs to the logged-in student
    if (studentId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Payment does not belong to this student" },
        { status: 403 },
      );
    }

    await PaymentRecordModel.findOneAndUpdate(
      { paystackReference: reference },
      {
        status: PaymentStatus.PAID,
        amount: paystackResult.amount / 100,
        paidAt: new Date(),
        paymentMethod: "paystack",
      },
    );

    if (type === "report_card") {
      await ReportCardModel.findOneAndUpdate(
        { student: studentId, session: sessionId, term: termId },
        {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: { type, studentId, sessionId, termId },
    });
  } catch (error) {
    console.error("Student verify payment error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}