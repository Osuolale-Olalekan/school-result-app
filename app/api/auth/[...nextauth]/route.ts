// import handler from "@/lib/auth";

// export { handler as GET, handler as POST };


// import { handlers } from "@/lib/auth";

// export const { GET, POST } = handlers;


// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };