// app/api/parent/payments/initialize/route.ts
// Supports both "report_card" and "school_fees" payment types

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
import FeeStructureModel from "@/models/FeeStructure";
import StudentModel from "@/models/Student";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<object>>> {
  const session = await getSession();
  if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const {
      studentId,
      sessionId,
      termId,
      type = "report_card",
    } = (await request.json()) as {
      studentId: string;
      sessionId: string;
      termId: string;
      // amount:    number;
      type?: "report_card" | "school_fees";
    };

    const REPORT_CARD_FEE = 1000;
    let amount: number;

    if (type === "report_card") {
      amount = REPORT_CARD_FEE;
    } else if (type === "school_fees") {
      const student = await StudentModel.findById(studentId, {
        currentClass: 1,
      }).lean();
      if (!student) {
        return NextResponse.json(
          { success: false, error: "Student not found" },
          { status: 404 },
        );
      }

      const feeStructure = await FeeStructureModel.findOne({
        classId: student.currentClass,
        sessionId: sessionId,
        termId: termId,
      }).lean();

      if (!feeStructure) {
        return NextResponse.json(
          {
            success: false,
            error: "No fee structure found for this class and term",
          },
          { status: 404 },
        );
      }

      amount = feeStructure.items
        .filter((i) => i.isCompulsory)
        .reduce((sum, i) => sum + i.amount, 0);

      if (!amount) {
        return NextResponse.json(
          { success: false, error: "Fee amount could not be determined" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid payment type" },
        { status: 400 },
      );
    }

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

    // Check if already fully paid
    const existing = await PaymentRecordModel.findOne({
      student: studentId,
      session: sessionId,
      term: termId,
      type,
      status: PaymentStatus.PAID,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `${type === "report_card" ? "Report card" : "School fees"} already paid for this term`,
        },
        { status: 400 },
      );
    }

    const reference = generatePaymentReference(studentId, `${termId}-${type}`);

    // Callback URL based on type
    const callbackUrl =
      type === "report_card"
        ? `${process.env.NEXT_PUBLIC_APP_URL}/parent/reports?studentId=${studentId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/parent/payments?studentId=${studentId}&verified=1`;

    const paystackData = await initializePaystackPayment({
      email: parent.email,
      amount: amount * 100, // kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        studentId,
        sessionId,
        termId,
        parentId: session.user.id,
        type,
      },
    });

    // Save pending payment record
    await PaymentRecordModel.findOneAndUpdate(
      {
        student: studentId,
        session: sessionId,
        term: termId,
        type,
      },
      {
        $setOnInsert: {
          student: studentId,
          session: sessionId,
          term: termId,
          type,
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
//FORMER FILE, WORKING BUT THE ONE ABOVE HAS SCHOOL FEES ONLINE PAYMENT INSTEAD OF MANUAL METHOD
// // app/api/parent/payments/initialize/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getSession } from "@/lib/session";
// import { connectDB } from "@/lib/db";
// import "@/lib/registerModels";
// import PaymentRecordModel from "@/models/PaymentRecord";
// import UserModel from "@/models/User";
// import { PaymentStatus, UserRole } from "@/types/enums";
// import {
//   initializePaystackPayment,
//   generatePaymentReference,
// } from "@/lib/paystack";
// import type { ApiResponse } from "@/types";

// export async function POST(
//   request: NextRequest,
// ): Promise<NextResponse<ApiResponse<object>>> {

//   const session = await getSession();
//   if (!session?.user || session.user.activeRole !== UserRole.PARENT) {
//     return NextResponse.json(
//       { success: false, error: "Unauthorized" },
//       { status: 401 },
//     );
//   }

//   try {
//     await connectDB();
//    ;

//     const { studentId, sessionId, termId, amount } = (await request.json()) as {
//       studentId: string;
//       sessionId: string;
//       termId: string;
//       amount: number;
//     };

//     // Verify parent has access to this student
//     const parent = (await UserModel.findById(session.user.id).lean()) as {
//       email: string;
//       surname: string;
//       firstName: string;
//       children?: Array<{ toString(): string }>;
//     } | null;

//     if (!parent) {
//       return NextResponse.json(
//         { success: false, error: "Parent not found" },
//         { status: 404 },
//       );
//     }

//     const hasAccess =
//       parent.children?.some((c) => c.toString() === studentId) ?? false;
//     if (!hasAccess) {
//       return NextResponse.json(
//         { success: false, error: "Access denied" },
//         { status: 403 },
//       );
//     }

//     // Check if already paid
//     const existing = await PaymentRecordModel.findOne({
//       student: studentId,
//       session: sessionId,
//       term: termId,
//       type: "report_card",
//       status: PaymentStatus.PAID,
//     });

//     if (existing) {
//       return NextResponse.json(
//         { success: false, error: "Report card already paid for this term" },
//         { status: 400 },
//       );
//     }

//     const reference = generatePaymentReference(studentId, termId);

//     // Initialize with Paystack
//     const paystackData = await initializePaystackPayment({
//       email: parent.email,
//       amount: amount * 100, // convert to kobo
//       reference,
//       callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/reports?studentId=${studentId}`,
//       metadata: {
//         studentId,
//         sessionId,
//         termId,
//         parentId: session.user.id,
//         type: "report_card",
//       },
//     });

//     // Save pending payment record
//     await PaymentRecordModel.findOneAndUpdate(
//       {
//         student: studentId,
//         session: sessionId,
//         term: termId,
//         type: "report_card",
//       },
//       {
//         $setOnInsert: {
//           student: studentId,
//           session: sessionId,
//           term: termId,
//           type: "report_card",
//         },
//         $set: {
//           status: PaymentStatus.UNPAID,
//           paystackReference: reference,
//           paystackAccessCode: paystackData.access_code,
//           paymentMethod: "paystack",
//         },
//       },
//       { upsert: true, new: true },
//     );

//     return NextResponse.json({
//       success: true,
//       data: {
//         authorizationUrl: paystackData.authorization_url,
//         accessCode: paystackData.access_code,
//         reference,
//       },
//     });
//   } catch (error) {
//     console.error("Initialize payment error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 },
//     );
//   }
// }
