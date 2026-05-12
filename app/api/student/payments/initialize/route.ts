import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import UserModel from "@/models/User";
import { PaymentStatus, UserRole } from "@/types/enums";
import {
  initializePaystackPayment,
  generatePaymentReference,
} from "@/lib/paystack";
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

    const { sessionId, termId } = (await request.json()) as {
      sessionId: string;
      termId: string;
    };

    const studentId = session.user.id;
    const REPORT_CARD_FEE = 1000;

    // Fetch student email for Paystack
    const student = await UserModel.findById(studentId)
      .select("email surname firstName")
      .lean() as { email: string; surname: string; firstName: string } | null;

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    // Check if already paid
    const existing = await PaymentRecordModel.findOne({
      student: studentId,
      session: sessionId,
      term: termId,
      type: "report_card",
      status: PaymentStatus.PAID,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Report card already paid for this term" },
        { status: 400 },
      );
    }

    const reference = generatePaymentReference(studentId, `${termId}-report_card`);

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/reports?verified=1`;

    const paystackData = await initializePaystackPayment({
      email: student.email,
      amount: REPORT_CARD_FEE * 100, // kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        studentId,
        sessionId,
        termId,
        type: "report_card",
        paidBy: "student",
      },
    });

    // Save/update pending payment record
    await PaymentRecordModel.findOneAndUpdate(
      {
        student: studentId,
        session: sessionId,
        term: termId,
        type: "report_card",
      },
      {
        $setOnInsert: {
          student: studentId,
          session: sessionId,
          term: termId,
          type: "report_card",
        },
        $set: {
          status: PaymentStatus.UNPAID,
          paystackReference: reference,
          paystackAccessCode: paystackData.access_code,
          paymentMethod: "paystack",
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
        reference,
      },
    });
  } catch (error) {
    console.error("Student initialize payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}