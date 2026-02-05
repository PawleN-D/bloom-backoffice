import type { BackOfficeUser } from "@/types";

export const AUTH_COOKIE_NAME = "bloom_backoffice_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;

export function getAuthCookieOptions() {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };

  if (process.env.AUTH_COOKIE_DOMAIN) {
    return { ...base, domain: process.env.AUTH_COOKIE_DOMAIN };
  }

  return base;
}

export function buildAuthResponse(user: BackOfficeUser) {
  return { user };
}
