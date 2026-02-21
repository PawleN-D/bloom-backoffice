import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthResponse, getAuthCookieOptions, AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";
import type { AuthResponse } from "@/types";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      { message: "Server API base URL not configured." },
      { status: 500 }
    );
  }

  const requestPayload = await request.json();
  const backendLoginUrl = new URL("/api/auth/login", SERVER_API_BASE_URL).toString();
  const requestUrl = new URL(request.url);

  if (new URL(backendLoginUrl).origin === requestUrl.origin) {
    return NextResponse.json(
      {
        message:
          "Auth API base URL points to this app. Set BACKEND_API_BASE_URL to your backend service URL.",
      },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(backendLoginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Auth API request timed out at ${SERVER_API_BASE_URL}.`
        : `Unable to reach auth API at ${SERVER_API_BASE_URL}. ${
            error instanceof Error ? error.message : "Unknown network error"
          }`;

    const detail = error instanceof Error ? error.message : "Unknown network error";
    return NextResponse.json({ message, detail }, { status: 502 });
  } finally {
    clearTimeout(timeoutHandle);
  }

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
  const host = request.headers.get("host") ?? undefined;
  cookieStore.set(AUTH_COOKIE_NAME, auth.token, getAuthCookieOptions(host));

  return NextResponse.json(buildAuthResponse(auth.user));
}
