"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Card from "@/components/Card";
import { useOrgRisks } from "@/lib/hooks/api/useOrgRisks";
import type { OrgRiskItem } from "@/types/models/risk";
import { OrgRiskRadarSkeleton } from "@/components/features/dashboard/OrgRiskRadarSkeleton";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function toRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return formatDistanceToNow(date, { addSuffix: true });
}

function resolveRiskLink(item: OrgRiskItem) {
  if (
    item.issue === "USERS_NEVER_LOGGED_IN" ||
    item.issue === "SETUP_INCOMPLETE" ||
    item.issue === "ALL_USERS_INACTIVE_30_DAYS"
  ) {
    return `/organizations/${item.orgId}?tab=Users`;
  }
  if (item.issue === "EMAIL_DELIVERY_FAILED") {
    return `/emails?org=${item.orgId}`;
  }
  if (item.issue === "BULK_IMPORT_PARTIAL_FAILURE") {
    return `/organizations/${item.orgId}?tab=Users`;
  }
  return `/organizations/${item.orgId}`;
}

function SeverityBadge({ level }: { level: "CRITICAL" | "WARNING" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] ${
        level === "CRITICAL"
          ? "bg-danger-500/20 text-danger-500"
          : "bg-warning-500/20 text-warning-500"
      }`}
    >
      {level}
    </span>
  );
}

export function OrgRiskRadar() {
  const { data, isLoading, error, isUsingMockData } = useOrgRisks();

  if (isLoading || !data) {
    return <OrgRiskRadarSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-white">Org Risk Radar</h2>
        <p className="mt-2 text-sm text-slate-400">
          Exception-first view of organizations that need immediate intervention.
        </p>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-warning-500">{error}</p>
        </Card>
      ) : null}

      {isUsingMockData ? (
        <Card>
          <p className="text-sm text-slate-300">
            Showing mock risk data while backend risk endpoints are being implemented.
          </p>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-danger-500">
            Critical Issues ({data.critical.length} orgs)
          </h3>
          <Link href="/organizations?risk=critical" className="text-xs text-slate-400 hover:underline">
            View all
          </Link>
        </div>

        {data.critical.length === 0 ? (
          <p className="text-sm text-slate-400">No critical issues detected.</p>
        ) : (
          <div className="space-y-3">
            {data.critical.map((item) => (
              <Link
                key={`${item.orgId}-${item.issue}-${item.timestamp}`}
                href={resolveRiskLink(item)}
                className="block rounded-lg border border-danger-500/20 bg-danger-500/5 px-4 py-3 transition hover:bg-danger-500/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-100">
                    <span className="font-semibold">{item.orgName}:</span> {item.description}
                  </p>
                  <SeverityBadge level="CRITICAL" />
                </div>
                <p className="mt-1 text-xs text-slate-500">{toRelative(item.timestamp)}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-warning-500">
            Requires Attention ({data.attention.length} orgs)
          </h3>
          <Link href="/organizations?risk=at-risk" className="text-xs text-slate-400 hover:underline">
            View all
          </Link>
        </div>

        {data.attention.length === 0 ? (
          <p className="text-sm text-slate-400">No warning-level issues detected.</p>
        ) : (
          <div className="space-y-3">
            {data.attention.slice(0, 5).map((item) => (
              <Link
                key={`${item.orgId}-${item.issue}-${item.timestamp}`}
                href={resolveRiskLink(item)}
                className="block rounded-lg border border-warning-500/20 bg-warning-500/5 px-4 py-3 transition hover:bg-warning-500/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-100">
                    <span className="font-semibold">{item.orgName}:</span> {item.description}
                  </p>
                  <SeverityBadge level="WARNING" />
                </div>
                <p className="mt-1 text-xs text-slate-500">{toRelative(item.timestamp)}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {currencyFormatter.format(data.metrics.totalRevenue)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active Orgs</p>
          <p className="mt-2 text-2xl font-semibold text-white">{data.metrics.activeOrgs}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan Mix</p>
          <div className="mt-2 space-y-1 text-sm text-slate-300">
            {Object.entries(data.metrics.planDistribution).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span>{plan}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
