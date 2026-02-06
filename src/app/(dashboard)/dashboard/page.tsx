import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PlanDistributionChart from "@/components/charts/PlanDistributionChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import SignupChurnChart from "@/components/charts/SignupChurnChart";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";
import { formatDistanceToNow } from "date-fns";
import { cookies, headers } from "next/headers";

export const runtime = "edge";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type PlatformStats = {
  organizations: {
    total: number;
    active: number;
    suspended: number;
    byPlan?: Record<string, number>;
  };
  users: {
    total: number;
  };
};

type AnalyticsOverview = {
  mrrCents: number;
  arrCents: number;
  churnRate: number;
  newOrganizations?: number;
  canceledSubscriptions?: number;
};

type AuditLogEntry = {
  id: string;
  action: string;
  createdAt: string;
  organization?: { name?: string };
  user?: { email?: string };
};

type OverviewMetrics = {
  totalOrganizations: number;
  activeOrganizations: number;
  mrr: number;
  arr: number;
  activeUsers: number;
  churnRate: number;
};

type DashboardData = {
  metrics: OverviewMetrics;
  planDistribution: Array<{ name: string; value: number }>;
  revenueTrend: Array<{ month: string; mrr: number }>;
  signupChurn: Array<{ month: string; signups: number; churn: number }>;
  recentActivity: Array<{
    id: string;
    message: string;
    actor: string;
    timestamp: string;
  }>;
};

async function getDashboardData(): Promise<DashboardData | null> {
  if (!SERVER_API_BASE_URL) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const incomingHeaders = await headers();
  const tenant = incomingHeaders.get("x-tenant");
  const requestHeaders = new Headers({
    authorization: `Bearer ${token}`,
  });
  if (tenant) {
    requestHeaders.set("x-tenant", tenant);
  }

  try {
    const [statsResponse, analyticsResponse, auditResponse] = await Promise.all([
      fetch(`${SERVER_API_BASE_URL}/api/admin/stats`, {
        headers: requestHeaders,
        cache: "no-store",
      }),
      fetch(`${SERVER_API_BASE_URL}/api/hq/analytics/overview`, {
        headers: requestHeaders,
        cache: "no-store",
      }),
      fetch(`${SERVER_API_BASE_URL}/api/hq/audit-logs`, {
        headers: requestHeaders,
        cache: "no-store",
      }),
    ]);

    if (!statsResponse.ok || !analyticsResponse.ok) {
      return null;
    }

    const statsPayload = (await statsResponse.json()) as { data?: PlatformStats };
    const analyticsPayload = (await analyticsResponse.json()) as { data?: AnalyticsOverview };
    const auditPayload = auditResponse.ok
      ? ((await auditResponse.json()) as { data?: AuditLogEntry[] })
      : null;

    const stats = statsPayload.data;
    const analytics = analyticsPayload.data;

    if (!stats || !analytics) {
      return null;
    }

    const metrics = {
      totalOrganizations: stats.organizations.total,
      activeOrganizations: stats.organizations.active,
      mrr: Math.round(analytics.mrrCents / 100),
      arr: Math.round(analytics.arrCents / 100),
      activeUsers: stats.users.total,
      churnRate: analytics.churnRate,
    };

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
      return {
        month: monthFormatter.format(date),
        mrr: metrics.mrr,
      };
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

    const recentActivity = (auditPayload?.data ?? []).slice(0, 10).map((entry) => ({
      id: entry.id,
      message: entry.action,
      actor: entry.user?.email ?? "System",
      timestamp: entry.createdAt,
    }));

    return {
      metrics,
      planDistribution,
      revenueTrend,
      signupChurn,
      recentActivity,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();
  const overviewMetrics = dashboardData?.metrics;
  const planDistribution = dashboardData?.planDistribution ?? [];
  const revenueTrend = dashboardData?.revenueTrend ?? [];
  const signupChurn = dashboardData?.signupChurn ?? [];
  const recentActivity = dashboardData?.recentActivity ?? [];
  const hasLiveData = Boolean(dashboardData);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Platform Overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          High-level operational signal across revenue, organizations, and support.
        </p>
      </div>
      {!hasLiveData ? (
        <Card>
          <p className="text-sm text-slate-300">
            Live metrics are unavailable. Check API connectivity or authentication.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Orgs"
          value={overviewMetrics ? overviewMetrics.totalOrganizations.toString() : "N/A"}
          helper="All organizations"
        />
        <StatCard
          title="MRR"
          value={overviewMetrics ? currencyFormatter.format(overviewMetrics.mrr) : "N/A"}
          helper="Month over month"
        />
        <StatCard
          title="ARR"
          value={overviewMetrics ? currencyFormatter.format(overviewMetrics.arr) : "N/A"}
          helper="Year over year"
        />
        <StatCard
          title="Active Orgs"
          value={overviewMetrics ? overviewMetrics.activeOrganizations.toString() : "N/A"}
          helper="Last 30 days"
        />
        <StatCard
          title="Active Users"
          value={overviewMetrics ? overviewMetrics.activeUsers.toString() : "N/A"}
          helper="Across all orgs"
        />
        <StatCard
          title="Churn Rate"
          value={overviewMetrics ? `${overviewMetrics.churnRate}%` : "N/A"}
          helper="Last 30 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Revenue Trend</p>
            <h3 className="mt-2 text-xl font-semibold text-white">MRR last 12 months</h3>
          </div>
          <RevenueTrendChart data={revenueTrend} />
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organizations by Plan</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Plan distribution</h3>
          </div>
          <PlanDistributionChart data={planDistribution} />
          {planDistribution.length ? (
            <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
              {planDistribution.map((item) => (
                <div key={item.name}>
                  <div className="text-sm text-slate-200">{item.value}</div>
                  <div>{item.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No plan distribution data yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sign-ups vs Churn</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Last 6 months</h3>
          </div>
          <SignupChurnChart data={signupChurn} />
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent Activity</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Latest changes</h3>
          </div>
          {recentActivity.length ? (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm"
                >
                  <div className="text-slate-200">{item.message}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.actor} - {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No recent activity found.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
