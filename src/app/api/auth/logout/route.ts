import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/authCookies";

export async function POST() {
  cookies().set(AUTH_COOKIE_NAME, "", { ...getAuthCookieOptions(), maxAge: 0 });
  return NextResponse.json({ ok: true });
}
