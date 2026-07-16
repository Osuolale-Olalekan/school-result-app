import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdmissionInquiryModel from "@/models/AdmissionInquiry";
import { sendWhatsAppMessage, normalizePhone } from "@/lib/whatsapp";
import type { ApiResponse } from "@/types";

const ADMIN_WHATSAPP_NUMBER = normalizePhone(process.env.ADMIN_WHATSAPP_NUMBER ?? "08147445983");

interface AdmissionInquiryPayload {
  parentName: string;
  phone: string;
  email?: string;
  childName: string;
  classApplying: string;
  message?: string;
}

function validate(body: Partial<AdmissionInquiryPayload>): string | null {
  if (!body.parentName?.trim()) return "Parent/guardian name is required";
  if (!body.phone?.trim()) return "Phone number is required";
  if (!body.childName?.trim()) return "Child's name is required";
  if (!body.classApplying?.trim()) return "Class applying for is required";
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const body = (await request.json()) as Partial<AdmissionInquiryPayload>;

    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    await connectDB();

    const inquiry = await AdmissionInquiryModel.create({
      parentName: body.parentName!.trim(),
      phone: body.phone!.trim(),
      email: body.email?.trim() || undefined,
      childName: body.childName!.trim(),
      classApplying: body.classApplying!.trim(),
      message: body.message?.trim() || undefined,
    });

    // Best-effort WhatsApp ping — a failure here should never fail the
    // request, since the inquiry is already saved in the database.
    try {
      const summary = [
        `New admission inquiry received.`,
        `Parent: ${inquiry.parentName}`,
        `Phone: ${inquiry.phone}`,
        inquiry.email ? `Email: ${inquiry.email}` : null,
        `Child: ${inquiry.childName}`,
        `Class: ${inquiry.classApplying}`,
        inquiry.message ? `Note: ${inquiry.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const result = await sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, "Admissions Team", summary);
      if (result.success) {
        inquiry.whatsappNotified = true;
        await inquiry.save();
      }
    } catch (err) {
      console.error("WhatsApp notify failed (non-fatal):", err);
    }

    return NextResponse.json({ success: true, data: { id: inquiry._id.toString() } }, { status: 201 });
  } catch (err) {
    console.error("Admissions POST failed:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}