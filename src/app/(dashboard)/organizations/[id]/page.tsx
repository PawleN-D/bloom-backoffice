"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Card from "@/components/Card";
import HealthScore from "@/components/HealthScore";
import OrganizationActions from "@/components/OrganizationActions";
import PlanBadge from "@/components/PlanBadge";
import StatusBadge from "@/components/StatusBadge";
import { organizationSummaries } from "@/data/mock";
import { fetchOrganization, impersonateOrganization } from "@/lib/api/organizations";
import type { OrganizationSummary } from "@/types";

const tabs = ["Overview", "Subscription", "Users", "Activity", "Support"] as const;

type Tab = (typeof tabs)[number];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchOrganization(id)
      .then((data) => {
        if (!isMounted) return;
        setOrganization(data);
        setUsingSample(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load organization. Check API connectivity.");
        setOrganization(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchOrganization(id)
      .then((data) => {
        setOrganization(data);
        setUsingSample(false);
      })
      .catch(() => {
        setError("Unable to load organization. Check API connectivity.");
        setOrganization(null);
      })
      .finally(() => setIsLoading(false));
  };

  const handleUseSample = () => {
    const sample = organizationSummaries.find((org) => org.id === id) ?? null;
    setOrganization(sample);
    setUsingSample(true);
    setError(null);
  };

  const subdomain = useMemo(() => {
    if (!organization?.slug) return "—";
    return `${organization.slug}.bloom.ie`;
  }, [organization]);

  const handleSuspendToggle = () => {
    if (!organization) return;
    setOrganization({
      ...organization,
      status: organization.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
    });
  };

  const handleImpersonate = async () => {
    if (!organization) return;
    setActionMessage(null);
    try {
      const response = await impersonateOrganization(organization.id);
      if (response.url) {
        window.open(response.url, "_blank", "noopener,noreferrer");
        setActionMessage("Impersonation session opened in a new tab.");
        return;
      }
      if (response.token) {
        setActionMessage("Impersonation token issued. Connect to the Care app to use it.");
        return;
      }
      setActionMessage("Impersonation request completed.");
    } catch {
      setActionMessage("Unable to impersonate. Check permissions or API status.");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading organization...</p>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card className="space-y-4">
        <p className="text-sm text-slate-300">Organization not found.</p>
        {error ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={handleRetry}
              >
                Retry
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-slate-400"
                onClick={handleUseSample}
              >
                Use Sample Data
              </button>
            </div>
          </div>
        ) : null}
        <Link href="/organizations" className="inline-flex text-sm text-accent-400">
          Back to organizations
        </Link>
      </Card>
    );
  }

  const usersPercent = organization.usersLimit
    ? Math.min(100, Math.round((organization.usersUsed / organization.usersLimit) * 100))
    : 0;
  const clientsPercent = organization.clientsLimit
    ? Math.min(100, Math.round((organization.clientsUsed / organization.clientsLimit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/organizations" className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Organizations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold text-white">{organization.name}</h2>
            <PlanBadge plan={organization.plan} />
            <StatusBadge status={organization.status} />
          </div>
          <p className="text-sm text-slate-400">{organization.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OrganizationActions
            organization={organization}
            onSuspendToggle={handleSuspendToggle}
            onImpersonate={handleImpersonate}
            variant="button"
          />
        </div>
      </div>

      {usingSample ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-500">
          Showing sample data
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
          {actionMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              activeTab === tab
                ? "bg-accent-500/20 text-accent-300"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organization Details</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-200">
                <div>Name: {organization.name}</div>
                <div>Slug: {organization.slug}</div>
                <div>Subdomain: {subdomain}</div>
                <div>Billing Email: {organization.billingEmail || "—"}</div>
                <div>Created: {formatDate(organization.createdAt)}</div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Usage & Limits</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div>
                  Users: {organization.usersUsed}/{organization.usersLimit}
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-accent-500" style={{ width: `${usersPercent}%` }} />
                  </div>
                </div>
                <div>
                  Clients: {organization.clientsUsed}/{organization.clientsLimit}
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-accent-500" style={{ width: `${clientsPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Health Score</p>
            <HealthScore score={organization.healthScore} showDetails />
            <div className="text-sm text-slate-400">
              Last activity: {formatDate(organization.lastActivityAt)}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "Subscription" ? (
        <Card>
          <p className="text-sm text-slate-300">Subscription details will render here.</p>
        </Card>
      ) : null}

      {activeTab === "Users" ? (
        <Card>
          <p className="text-sm text-slate-300">User list and roles will render here.</p>
        </Card>
      ) : null}

      {activeTab === "Activity" ? (
        <Card>
          <p className="text-sm text-slate-300">Activity timeline will render here.</p>
        </Card>
      ) : null}

      {activeTab === "Support" ? (
        <Card>
          <p className="text-sm text-slate-300">Support tickets for this org will render here.</p>
        </Card>
      ) : null}
    </div>
  );
}
