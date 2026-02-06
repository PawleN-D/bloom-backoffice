import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  if (!SERVER_API_BASE_URL) {
    return NextResponse.json(
      { message: "Server API base URL not configured." },
      { status: 500 }
    );
  }

  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const targetUrl = `${SERVER_API_BASE_URL}/api/backoffice/${pathSegments.join("/")}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  headers.set("authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params?: Promise<{ path?: string[] }> };

async function getPathSegments(context: RouteContext) {
  const params = await context.params;
  return params?.path ?? [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, await getPathSegments(context));
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, await getPathSegments(context));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, await getPathSegments(context));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, await getPathSegments(context));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, await getPathSegments(context));
}
