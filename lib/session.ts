import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getSession() {
  cookies(); // force Next.js to include cookies in the request
  return await getServerSession(authConfig);
}