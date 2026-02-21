import { apiClient } from "@/lib/apiClient";

type ApiPayload<T> = { data?: T } | T;

type PlatformStats = {
  organizations: {
    total: number;
    active: number;
    byPlan?: Record<string, number>;
  };
};

type AnalyticsOverview = {
  mrrCents: number;
  arrCents: number;
  churnRate: number;
  newOrganizations?: number;
  canceledSubscriptions?: number;
};

export type AnalyticsPageData = {
  mrr: number;
  arr: number;
  arpa: number;
  ltv: number;
  planDistribution: Array<{ name: string; value: number }>;
  revenueTrend: Array<{ month: string; mrr: number }>;
  signupChurn: Array<{ month: string; signups: number; churn: number }>;
  churnMetrics: {
    newOrgs: number;
    churnedOrgs: number;
    netGrowth: number;
    churnRate: number;
  };
};

export async function fetchAnalyticsPageData(): Promise<AnalyticsPageData | null> {
  try {
    const [statsResponse, analyticsResponse] = await Promise.all([
      apiClient.get<ApiPayload<PlatformStats>>("/api/admin/stats"),
      apiClient.get<ApiPayload<AnalyticsOverview>>("/api/hq/analytics/overview"),
    ]);

    const statsPayload = statsResponse.data as { data?: PlatformStats };
    const analyticsPayload = analyticsResponse.data as { data?: AnalyticsOverview };
    const stats = statsPayload.data ?? (statsResponse.data as PlatformStats);
    const analytics = analyticsPayload.data ?? (analyticsResponse.data as AnalyticsOverview);

    if (!stats || !analytics) {
      return null;
    }

    const mrr = Math.round(analytics.mrrCents / 100);
    const arr = Math.round(analytics.arrCents / 100);
    const activeOrgs = stats.organizations.active || 0;
    const arpa = activeOrgs > 0 ? Math.round(mrr / activeOrgs) : 0;
    const ltv = arpa * 12;

    const planDistribution = Object.entries(stats.organizations.byPlan ?? {}).map(
      ([plan, value]) => ({
        name: plan,
        value,
      })
    );

    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const revenueTrend = Array.from({ length: 12 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return { month: monthFormatter.format(date), mrr };
    });

    const signups = analytics.newOrganizations ?? 0;
    const churn = analytics.canceledSubscriptions ?? 0;
    const signupChurn = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        month: monthFormatter.format(date),
        signups: index === 5 ? signups : 0,
        churn: index === 5 ? churn : 0,
      };
    });

    return {
      mrr,
      arr,
      arpa,
      ltv,
      planDistribution,
      revenueTrend,
      signupChurn,
      churnMetrics: {
        newOrgs: signups,
        churnedOrgs: churn,
        netGrowth: signups - churn,
        churnRate: analytics.churnRate,
      },
    };
  } catch {
    return null;
  }
}
