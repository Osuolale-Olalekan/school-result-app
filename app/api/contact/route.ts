import { NextRequest, NextResponse } from "next/server";
import { sendContactMessageEmail } from "@/lib/email";
import type { ApiResponse } from "@/types";

interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

function validate(body: Partial<ContactPayload>): string | null {
  if (!body.name?.trim()) return "Your name is required";
  if (!body.email?.trim()) return "Your email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return "Enter a valid email address";
  if (!body.message?.trim()) return "A message is required";
  return null;
}

// ─── POST /api/contact ────────────────────────────────────────────────────────
// Public endpoint — no auth, since site visitors aren't logged in.
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  let body: Partial<ContactPayload>;
  try {
    body = (await request.json()) as Partial<ContactPayload>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const data = body as ContactPayload;

  // Note: sendEmail() in lib/email.ts intentionally swallows send failures
  // (logs to console, doesn't throw) so this route can't distinguish "sent"
  // from "silently failed to send" — that's a deliberate tradeoff already
  // baked into your email service, not something this route adds. Check
  // your server console/logs if a message doesn't arrive.
  await sendContactMessageEmail(
    data.name.trim(),
    data.email.trim(),
    data.subject?.trim() || "Website Inquiry",
    data.message.trim()
  );

  return NextResponse.json({ success: true, data: null }, { status: 200 });
}