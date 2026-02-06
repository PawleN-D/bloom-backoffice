import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { isPagesDevHost, resolveTenant, stripTenantFromPathname } from "@/lib/tenant";

const PUBLIC_PATHS = new Set(["/login"]);
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/assets", "/static"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const tenant = resolveTenant({ host, pathname });
  const pagesDev = isPagesDevHost(host);

  let normalizedPathname = pathname;
  let shouldRewrite = false;
  if (tenant && pagesDev) {
    const stripped = stripTenantFromPathname(pathname, tenant);
    if (stripped !== pathname) {
      normalizedPathname = stripped;
      shouldRewrite = true;
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (tenant) {
    requestHeaders.set("x-tenant", tenant);
  }

  const nextUrl = request.nextUrl.clone();
  if (shouldRewrite) {
    nextUrl.pathname = normalizedPathname;
  }

  const forward = () =>
    shouldRewrite
      ? NextResponse.rewrite(nextUrl, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  if (!tenant) {
    return forward();
  }

  if (normalizedPathname.startsWith("/api")) {
    return forward();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const loginPath = pagesDev && tenant ? `/${tenant}/login` : "/login";
  const dashboardPath = pagesDev && tenant ? `/${tenant}/dashboard` : "/dashboard";

  if (PUBLIC_PATHS.has(normalizedPathname)) {
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
