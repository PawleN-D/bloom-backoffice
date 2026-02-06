import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/authCookies";

export const runtime = "edge";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const host = request.headers.get("host") ?? undefined;
  cookieStore.set(AUTH_COOKIE_NAME, "", { ...getAuthCookieOptions(host), maxAge: 0 });
  return NextResponse.json({ ok: true });
}
