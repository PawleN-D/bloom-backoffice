import { apiClient } from "@/lib/apiClient";
import type {
  OrganizationPlan,
  OrganizationStatus,
  OrganizationSummary,
  OrganizationActivity,
  OrganizationUser,
  SubscriptionSummary,
  SupportTicketSummary,
} from "@/types";
import { getOrganizationUrl, isValidSubdomain } from "@/lib/utils/subdomain";

type OrganizationsResponse = { data?: unknown[] } | unknown[];

type ImpersonationResponse = {
  url?: string;
  token?: string;
};

type ApiPayload<T> = { data?: T } | T;
type SubdomainAvailability = {
  available: boolean;
  subdomain: string;
  url?: string;
  reason?: string;
};

function normalizePlan(value: unknown): OrganizationPlan {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized.includes("FREE")) return "FREE";
  if (normalized.includes("STARTER")) return "STARTER";
  if (normalized.includes("PRO")) return "PROFESSIONAL";
  if (normalized.includes("ENTERPRISE") || normalized.includes("ENT")) return "ENTERPRISE";
  return "STARTER";
}

function normalizeStatus(value: unknown): OrganizationStatus {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized.includes("SUSPEND")) return "SUSPENDED";
  if (normalized.includes("TRIAL")) return "TRIAL";
  if (normalized.includes("PAST")) return "ACTIVE";
  return "ACTIVE";
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIsoDate(value: unknown): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function normalizeString(value: unknown, fallback = "—"): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSlug(value: unknown, fallbackName: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return (
    fallbackName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "unknown"
  );
}

export function toOrganizationSummary(raw: Record<string, unknown>): OrganizationSummary {
  const name = String(raw.name ?? raw.organizationName ?? raw.title ?? "Unknown Organization");
  const slug = normalizeSlug(raw.slug ?? raw.subdomain ?? raw.subDomain, name);
  const rawSubdomain = raw.subdomain ?? raw.subDomain ?? null;
  const subdomain =
    typeof rawSubdomain === "string" && rawSubdomain.trim() ? rawSubdomain.trim() : null;
  const billingEmail = String(raw.billingEmail ?? raw.billing_email ?? raw.email ?? "");

  const count = (raw as { _count?: Record<string, number> })._count ?? {};

  const usersUsed = normalizeNumber(
    raw.usersUsed ?? raw.userCount ?? count.users ?? (raw.users as { used?: number } | undefined)?.used
  );
  const usersLimit = normalizeNumber(
    raw.usersLimit ??
      raw.userLimit ??
      raw.maxUsers ??
      (raw.users as { limit?: number } | undefined)?.limit ??
      usersUsed
  );

  const clientsUsed = normalizeNumber(
    raw.clientsUsed ?? raw.clientCount ?? count.clients ?? (raw.clients as { used?: number } | undefined)?.used
  );
  const clientsLimit = normalizeNumber(
    raw.clientsLimit ??
      raw.clientLimit ??
      raw.maxClients ??
      (raw.clients as { limit?: number } | undefined)?.limit ??
      clientsUsed
  );

  return {
    id: String(raw.id ?? raw._id ?? slug),
    name,
    slug,
    subdomain,
    billingEmail,
    plan: normalizePlan(raw.plan ?? raw.subscriptionPlan ?? raw.tier ?? "STARTER"),
    status: normalizeStatus(
      raw.subscriptionStatus ??
        raw.status ??
        raw.accessStatus ??
        raw.state ??
        (raw.suspended ? "SUSPENDED" : "ACTIVE")
    ),
    usersUsed,
    usersLimit,
    clientsUsed,
    clientsLimit,
    mrr: normalizeNumber(raw.mrr ?? raw.monthlyRecurringRevenue ?? raw.revenueMrr ?? 0),
    healthScore: normalizeNumber(
      raw.healthScore ?? (raw.health as { score?: number } | undefined)?.score ?? 0
    ),
    lastActivityAt: normalizeIsoDate(
      raw.lastActivityAt ?? raw.lastActiveAt ?? raw.updatedAt ?? raw.lastLoginAt
    ),
    createdAt: normalizeIsoDate(raw.createdAt),
  };
}

export async function fetchOrganizations(): Promise<OrganizationSummary[]> {
  const response = await apiClient.get<OrganizationsResponse>("/api/admin/organizations");
  const payload = response.data as { data?: unknown } | unknown;
  const raw = (payload as { data?: unknown })?.data ?? payload;
  const data = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { organizations?: unknown[] })?.organizations)
    ? (raw as { organizations: unknown[] }).organizations
    : [];

  return data.map((item) => toOrganizationSummary(item as Record<string, unknown>));
}

export async function checkSubdomainAvailability(
  subdomain: string
): Promise<SubdomainAvailability> {
  const normalized = subdomain.toLowerCase().trim();
  if (!normalized) {
    return { available: false, subdomain: normalized, reason: "Subdomain is required." };
  }
  if (!isValidSubdomain(normalized)) {
    return { available: false, subdomain: normalized, reason: "Subdomain is invalid or reserved." };
  }

  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/admin/organizations?search=${encodeURIComponent(normalized)}`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  const organizations = Array.isArray((raw as { organizations?: unknown[] })?.organizations)
    ? (raw as { organizations: unknown[] }).organizations
    : Array.isArray(raw)
    ? raw
    : [];

  const exists = organizations.some((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    const candidate = String(record.subdomain ?? "").toLowerCase();
    const slug = String(record.slug ?? "").toLowerCase();
    return candidate === normalized || slug === normalized;
  });

  return {
    available: !exists,
    subdomain: normalized,
    url: getOrganizationUrl(normalized),
    reason: exists ? "Subdomain already in use." : undefined,
  };
}

export async function fetchOrganization(id: string): Promise<OrganizationSummary> {
  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/admin/organizations/${id}`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Organization not found");
  }
  return toOrganizationSummary(raw as Record<string, unknown>);
}

export async function fetchOrganizationSubscription(id: string): Promise<SubscriptionSummary | null> {
  const response = await apiClient.get<ApiPayload<unknown>>(`/api/hq/subscriptions/${id}`);
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return {
    plan: normalizePlan(record.plan ?? record.subscriptionPlan ?? record.tier ?? "STARTER"),
    billingCycle: normalizeString(record.billingCycle ?? record.cycle ?? "MONTHLY"),
    status: normalizeString(record.status ?? record.subscriptionStatus ?? record.state ?? "ACTIVE"),
    mrr: normalizeNumber(record.mrr ?? record.monthlyRecurringRevenue ?? 0),
    nextBillingDate: normalizeIsoDate(
      record.nextBillingDate ?? record.nextInvoiceDate ?? record.renewalDate
    ),
    paymentStatus: normalizeString(record.paymentStatus ?? record.payment_state ?? "—"),
    trialEndsAt: normalizeIsoDate(record.trialEndsAt ?? record.trialEndDate),
  };
}

export async function fetchOrganizationUsers(id: string): Promise<OrganizationUser[]> {
  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/admin/organizations/${id}`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  const users = normalizeArray<Record<string, unknown>>(
    (raw as { users?: unknown[] })?.users ?? []
  );

  return users.map((user) => ({
    id: String(user.id ?? user._id ?? user.email ?? "user"),
    name: normalizeString(
      user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      "—"
    ),
    email: normalizeString(user.email, "—"),
    role: normalizeString(user.role ?? user.permission ?? "—"),
    status: normalizeString(user.status ?? user.state ?? "—"),
    lastLoginAt: null,
  }));
}

export async function fetchOrganizationActivity(id: string): Promise<OrganizationActivity[]> {
  const response = await apiClient.get<ApiPayload<unknown[]>>(
    `/api/hq/security-logs?organizationId=${id}`
  );
  const payload = response.data as { data?: unknown[] };
  const raw = payload?.data ?? response.data;
  return normalizeArray<Record<string, unknown>>(raw).map((item) => ({
    id: String(item.id ?? item._id ?? Math.random().toString(36).slice(2)),
    message: normalizeString(item.action ?? item.message ?? "Activity updated"),
    actor: normalizeString(
      (item.user as { email?: string } | undefined)?.email ?? item.actor ?? "—"
    ),
    timestamp: normalizeIsoDate(item.createdAt ?? item.timestamp ?? item.time) ?? "",
  }));
}

export async function fetchOrganizationTickets(id: string): Promise<SupportTicketSummary[]> {
  const response = await apiClient.get<ApiPayload<unknown[]>>(
    `/api/hq/support/tickets?organizationId=${id}`
  );
  const payload = response.data as { data?: unknown[] };
  const raw = payload?.data ?? response.data;
  return normalizeArray<Record<string, unknown>>(raw).map((ticket) => ({
    id: String(ticket.id ?? ticket._id ?? ticket.number ?? "ticket"),
    subject: normalizeString(ticket.subject ?? ticket.title ?? "Support ticket"),
    status: normalizeString(ticket.status ?? ticket.state ?? "—"),
    priority: normalizeString(ticket.priority ?? "—"),
    createdAt: normalizeIsoDate(ticket.createdAt ?? ticket.openedAt),
    assignee: normalizeString(
      (ticket.assignedTo as { email?: string } | undefined)?.email ?? ticket.assignee ?? "Unassigned"
    ),
  }));
}

export async function impersonateOrganization(id: string): Promise<ImpersonationResponse> {
  throw new Error(`Impersonation not available for organization ${id}.`);
}
