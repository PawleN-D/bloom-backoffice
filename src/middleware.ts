import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";

const PUBLIC_PATHS = new Set(["/login"]);
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/assets", "/static"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const forward = () => NextResponse.next();

  if (pathname.startsWith("/api")) {
    return forward();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const loginPath = "/login";
  const dashboardPath = "/dashboard";

  if (PUBLIC_PATHS.has(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return forward();
  }

  if (!token) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return forward();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|static).*)"],
};
