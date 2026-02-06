import { ORG_DOMAIN } from "@/lib/config";

const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "mail",
  "backoffice",
  "dashboard",
];

export function generateSubdomain(organizationName: string): string {
  return organizationName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 63);
}

export function isValidSubdomain(subdomain: string): boolean {
  const normalized = subdomain.toLowerCase().trim();
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  if (!subdomainRegex.test(normalized)) {
    return false;
  }
  return !RESERVED_SUBDOMAINS.includes(normalized);
}

export function getOrganizationUrl(subdomain: string): string {
  const normalized = subdomain.toLowerCase().trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/+$/, "")}/${normalized}`;
  }

  return `https://${normalized}.${ORG_DOMAIN}`;
}
