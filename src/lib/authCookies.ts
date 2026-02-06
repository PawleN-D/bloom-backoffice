import type { BackOfficeUser } from "@/types";

export const AUTH_COOKIE_NAME = "bloom_backoffice_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;

function normalizeHost(host?: string | null) {
  if (!host) return "";
  return host.toLowerCase().split(":")[0];
}

function shouldSkipDomain(host?: string | null) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return true;
  if (normalizedHost === "localhost" || normalizedHost === "127.0.0.1") return true;
  return normalizedHost.endsWith(".pages.dev");
}

export function getAuthCookieOptions(host?: string | null) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };

  if (process.env.AUTH_COOKIE_DOMAIN && !shouldSkipDomain(host)) {
    return { ...base, domain: process.env.AUTH_COOKIE_DOMAIN };
  }

  return base;
}

export function buildAuthResponse(user: BackOfficeUser) {
  return { user };
}
