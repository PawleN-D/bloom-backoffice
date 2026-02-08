"use client";

export const runtime = "edge";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import Card from "@/components/Card";
import HealthScore from "@/components/HealthScore";
import OrganizationActions from "@/components/OrganizationActions";
import PlanBadge from "@/components/PlanBadge";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/rbac";
import {
  fetchOrganization,
  fetchOrganizationActivity,
  fetchOrganizationSubscription,
  fetchOrganizationTickets,
  fetchOrganizationUsers,
  createOrganizationUser,
  deactivateOrganizationUser,
  reactivateOrganizationUser,
  updateOrganizationUserRole,
  suspendOrganization,
  unsuspendOrganization,
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

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type TabState = {
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

function formatRelative(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setInviteToken(null);
    setUserActionError(null);
    setUserActionId(null);
    setUserForm({ email: "", firstName: "", lastName: "", role: "WORKER" });
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
      })
      .catch(() => {
        setError("Unable to load organization. Check API connectivity.");
        setOrganization(null);
      })
      .finally(() => setIsLoading(false));
  };

  const subdomain = useMemo(() => organization?.subdomain ?? null, [organization]);
  const organizationUrl = useMemo(
    () => (subdomain ? getOrganizationUrl(subdomain) : null),
    [subdomain]
  );

  const canManageOrg = hasPermission(user, "org.manage");
  const canViewSubscription = hasPermission(user, "subscription.view");
  const canViewActivity = hasPermission(user, "analytics.view");
  const canViewSupport = hasPermission(user, "support.view");
  const canManageUsers = hasPermission(user, "user.manage");

  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "WORKER",
  });
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const handleSuspendToggle = async () => {
    if (!organization || !canManageOrg) return;
    const isSuspended = organization.status === "SUSPENDED";
    try {
      if (isSuspended) {
        await unsuspendOrganization(organization.id);
      } else {
        await suspendOrganization(organization.id);
      }
      setOrganization({
        ...organization,
        status: isSuspended ? "ACTIVE" : "SUSPENDED",
      });
    } catch {
      setError("Unable to update organization status. Please try again.");
    }
  };

  const handleInviteUser = async () => {
    if (!canManageUsers) return;
    if (!userForm.email.trim()) {
      setUserActionError("Email is required to invite a user.");
      return;
    }
    setUserActionError(null);
    setInviteToken(null);
    setUserActionId("invite");
    try {
      const result = await createOrganizationUser(id, {
        email: userForm.email.trim(),
        firstName: userForm.firstName.trim() || undefined,
        lastName: userForm.lastName.trim() || undefined,
        role: userForm.role,
      });
      setUsers((prev) => [result.user, ...prev]);
      setInviteToken(result.invitationToken ?? null);
      setUserForm({ email: "", firstName: "", lastName: "", role: "WORKER" });
    } catch {
      setUserActionError("Unable to invite user. Check API connectivity.");
    } finally {
      setUserActionId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!canManageUsers) return;
    setUserActionError(null);
    setUserActionId(userId);
    try {
      const updated = await updateOrganizationUserRole(id, userId, role);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role: updated.role } : user))
      );
    } catch {
      setUserActionError("Unable to update user role.");
    } finally {
      setUserActionId(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!canManageUsers) return;
    setUserActionError(null);
    setUserActionId(userId);
    try {
      await deactivateOrganizationUser(id, userId);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isActive: false } : user))
      );
    } catch {
      setUserActionError("Unable to deactivate user.");
    } finally {
      setUserActionId(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    if (!canManageUsers) return;
    setUserActionError(null);
    setUserActionId(userId);
    try {
      await reactivateOrganizationUser(id, userId);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isActive: true } : user))
      );
    } catch {
      setUserActionError("Unable to reactivate user.");
    } finally {
      setUserActionId(null);
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
            permissions={{
              canEdit: canManageOrg,
              canSuspend: canManageOrg,
              canDelete: canManageOrg,
              canViewSubscription,
              canViewActivity,
            }}
          />
        </div>
      </div>

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
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Organization Details
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-200">
                <div>Name: {organization.name}</div>
                <div>Slug: {organization.slug}</div>
                <div>Subdomain: {subdomain ?? "-"}</div>
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
                    "-"
                  )}
                </div>
                <div>Billing Email: {organization.billingEmail || "-"}</div>
                <div>Created: {formatDate(organization.createdAt)}</div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Usage & Limits</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div>
                  Users: {organization.usersUsed}/{organization.usersLimit}
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-accent-500"
                      style={{ width: `${usersPercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  Clients: {organization.clientsUsed}/{organization.clientsLimit}
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-accent-500"
                      style={{ width: `${clientsPercent}%` }}
                    />
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
        !canViewSubscription ? (
          <Card>
            <p className="text-sm text-slate-300">
              You do not have permission to view subscription details.
            </p>
          </Card>
        ) : (
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
              <div>MRR: {currencyFormatter.format(subscription.mrr)}</div>
              <div>Next Billing: {formatDate(subscription.nextBillingDate)}</div>
              <div>Payment Status: {subscription.paymentStatus}</div>
              <div>Trial Ends: {formatDate(subscription.trialEndsAt)}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No subscription data available.</p>
          )}
        </Card>
        )
      ) : null}

      {activeTab === "Users" ? (
        <Card className="space-y-4">
          {tabState.Users.loading ? (
            <p className="text-sm text-slate-300">Loading users...</p>
          ) : tabState.Users.error ? (
            <p className="text-sm text-danger-500">{tabState.Users.error}</p>
          ) : (
            <>
              {canManageUsers ? (
                <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Invite User
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <input
                      className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      placeholder="Email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                    <input
                      className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      placeholder="First name"
                      value={userForm.firstName}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                    />
                    <input
                      className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      placeholder="Last name"
                      value={userForm.lastName}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                    />
                    <select
                      className="rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, role: event.target.value }))
                      }
                    >
                      {["WORKER", "MANAGER", "ADMIN", "ORG_OWNER"].map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-md bg-accent-500/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-accent-200"
                      onClick={handleInviteUser}
                      disabled={userActionId === "invite"}
                    >
                      {userActionId === "invite" ? "Inviting..." : "Send Invite"}
                    </button>
                    {inviteToken ? (
                      <span className="text-xs text-slate-400">
                        Invite token: <span className="font-mono text-slate-200">{inviteToken}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  You do not have permission to invite users.
                </p>
              )}

              {userActionError ? (
                <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
                  {userActionError}
                </div>
              ) : null}

              {users.length ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Access</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((userRow) => (
                        <tr key={userRow.id}>
                          <td className="px-4 py-3 text-slate-200">{userRow.name}</td>
                          <td className="px-4 py-3 text-slate-300">{userRow.email}</td>
                          <td className="px-4 py-3">
                            {canManageUsers ? (
                              <select
                                className="rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
                                value={userRow.role}
                                onChange={(event) =>
                                  handleRoleChange(userRow.id, event.target.value)
                                }
                                disabled={userActionId === userRow.id}
                              >
                                {["WORKER", "MANAGER", "ADMIN", "ORG_OWNER"].map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-slate-300">{userRow.role}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <StatusBadge status={userRow.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {userRow.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-4 py-3">
                            {canManageUsers ? (
                              <button
                                type="button"
                                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200"
                                onClick={() =>
                                  userRow.isActive
                                    ? handleDeactivate(userRow.id)
                                    : handleReactivate(userRow.id)
                                }
                                disabled={userActionId === userRow.id}
                              >
                                {userRow.isActive ? "Deactivate" : "Reactivate"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No users found for this organization.</p>
              )}
            </>
          )}
        </Card>
      ) : null}

      {activeTab === "Activity" ? (
        !canViewActivity ? (
          <Card>
            <p className="text-sm text-slate-300">
              You do not have permission to view activity logs.
            </p>
          </Card>
        ) : (
        <Card className="space-y-4">
          {tabState.Activity.loading ? (
            <p className="text-sm text-slate-300">Loading activity...</p>
          ) : tabState.Activity.error ? (
            <p className="text-sm text-danger-500">{tabState.Activity.error}</p>
          ) : activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-sm text-slate-200">{item.message}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.actor} - {formatRelative(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          )}
        </Card>
        )
      ) : null}

      {activeTab === "Support" ? (
        !canViewSupport ? (
          <Card>
            <p className="text-sm text-slate-300">
              You do not have permission to view support tickets.
            </p>
          </Card>
        ) : (
        <Card className="space-y-4">
          {tabState.Support.loading ? (
            <p className="text-sm text-slate-300">Loading tickets...</p>
          ) : tabState.Support.error ? (
            <p className="text-sm text-danger-500">{tabState.Support.error}</p>
          ) : tickets.length ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-sm text-slate-200">{ticket.subject}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Status: {ticket.status} - Priority: {ticket.priority} -{" "}
                    {formatRelative(ticket.createdAt)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Assigned: {ticket.assignee}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No support tickets found.</p>
          )}
        </Card>
        )
      ) : null}
    </div>
  );
}
