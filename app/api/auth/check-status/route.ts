import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { UserStatus } from "@/types/enums";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("status").lean();
    const typedUser = user as { status: UserStatus } | null;

    if (!typedUser || typedUser.status !== UserStatus.ACTIVE) {
      return NextResponse.json({ ok: false, reason: "suspended" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // On DB error, return 200 so users aren't locked out
    return NextResponse.json({ ok: true });
  }
}