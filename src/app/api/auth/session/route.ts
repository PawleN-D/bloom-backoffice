import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";
import type { BackOfficeUser } from "@/types";

export const runtime = "edge";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      { authenticated: false, message: "Server API base URL not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = (await response.json()) as { data?: BackOfficeUser } | BackOfficeUser;
    const user = (payload as { data?: BackOfficeUser }).data ?? (payload as BackOfficeUser);

    if (!user?.id) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
