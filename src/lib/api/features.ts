import { apiClient } from "@/lib/apiClient";
import type { FeatureSummary, OrganizationPlan } from "@/types";

type ApiPayload<T> = { data?: T } | T;

function normalizePlan(value: unknown): OrganizationPlan {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized.includes("FREE")) return "FREE";
  if (normalized.includes("STARTER")) return "STARTER";
  if (normalized.includes("PRO")) return "PROFESSIONAL";
  if (normalized.includes("ENTERPRISE") || normalized.includes("ENT")) return "ENTERPRISE";
  return "STARTER";
}

function normalizePlans(value: unknown): OrganizationPlan[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizePlan);
}

export async function fetchFeatures(): Promise<FeatureSummary[]> {
  const response = await apiClient.get<ApiPayload<unknown>>("/api/admin/features");
  const payload = response.data as { data?: unknown };
  const raw = payload?.data ?? response.data;
  const records = Array.isArray(raw) ? raw : [];

  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: String(record.id ?? record._id ?? record.key ?? "feature"),
      key: String(record.key ?? record.id ?? "feature"),
      name: String(record.name ?? record.key ?? "Feature"),
      description: (record.description as string | null) ?? null,
      category: String(record.category ?? "CORE"),
      availableInPlans: normalizePlans(record.availableInPlans ?? record.plans ?? []),
      betaFeature: Boolean(record.betaFeature ?? record.beta ?? false),
      comingSoon: Boolean(record.comingSoon ?? record.soon ?? false),
      defaultEnabled: Boolean(record.defaultEnabled ?? record.enabledByDefault ?? false),
    };
  });
}
