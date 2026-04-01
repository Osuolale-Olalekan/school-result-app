import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/types/enums";

const PUBLIC_ROUTES = ["/", "/sign-in", "/forgot-password", "/reset-password"];
const ADMIN_ROUTES = ["/admin"];
const TEACHER_ROUTES = ["/teacher"];
const PARENT_ROUTES = ["/parent"];
const STUDENT_ROUTES = ["/student"];

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_RULES: { pattern: string; limit: number; windowMs: number }[] = [
  { pattern: "/api/auth",           limit: 10,  windowMs: 60_000  }, // 10 login attempts/min
  { pattern: "/api/admin",          limit: 100, windowMs: 60_000  }, // 100 admin API calls/min
  { pattern: "/api/",               limit: 200, windowMs: 60_000  }, // 200 general API calls/min
];

function getRateLimit(pathname: string) {
  return RATE_LIMIT_RULES.find((r) => pathname.startsWith(r.pattern));
}

function isRateLimited(ip: string, pathname: string): boolean {
  const rule = getRateLimit(pathname);
  if (!rule) return false;

  const key     = `${ip}:${rule.pattern}`;
  const now     = Date.now();
  const entry   = rateLimitMap.get(key);

  if (!entry || now - entry.lastReset > rule.windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return false;
  }

  entry.count++;
  if (entry.count > rule.limit) return true;

  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Rate limiting — only applies to API routes ────────────────────────────
  if (pathname.startsWith("/api")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
  try {
    const baseUrl = req.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/auth/check-status`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    if (res.status === 403) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("error", "AccountSuspended");
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    // If check fails, allow through
  }

  const activeRole = token.activeRole as UserRole;

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
