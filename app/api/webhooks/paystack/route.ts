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
      metadata: {
        studentId: string;
        sessionId: string;
        termId: string;
        type: string;
      };
    };
  };

  if (event.event === "charge.success") {
    try {
      await connectDB();

      const { reference, amount, metadata } = event.data;
      const { studentId, sessionId, termId, type } = metadata;

      // Mark the payment record as paid for EVERY payment type
      // (school_fees and report_card)
      // await PaymentRecordModel.findOneAndUpdate(
      //   { paystackReference: reference },
      //   {
      //     $set: {
      //       status: PaymentStatus.PAID,
      //       amount: amount / 100,
      //       paidAt: new Date(),
      //       paymentMethod: "paystack",
      //     },
      //   },
      // );

            await PaymentRecordModel.findOneAndUpdate(
        { student: studentId, session: sessionId, term: termId, type },
        {
          $set: {
            status: PaymentStatus.PAID,
            amount: amount / 100,
            paidAt: new Date(),
            paymentMethod: "paystack",
            paystackReference: reference,
          },
        },
        { upsert: true },
      );

      // Only report card payments unlock the report card
      if (type === "report_card") {
        await ReportCardModel.findOneAndUpdate(
          { student: studentId, session: sessionId, term: termId },
          {
            $set: { paymentStatus: PaymentStatus.PAID, paidAt: new Date() },
          },
        );
      }
    // } catch (error) {
    //   console.error("Webhook processing error:", error);
    // }
        } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}