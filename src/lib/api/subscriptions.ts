import { apiClient } from "@/lib/apiClient";
import type { InvoiceSummary, OrganizationPlan, SubscriptionRow, SubscriptionSummary } from "@/types";
import { fetchOrganizationSubscription } from "@/lib/api/organizations";

type ApiPayload<T> = { data?: T } | T;

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIsoDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function fetchSubscriptions(): Promise<SubscriptionRow[]> {
  const response = await apiClient.get<ApiPayload<unknown>>("/api/admin/subscriptions");
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  const records = Array.isArray((raw as { subscriptions?: unknown[] })?.subscriptions)
    ? (raw as { subscriptions: unknown[] }).subscriptions
    : Array.isArray(raw)
    ? raw
    : [];

  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      organizationId: String(record.organizationId ?? record.orgId ?? record.id ?? ""),
      organizationName: String(record.organizationName ?? record.orgName ?? "Organization"),
      plan: String(record.plan ?? "STARTER") as OrganizationPlan,
      status: String(record.status ?? "ACTIVE"),
      billingCycle: String(record.billingCycle ?? "MONTHLY"),
      mrr: normalizeNumber(record.priceCents ?? record.mrr ?? 0) / 100,
      nextBillingDate: normalizeIsoDate(record.currentPeriodEnd ?? record.nextBillingDate),
      paymentStatus: String(record.paymentStatus ?? record.latestInvoiceStatus ?? "-"),
      trialEndsAt: normalizeIsoDate(record.trialEndsAt ?? null),
    };
  });
}

export async function fetchSubscriptionDetail(orgId: string): Promise<SubscriptionSummary | null> {
  return fetchOrganizationSubscription(orgId);
}

export async function fetchSubscriptionInvoices(orgId: string): Promise<InvoiceSummary[]> {
  const response = await apiClient.get<ApiPayload<unknown>>(
    `/api/hq/subscriptions/${orgId}/invoices`
  );
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  const records = Array.isArray(raw) ? raw : [];

  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: String(record.id ?? record._id ?? "invoice"),
      issuedAt: normalizeIsoDate(record.issuedAt ?? record.createdAt),
      dueAt: normalizeIsoDate(record.dueAt ?? record.dueDate),
      status: String(record.status ?? "OPEN"),
      totalCents: normalizeNumber(record.totalCents ?? record.total ?? 0),
      currency: String(record.currency ?? "EUR"),
    };
  });
}

export async function updateSubscriptionPlan(orgId: string, nextPlan: OrganizationPlan, previousPlan: OrganizationPlan) {
  const order: Record<OrganizationPlan, number> = {
    FREE: 0,
    STARTER: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  };
  const endpoint =
    order[nextPlan] >= order[previousPlan]
      ? `/api/hq/subscriptions/${orgId}/upgrade`
      : `/api/hq/subscriptions/${orgId}/downgrade`;

  await apiClient.post(endpoint, { plan: nextPlan });
}

export async function pauseSubscription(orgId: string) {
  await apiClient.post(`/api/hq/subscriptions/${orgId}/pause`);
}

export async function resumeSubscription(orgId: string) {
  await apiClient.post(`/api/hq/subscriptions/${orgId}/resume`);
}

export async function cancelSubscription(orgId: string) {
  await apiClient.post(`/api/hq/subscriptions/${orgId}/cancel`);
}
