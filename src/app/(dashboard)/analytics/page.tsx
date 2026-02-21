"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import PlanDistributionChart from "@/components/charts/PlanDistributionChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import SignupChurnChart from "@/components/charts/SignupChurnChart";
import { fetchAnalyticsPageData, type AnalyticsPageData } from "@/lib/api/analytics";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      const nextData = await fetchAnalyticsPageData();
      if (!isMounted) return;
      setData(nextData);
      setIsLoading(false);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Analytics</h2>
        <p className="mt-2 text-sm text-slate-400">
          Revenue, growth, churn, and feature adoption insights.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-300">Loading analytics...</p>
        </Card>
      ) : null}

      {!isLoading && !data ? (
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
