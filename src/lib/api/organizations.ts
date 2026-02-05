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

type OrganizationsResponse = { data?: unknown[] } | unknown[];

type ImpersonationResponse = {
  url?: string;
  token?: string;
};

type ApiPayload<T> = { data?: T } | T;

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
  const slug = normalizeSlug(raw.slug ?? raw.subdomain, name);
  const billingEmail = String(raw.billingEmail ?? raw.billing_email ?? raw.email ?? "");

  const usersUsed = normalizeNumber(
    raw.usersUsed ?? raw.userCount ?? (raw.users as { used?: number } | undefined)?.used
  );
  const usersLimit = normalizeNumber(
    raw.usersLimit ?? raw.userLimit ?? (raw.users as { limit?: number } | undefined)?.limit ?? usersUsed
  );

  const clientsUsed = normalizeNumber(
    raw.clientsUsed ?? raw.clientCount ?? (raw.clients as { used?: number } | undefined)?.used
  );
  const clientsLimit = normalizeNumber(
    raw.clientsLimit ?? raw.clientLimit ?? (raw.clients as { limit?: number } | undefined)?.limit ?? clientsUsed
  );

  return {
    id: String(raw.id ?? raw._id ?? slug),
    name,
    slug,
    billingEmail,
    plan: normalizePlan(raw.plan ?? raw.subscriptionPlan ?? raw.tier ?? "STARTER"),
    status: normalizeStatus(raw.status ?? raw.accessStatus ?? raw.state ?? "ACTIVE"),
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
  const response = await apiClient.get<OrganizationsResponse>("/api/backoffice/organizations");
  const payload = response.data;
  const data = Array.isArray((payload as { data?: unknown[] })?.data)
    ? (payload as { data: unknown[] }).data
    : Array.isArray(payload)
    ? payload
    : [];

  return data.map((item) => toOrganizationSummary(item as Record<string, unknown>));
}

export async function fetchOrganization(id: string): Promise<OrganizationSummary> {
  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/backoffice/organizations/${id}`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Organization not found");
  }
  return toOrganizationSummary(raw as Record<string, unknown>);
}

export async function fetchOrganizationSubscription(id: string): Promise<SubscriptionSummary | null> {
  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/backoffice/organizations/${id}/subscription`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return {
    plan: normalizePlan(record.plan ?? record.tier ?? record.subscriptionPlan ?? "STARTER"),
    billingCycle: normalizeString(record.billingCycle ?? record.cycle ?? "MONTHLY"),
    status: normalizeString(record.status ?? record.state ?? "ACTIVE"),
    mrr: normalizeNumber(record.mrr ?? record.monthlyRecurringRevenue ?? 0),
    nextBillingDate: normalizeIsoDate(record.nextBillingDate ?? record.nextInvoiceAt),
    paymentStatus: normalizeString(record.paymentStatus ?? record.payment_state ?? "—"),
    trialEndsAt: normalizeIsoDate(record.trialEndsAt ?? record.trialEndDate),
  };
}

export async function fetchOrganizationUsers(id: string): Promise<OrganizationUser[]> {
  const response = await apiClient.get<ApiPayload<unknown[]>>(
    `/api/backoffice/organizations/${id}/users`
  );
  const payload = response.data as { data?: unknown[] };
  const raw = payload?.data ?? response.data;
  return normalizeArray<Record<string, unknown>>(raw).map((user) => ({
    id: String(user.id ?? user._id ?? user.email ?? "user"),
    name: normalizeString(user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(), "—"),
    email: normalizeString(user.email, "—"),
    role: normalizeString(user.role ?? user.permission ?? "—"),
    status: normalizeString(user.status ?? user.state ?? "—"),
    lastLoginAt: normalizeIsoDate(user.lastLoginAt ?? user.lastActiveAt ?? user.updatedAt),
  }));
}

export async function fetchOrganizationActivity(id: string): Promise<OrganizationActivity[]> {
  const response = await apiClient.get<ApiPayload<unknown[]>>(
    `/api/backoffice/organizations/${id}/activity`
  );
  const payload = response.data as { data?: unknown[] };
  const raw = payload?.data ?? response.data;
  return normalizeArray<Record<string, unknown>>(raw).map((item) => ({
    id: String(item.id ?? item._id ?? Math.random().toString(36).slice(2)),
    message: normalizeString(item.message ?? item.action ?? "Activity updated"),
    actor: normalizeString(item.actor ?? item.performedBy ?? item.adminName ?? "—"),
    timestamp: normalizeIsoDate(item.timestamp ?? item.createdAt ?? item.time) ?? "",
  }));
}

export async function fetchOrganizationTickets(id: string): Promise<SupportTicketSummary[]> {
  const response = await apiClient.get<ApiPayload<unknown[]>>(
    `/api/backoffice/organizations/${id}/tickets`
  );
  const payload = response.data as { data?: unknown[] };
  const raw = payload?.data ?? response.data;
  return normalizeArray<Record<string, unknown>>(raw).map((ticket) => ({
    id: String(ticket.id ?? ticket._id ?? ticket.number ?? "ticket"),
    subject: normalizeString(ticket.subject ?? ticket.title ?? "Support ticket"),
    status: normalizeString(ticket.status ?? ticket.state ?? "—"),
    priority: normalizeString(ticket.priority ?? "—"),
    createdAt: normalizeIsoDate(ticket.createdAt ?? ticket.openedAt),
    assignee: normalizeString(ticket.assignedTo ?? ticket.assignee ?? "Unassigned"),
  }));
}

export async function impersonateOrganization(id: string): Promise<ImpersonationResponse> {
  const response = await apiClient.post<ImpersonationResponse>(
    `/api/backoffice/organizations/${id}/impersonate`
  );
  return response.data;
}
