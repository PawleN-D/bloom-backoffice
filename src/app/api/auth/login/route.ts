import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthResponse, getAuthCookieOptions, AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";
import type { AuthResponse } from "@/types";

export async function POST(request: Request) {
  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      { message: "Server API base URL not configured." },
      { status: 500 }
    );
  }

  const requestPayload = await request.json();
  const response = await fetch(`${SERVER_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Invalid credentials.";
    try {
      const errorPayload = (await response.json()) as { error?: string; message?: string };
      message = errorPayload.error ?? errorPayload.message ?? message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    return NextResponse.json({ message }, { status: response.status });
  }

  const responsePayload = (await response.json()) as { data?: AuthResponse } | AuthResponse;
  const auth =
    (responsePayload as { data?: AuthResponse }).data ?? (responsePayload as AuthResponse);
  if (!auth?.token || !auth?.user) {
    return NextResponse.json({ message: "Invalid login response." }, { status: 502 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, auth.token, getAuthCookieOptions());

  return NextResponse.json(buildAuthResponse(auth.user));
}
