import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PlanDistributionChart from "@/components/charts/PlanDistributionChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import SignupChurnChart from "@/components/charts/SignupChurnChart";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import { SERVER_API_BASE_URL } from "@/lib/config";
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

type AnalyticsData = {
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

async function getAnalyticsData(): Promise<AnalyticsData | null> {
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
    const [statsResponse, analyticsResponse] = await Promise.all([
      fetch(`${SERVER_API_BASE_URL}/api/admin/stats`, {
        headers: requestHeaders,
        cache: "no-store",
      }),
      fetch(`${SERVER_API_BASE_URL}/api/hq/analytics/overview`, {
        headers: requestHeaders,
        cache: "no-store",
      }),
    ]);

    if (!statsResponse.ok || !analyticsResponse.ok) {
      return null;
    }

    const statsPayload = (await statsResponse.json()) as { data?: PlatformStats };
    const analyticsPayload = (await analyticsResponse.json()) as { data?: AnalyticsOverview };

    const stats = statsPayload.data;
    const analytics = analyticsPayload.data;

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
      return {
        month: monthFormatter.format(date),
        mrr,
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

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const hasLiveData = Boolean(data);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Analytics</h2>
        <p className="mt-2 text-sm text-slate-400">
          Revenue, growth, churn, and feature adoption insights.
        </p>
      </div>

      {!hasLiveData ? (
        <Card>
          <p className="text-sm text-slate-300">
            Live analytics are unavailable. Check API connectivity or authentication.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="MRR" value={data ? currencyFormatter.format(data.mrr) : "N/A"} />
        <StatCard title="ARR" value={data ? currencyFormatter.format(data.arr) : "N/A"} />
        <StatCard title="ARPA" value={data ? currencyFormatter.format(data.arpa) : "N/A"} />
        <StatCard title="LTV" value={data ? currencyFormatter.format(data.ltv) : "N/A"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">MRR Trend</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Last 12 months</h3>
          </div>
          <RevenueTrendChart data={data?.revenueTrend ?? []} />
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan Distribution</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Organizations by plan</h3>
          </div>
          <PlanDistributionChart data={data?.planDistribution ?? []} />
          {data?.planDistribution?.length ? (
            <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
              {data.planDistribution.map((item) => (
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
          <SignupChurnChart data={data?.signupChurn ?? []} />
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Growth Metrics</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Last 30 days</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>New organizations</span>
              <span className="text-white">{data?.churnMetrics.newOrgs ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Churned organizations</span>
              <span className="text-white">{data?.churnMetrics.churnedOrgs ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Net growth</span>
              <span className="text-white">{data?.churnMetrics.netGrowth ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Churn rate</span>
              <span className="text-white">{data?.churnMetrics.churnRate ?? 0}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
