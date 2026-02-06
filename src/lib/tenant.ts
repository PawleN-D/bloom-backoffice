export type TenantResolutionInput = {
  host?: string | null;
  pathname?: string | null;
};

const PAGES_DEV_SUFFIX = ".pages.dev";
const RESERVED_PATH_SEGMENTS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "assets",
  "static",
]);

function normalizeHost(host?: string | null) {
  if (!host) return "";
  return host.toLowerCase().split(":")[0];
}

function firstPathSegment(pathname?: string | null) {
  if (!pathname) return "";
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? "";
}

export function isPagesDevHost(host?: string | null) {
  const normalized = normalizeHost(host);
  return normalized.endsWith(PAGES_DEV_SUFFIX);
}

export function resolveTenant({ host, pathname }: TenantResolutionInput): string | null {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;

  if (!isPagesDevHost(normalizedHost)) {
    const labels = normalizedHost.split(".");
    if (labels.length < 3) return null;
    return labels[0] || null;
  }

  const segment = firstPathSegment(pathname);
  if (!segment || RESERVED_PATH_SEGMENTS.has(segment)) {
    return null;
  }
  return segment;
}

export function stripTenantFromPathname(pathname: string, tenant: string): string {
  const prefix = `/${tenant}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length);
  }
  return pathname;
}

export function resolveTenantFromRequest(request: { headers: Headers; url: string }) {
  const headerTenant = request.headers.get("x-tenant");
  if (headerTenant) return headerTenant;
  const url = new URL(request.url);
  return resolveTenant({
    host: request.headers.get("host") ?? url.host,
    pathname: url.pathname,
  });
}

export function resolveTenantFromWindow() {
  if (typeof window === "undefined") return null;
  return resolveTenant({
    host: window.location.host,
    pathname: window.location.pathname,
  });
}
