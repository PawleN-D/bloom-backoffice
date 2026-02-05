import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PlanDistributionChart from "@/components/charts/PlanDistributionChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import SignupChurnChart from "@/components/charts/SignupChurnChart";
import { analyticsMetrics, churnMetrics, planDistribution, revenueTrend, signupChurn } from "@/data/analytics";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Analytics</h2>
        <p className="mt-2 text-sm text-slate-400">
          Revenue, growth, churn, and feature adoption insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="MRR"
          value={currencyFormatter.format(analyticsMetrics.mrr)}
          change={`+${analyticsMetrics.mrrChange}%`}
          trend="up"
        />
        <StatCard
          title="ARR"
          value={currencyFormatter.format(analyticsMetrics.arr)}
          change={`+${analyticsMetrics.arrChange}%`}
          trend="up"
        />
        <StatCard
          title="ARPA"
          value={currencyFormatter.format(analyticsMetrics.arpa)}
          change={`+${analyticsMetrics.arpaChange}%`}
          trend="up"
        />
        <StatCard title="LTV" value={currencyFormatter.format(analyticsMetrics.ltv)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">MRR Trend</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Last 12 months</h3>
          </div>
          <RevenueTrendChart data={revenueTrend} />
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan Distribution</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Organizations by plan</h3>
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Growth Metrics</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Last 30 days</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>New organizations</span>
              <span className="text-white">{churnMetrics.newOrgs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Churned organizations</span>
              <span className="text-white">{churnMetrics.churnedOrgs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Net growth</span>
              <span className="text-white">{churnMetrics.netGrowth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Churn rate</span>
              <span className="text-white">{churnMetrics.churnRate}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
