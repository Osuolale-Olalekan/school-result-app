// app/api/parent/payments/initialize/route.ts
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
  console.log("🔥 PAYMENT ROUTE HIT"); // ← very first line
  console.log("SK:", process.env.PAYSTACK_SECRET_KEY?.substring(0, 15));
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    console.log(
      "SK starts with:",
      process.env.PAYSTACK_SECRET_KEY?.substring(0, 15),
    );
    console.log("SK length:", process.env.PAYSTACK_SECRET_KEY?.length);

    const { studentId, sessionId, termId, amount } = (await request.json()) as {
      studentId: string;
      sessionId: string;
      termId: string;
      amount: number;
    };

    // Verify parent has access to this student
    const parent = (await UserModel.findById(session.user.id).lean()) as {
      email: string;
      surname: string;
      firstName: string;
      children?: Array<{ toString(): string }>;
    } | null;

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found" },
        { status: 404 },
      );
    }

    const hasAccess =
      parent.children?.some((c) => c.toString() === studentId) ?? false;
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
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

    const reference = generatePaymentReference(studentId, termId);

    // Initialize with Paystack
    const paystackData = await initializePaystackPayment({
      email: parent.email,
      amount: amount * 100, // convert to kobo
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/reports?studentId=${studentId}`,
      metadata: {
        studentId,
        sessionId,
        termId,
        parentId: session.user.id,
        type: "report_card",
      },
    });

    // Save pending payment record
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
    console.error("Initialize payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
