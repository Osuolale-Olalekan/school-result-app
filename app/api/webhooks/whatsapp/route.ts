import { NextRequest, NextResponse } from "next/server";

// Meta calls this once when you set up the webhook
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta sends delivery statuses here
export async function POST(request: NextRequest) {
  const body = await request.json();
  const statuses =
    body?.entry?.[0]?.changes?.[0]?.value?.statuses ?? [];

  for (const s of statuses) {
    if (s.status === "failed") {
      console.error(
        "WhatsApp FAILED:",
        s.recipient_id,
        JSON.stringify(s.errors),
      );
    } else {
      console.log("WhatsApp status:", s.recipient_id, s.status);
    }
  }
  return NextResponse.json({ received: true });
}