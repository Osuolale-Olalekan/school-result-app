// app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import "@/lib/registerModels";
import PaymentRecordModel from "@/models/PaymentRecord";
import ReportCardModel from "@/models/ReportCard";
import { PaymentStatus } from "@/types/enums";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      reference: string;
      status: string;
      amount: number;
      metadata: { studentId: string; sessionId: string; termId: string; type: string };
    };
  };

  if (event.event === "charge.success") {
    try {
      await connectDB();

      const { reference, amount, metadata } = event.data;
      const { studentId, sessionId, termId, type } = metadata;

      if (type === "report_card") {
        // Update payment record
        await PaymentRecordModel.findOneAndUpdate(
          { paystackReference: reference },
          {
            status: PaymentStatus.PAID,
            amount: amount / 100,
            paidAt: new Date(),
            paymentMethod: "paystack",
          }
        );

        // Unlock report card
        await ReportCardModel.findOneAndUpdate(
          { student: studentId, session: sessionId, term: termId },
          {
            paymentStatus: PaymentStatus.PAID,
            paidAt: new Date(),
          }
        );
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  }

  return NextResponse.json({ received: true });
}