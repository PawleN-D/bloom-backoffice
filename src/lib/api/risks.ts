import { apiClient } from "@/lib/apiClient";
import { fetchOrganizations, fetchOrganizationUsers } from "@/lib/api/organizations";
import type { OrgRiskItem, OrgRiskSummary } from "@/types/models/risk";

type ApiPayload<T> = { data?: T } | T;

function nowMinusHours(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const mockRiskSummary: OrgRiskSummary = {
  critical: [
    {
      orgId: "org-carewell",
      orgName: "CareWell Dublin",
      issue: "EMAIL_DELIVERY_FAILED",
      description: "Welcome email failed 2 days ago",
      timestamp: nowMinusHours(48),
      severity: "CRITICAL",
    },
    {
      orgId: "org-health-first",
      orgName: "Health First",
      issue: "ALL_USERS_INACTIVE_30_DAYS",
      description: "All users inactive for 30+ days",
      timestamp: nowMinusHours(720),
      severity: "CRITICAL",
    },
    {
      orgId: "org-oak-care",
      orgName: "Oak Care",
      issue: "APPROACHING_USER_LIMIT",
      description: "95% of user limit reached (48/50)",
      timestamp: nowMinusHours(6),
      severity: "CRITICAL",
    },
  ],
  attention: [
    {
      orgId: "org-trinity",
      orgName: "Trinity Care",
      issue: "USERS_NEVER_LOGGED_IN",
      description: "2 users never logged in (created 7d ago)",
      timestamp: nowMinusHours(168),
      severity: "WARNING",
      count: 2,
    },
    {
      orgId: "org-maple",
      orgName: "Maple Care",
      issue: "APPROACHING_CLIENT_LIMIT",
      description: "Approaching client limit (38/40)",
      timestamp: nowMinusHours(10),
      severity: "WARNING",
    },
    {
      orgId: "org-riverside",
      orgName: "Riverside",
      issue: "BULK_IMPORT_PARTIAL_FAILURE",
      description: "Bulk import partially failed (5 errors)",
      timestamp: nowMinusHours(3),
      severity: "WARNING",
    },
  ],
  metrics: {
    totalRevenue: 45000,
    activeOrgs: 23,
    planDistribution: {
      FREE: 5,
      STARTER: 8,
      PROFESSIONAL: 7,
      ENTERPRISE: 3,
    },
  },
};

function normalizeRiskItems(raw: unknown): OrgRiskItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as Partial<OrgRiskItem>)
    .filter((item): item is OrgRiskItem => Boolean(item.orgId && item.orgName && item.issue && item.description && item.timestamp && item.severity))
    .map((item) => ({
      orgId: item.orgId,
      orgName: item.orgName,
      issue: item.issue,
      description: item.description,
      timestamp: item.timestamp,
      severity: item.severity,
      count: item.count,
    }));
}

function normalizeSummary(raw: unknown): OrgRiskSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<OrgRiskSummary> & { data?: Partial<OrgRiskSummary> };
  const source = record.data ?? record;
  const critical = normalizeRiskItems(source.critical);
  const attention = normalizeRiskItems(source.attention);

  const metrics = source.metrics;
  if (!metrics || typeof metrics !== "object") {
    return {
      critical,
      attention,
      metrics: {
        totalRevenue: 0,
        activeOrgs: 0,
        planDistribution: {},
      },
    };
  }

  return {
    critical,
    attention,
    metrics: {
      totalRevenue: Number((metrics as { totalRevenue?: unknown }).totalRevenue ?? 0),
      activeOrgs: Number((metrics as { activeOrgs?: unknown }).activeOrgs ?? 0),
      planDistribution:
        ((metrics as { planDistribution?: Record<string, number> }).planDistribution as Record<string, number>) ??
        {},
    },
  };
}

export async function fetchOrgRiskSummary(): Promise<OrgRiskSummary> {
  try {
    // TODO: API endpoint not yet implemented
    // Expected: GET /api/hq/organizations/risk-summary
    // Response shape: { critical: [...], attention: [...], metrics: {...} }
    const summaryResponse = await apiClient.get<ApiPayload<unknown>>("/api/hq/organizations/risk-summary");

    // TODO: API endpoint not yet implemented
    // Expected: GET /api/hq/organizations/at-risk
    // Response shape: OrgRiskItem[]
    const atRiskResponse = await apiClient.get<ApiPayload<unknown>>("/api/hq/organizations/at-risk");

    const summaryPayload = (summaryResponse.data as { data?: unknown })?.data ?? summaryResponse.data;
    const atRiskPayload = (atRiskResponse.data as { data?: unknown })?.data ?? atRiskResponse.data;
    const summary = normalizeSummary(summaryPayload);
    const atRiskItems = normalizeRiskItems(atRiskPayload);

    if (!summary) {
      return mockRiskSummary;
    }

    if (atRiskItems.length > 0) {
      const critical = atRiskItems.filter((item) => item.severity === "CRITICAL");
      const attention = atRiskItems.filter((item) => item.severity !== "CRITICAL");
      const merged = {
        ...summary,
        critical: critical.length ? critical : summary.critical,
        attention: attention.length ? attention : summary.attention,
      };
      return appendStuckUserRisks(merged);
    }

    return appendStuckUserRisks(summary);
  } catch {
    return appendStuckUserRisks(mockRiskSummary);
  }
}

async function appendStuckUserRisks(summary: OrgRiskSummary): Promise<OrgRiskSummary> {
  try {
    const organizations = await fetchOrganizations();
    const attention = [...summary.attention];

    await Promise.all(
      organizations.map(async (organization) => {
        const users = await fetchOrganizationUsers(organization.id);
        const stuckCount = users.filter((user) => {
          const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
          const olderThanWeek = createdAt < Date.now() - 7 * 24 * 60 * 60 * 1000;
          return olderThanWeek && (!user.lastLoginAt || user.mustResetPw);
        }).length;

        if (stuckCount >= 2) {
          attention.push({
            orgId: organization.id,
            orgName: organization.name,
            issue: "USERS_NEVER_LOGGED_IN",
            description: `${stuckCount} users never logged in (created 7d ago)`,
            timestamp: new Date().toISOString(),
            severity: "WARNING",
            count: stuckCount,
          });
        }
      })
    );

    const dedupedAttention = attention.filter((item, index, array) => {
      return (
        array.findIndex(
          (target) => target.orgId === item.orgId && target.issue === item.issue
        ) === index
      );
    });

    return {
      ...summary,
      attention: dedupedAttention,
    };
  } catch {
    return summary;
  }
}
