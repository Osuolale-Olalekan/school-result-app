import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/types/enums";

const PUBLIC_ROUTES = ["/", "/sign-in", "/forgot-password", "/reset-password"];
const ADMIN_ROUTES = ["/admin"];
const TEACHER_ROUTES = ["/teacher"];
const PARENT_ROUTES = ["/parent"];
const STUDENT_ROUTES = ["/student"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Allow public routes and API routes
  if (
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "?")) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users
  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ── Check if user is still active in DB ──────────────────────────
  // Only runs on page navigations, not API calls (those are excluded above)
  try {
    const baseUrl = req.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/auth/check-status`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    if (res.status === 403) {
      // User suspended or deleted — clear session and redirect
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("error", "AccountSuspended");
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    // If check fails (e.g. network error), allow through — don't lock out users
  }
  // ─────────────────────────────────────────────────────────────────

  const activeRole = token.activeRole as UserRole;

  // Role-based access control
  if (activeRole !== UserRole.ADMIN && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (activeRole !== UserRole.TEACHER && TEACHER_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (activeRole !== UserRole.PARENT && PARENT_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (activeRole !== UserRole.STUDENT && STUDENT_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};

// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { UserRole } from "@/types/enums";

// const PUBLIC_ROUTES = ["/", "/sign-in", "/forgot-password", "/reset-password"];
// const ADMIN_ROUTES = ["/admin"];
// const TEACHER_ROUTES = ["/teacher"];
// const PARENT_ROUTES = ["/parent"];
// const STUDENT_ROUTES = ["/student"];

// export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: UserRole } } | null }) {
//   const { pathname } = req.nextUrl;

//   // Allow public routes and API routes
//   if (
//     PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "?")) ||
//     pathname.startsWith("/api") ||
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/favicon")
//   ) {
//     return NextResponse.next();
//   }

//   const userSession = req.auth;

//   // Redirect unauthenticated users
//   if (!userSession?.user) {
//     const signInUrl = new URL("/sign-in", req.url);
//     signInUrl.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(signInUrl);
//   }

//   const role = userSession.user.role;

//   // Role-based access control
//   if (role !== UserRole.ADMIN && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL("/dashboard", req.url));
//   }

//   if (role !== UserRole.TEACHER && TEACHER_ROUTES.some((r) => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL("/dashboard", req.url));
//   }

//   if (role !== UserRole.PARENT && PARENT_ROUTES.some((r) => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL("/dashboard", req.url));
//   }

//   if (role !== UserRole.STUDENT && STUDENT_ROUTES.some((r) => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL("/dashboard", req.url));
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };
