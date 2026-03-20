// app/api/sessions/route.ts — public, any logged-in user
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SessionModel } from "@/models/Session";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const sessions = await SessionModel.find()
    .populate("terms")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, data: sessions });
}