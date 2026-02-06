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

  const payload = await request.json();
  const response = await fetch(`${SERVER_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json(
      { message: message || "Invalid credentials." },
      { status: response.status }
    );
  }

  const data = (await response.json()) as AuthResponse;
  cookies().set(AUTH_COOKIE_NAME, data.token, getAuthCookieOptions());

  return NextResponse.json(buildAuthResponse(data.user));
}
