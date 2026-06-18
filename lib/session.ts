
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export const getSession = cache(async () => {
  return await getServerSession(authConfig);
});