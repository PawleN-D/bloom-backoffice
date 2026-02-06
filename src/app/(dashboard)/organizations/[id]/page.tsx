"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import Card from "@/components/Card";
import HealthScore from "@/components/HealthScore";
import OrganizationActions from "@/components/OrganizationActions";
import PlanBadge from "@/components/PlanBadge";
import StatusBadge from "@/components/StatusBadge";
import { organizationSummaries } from "@/data/mock";
import {
  fetchOrganization,
  fetchOrganizationActivity,
  fetchOrganizationSubscription,
  fetchOrganizationTickets,
  fetchOrganizationUsers,
} from "@/lib/api/organizations";
import { getOrganizationUrl } from "@/lib/utils/subdomain";
import type {
  OrganizationActivity,
  OrganizationSummary,
  OrganizationUser,
  SubscriptionSummary,
  SupportTicketSummary,
} from "@/types";

const tabs = ["Overview", "Subscription", "Users", "Activity", "Support"] as const;

type Tab = (typeof tabs)[number];

type TabState = {
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

function formatRelative(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [activity, setActivity] = useState<OrganizationActivity[]>([]);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);

  const [tabState, setTabState] = useState<Record<Tab, TabState>>({
    Overview: { loading: false, error: null, loaded: true },
    Subscription: { loading: false, error: null, loaded: false },
    Users: { loading: false, error: null, loaded: false },
    Activity: { loading: false, error: null, loaded: false },
    Support: { loading: false, error: null, loaded: false },
  });

  useEffect(() => {
    setActiveTab("Overview");
    setSubscription(null);
    setUsers([]);
    setActivity([]);
    setTickets([]);
    setTabState({
      Overview: { loading: false, error: null, loaded: true },
      Subscription: { loading: false, error: null, loaded: false },
      Users: { loading: false, error: null, loaded: false },
      Activity: { loading: false, error: null, loaded: false },
      Support: { loading: false, error: null, loaded: false },
    });
  }, [id]);

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

  useEffect(() => {
    const current = tabState[activeTab];
    if (current.loaded || current.loading || activeTab === "Overview") {
      return;
    }

    const loadTab = async () => {
      setTabState((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], loading: true, error: null },
      }));
      try {
        if (activeTab === "Subscription") {
          const data = await fetchOrganizationSubscription(id);
          setSubscription(data);
        }
        if (activeTab === "Users") {
          const data = await fetchOrganizationUsers(id);
          setUsers(data);
        }
        if (activeTab === "Activity") {
          const data = await fetchOrganizationActivity(id);
          setActivity(data);
        }
        if (activeTab === "Support") {
          const data = await fetchOrganizationTickets(id);
          setTickets(data);
        }
        setTabState((prev) => ({
          ...prev,
          [activeTab]: { loading: false, error: null, loaded: true },
        }));
      } catch {
        setTabState((prev) => ({
          ...prev,
          [activeTab]: {
            loading: false,
            error: "Unable to load tab data. Check API connectivity.",
            loaded: true,
          },
        }));
      }
    };

    void loadTab();
  }, [activeTab, id, tabState]);

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

  const subdomain = useMemo(() => organization?.subdomain ?? null, [organization]);
  const organizationUrl = useMemo(
    () => (subdomain ? getOrganizationUrl(subdomain) : null),
    [subdomain]
  );

  const handleSuspendToggle = () => {
    if (!organization) return;
    setOrganization({
      ...organization,
      status: organization.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
    });
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
            variant="button"
          />
        </div>
      </div>

      {usingSample ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-500">
          Showing sample data
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
                <div>Subdomain: {subdomain ?? "—"}</div>
                <div>
                  Organization URL:{" "}
                  {organizationUrl ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <a
                        href={organizationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-accent-300 hover:underline"
                      >
                        {organizationUrl}
                      </a>
                      <button
                        type="button"
                        className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400"
                        onClick={() => {
                          void navigator.clipboard.writeText(organizationUrl);
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-accent-500/20 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-accent-200"
                        onClick={() => {
                          window.open(`${organizationUrl}/login`, "_blank", "noopener,noreferrer");
                        }}
                      >
                        Open
                      </button>
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
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
        <Card className="space-y-4">
          {tabState.Subscription.loading ? (
            <p className="text-sm text-slate-300">Loading subscription...</p>
          ) : tabState.Subscription.error ? (
            <p className="text-sm text-danger-500">{tabState.Subscription.error}</p>
          ) : subscription ? (
            <div className="grid gap-3 text-sm text-slate-300">
              <div>Plan: {subscription.plan}</div>
              <div>Billing Cycle: {subscription.billingCycle}</div>
              <div>Status: {subscription.status}</div>
              <div>MRR: €{subscription.mrr}</div>
              <div>Next Billing: {formatDate(subscription.nextBillingDate)}</div>
              <div>Payment Status: {subscription.paymentStatus}</div>
              <div>Trial Ends: {formatDate(subscription.trialEndsAt)}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No subscription data available.</p>
          )}
        </Card>
      ) : null}

      {activeTab === "Users" ? (
        <Card className="space-y-4">
          {tabState.Users.loading ? (
            <p className="text-sm text-slate-300">Loading users...</p>
          ) : tabState.Users.error ? (
            <p className="text-sm text-danger-500">{tabState.Users.error}</p>
          ) : users.length ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-slate-200">{user.name}</td>
                      <td className="px-4 py-3 text-slate-300">{user.email}</td>
                      <td className="px-4 py-3 text-slate-300">{user.role}</td>
                      <td className="px-4 py-3 text-slate-300">{user.status}</td>
                      <td className="px-4 py-3 text-slate-400">{formatRelative(user.lastLoginAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No users found for this organization.</p>
          )}
        </Card>
      ) : null}

      {activeTab === "Activity" ? (
        <Card className="space-y-4">
          {tabState.Activity.loading ? (
            <p className="text-sm text-slate-300">Loading activity...</p>
          ) : tabState.Activity.error ? (
            <p className="text-sm text-danger-500">{tabState.Activity.error}</p>
          ) : activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3">
                  <div className="text-sm text-slate-200">{item.message}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.actor} • {formatRelative(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          )}
        </Card>
      ) : null}

      {activeTab === "Support" ? (
        <Card className="space-y-4">
          {tabState.Support.loading ? (
            <p className="text-sm text-slate-300">Loading tickets...</p>
          ) : tabState.Support.error ? (
            <p className="text-sm text-danger-500">{tabState.Support.error}</p>
          ) : tickets.length ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3">
                  <div className="text-sm text-slate-200">{ticket.subject}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Status: {ticket.status} • Priority: {ticket.priority} • {formatRelative(ticket.createdAt)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Assigned: {ticket.assignee}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No support tickets found.</p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
