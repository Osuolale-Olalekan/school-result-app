// app/api/debug-paystack/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "NOT SET";
  return NextResponse.json({
    prefix: key.slice(0, 10),
    isLive: key.startsWith("sk_live_"),
  });
}