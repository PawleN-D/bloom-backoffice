import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PlanDistributionChart from "@/components/charts/PlanDistributionChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import SignupChurnChart from "@/components/charts/SignupChurnChart";
import { dashboardMetrics, planDistribution, recentActivity, revenueTrend, signupChurn } from "@/data/analytics";
import { formatDistanceToNow } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Platform Overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          High-level operational signal across revenue, organizations, and support.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Orgs"
          value={dashboardMetrics.totalOrganizations.toString()}
          change="+4"
          trend="up"
          helper="All organizations"
        />
        <StatCard
          title="MRR"
          value={currencyFormatter.format(dashboardMetrics.mrr)}
          change="+12%"
          trend="up"
          helper="Month over month"
        />
        <StatCard
          title="ARR"
          value={currencyFormatter.format(dashboardMetrics.arr)}
          change="+145%"
          trend="up"
          helper="Year over year"
        />
        <StatCard
          title="Active Orgs"
          value={dashboardMetrics.activeOrganizations.toString()}
          change="+2"
          trend="up"
          helper="Last 30 days"
        />
        <StatCard
          title="Active Users"
          value={dashboardMetrics.activeUsers.toString()}
          change="+6%"
          trend="up"
          helper="Across all orgs"
        />
        <StatCard
          title="Churn Rate"
          value={`${dashboardMetrics.churnRate}%`}
          change="-0.4%"
          trend="down"
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
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
            {planDistribution.map((item) => (
              <div key={item.name}>
                <div className="text-sm text-slate-200">{item.value}</div>
                <div>{item.name}</div>
              </div>
            ))}
          </div>
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
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
                <div className="text-slate-200">{item.message}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.actor} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
