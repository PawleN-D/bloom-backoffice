"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Card from "@/components/Card";
import PlanBadge from "@/components/PlanBadge";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrganization } from "@/lib/api/organizations";
import {
  cancelSubscription,
  fetchSubscriptionDetail,
  fetchSubscriptionInvoices,
  pauseSubscription,
  resumeSubscription,
  updateSubscriptionPlan,
} from "@/lib/api/subscriptions";
import { hasPermission } from "@/lib/rbac";
import type { InvoiceSummary, OrganizationPlan, OrganizationSummary, SubscriptionSummary } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

interface SubscriptionDetailContainerProps {
  organizationId: string;
}

export function SubscriptionDetailContainer({ organizationId }: SubscriptionDetailContainerProps) {
  const id = organizationId;
  const { user } = useAuth();
  const canView = hasPermission(user, "subscription.view");
  const canManage = hasPermission(user, "subscription.manage");

  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<OrganizationPlan>("STARTER");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [org, sub, invoiceList] = await Promise.all([
        fetchOrganization(id),
        fetchSubscriptionDetail(id),
        fetchSubscriptionInvoices(id),
      ]);
      setOrganization(org);
      setSummary(sub);
      setInvoices(invoiceList);
      if (sub?.plan) {
        setSelectedPlan(sub.plan);
      } else {
        setSelectedPlan(org.plan);
      }
    } catch {
      setError("Unable to load subscription details. Check API connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      setError("You do not have permission to view subscriptions.");
      return;
    }
    void loadData();
  }, [id, canView]);

  const planOptions = useMemo(
    () => ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as OrganizationPlan[],
    []
  );

  const handlePlanChange = async () => {
    if (!summary || !canManage) return;
    if (selectedPlan === summary.plan) return;
    setActionLoading(true);
    try {
      await updateSubscriptionPlan(id, selectedPlan, summary.plan);
      await loadData();
    } catch {
      setError("Unable to update subscription plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseResume = async () => {
    if (!summary || !canManage) return;
    setActionLoading(true);
    try {
      if (summary.status === "SUSPENDED") {
        await resumeSubscription(id);
      } else {
        await pauseSubscription(id);
      }
      await loadData();
    } catch {
      setError("Unable to update subscription status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!canManage) return;
    if (!window.confirm("Cancel this subscription with a grace period?")) {
      return;
    }
    setActionLoading(true);
    try {
      await cancelSubscription(id);
      await loadData();
    } catch {
      setError("Unable to cancel subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading subscription...</p>
      </Card>
    );
  }

  if (!summary || !organization) {
    return (
      <Card>
        <p className="text-sm text-slate-300">
          {error ?? "Subscription not found."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Subscription</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">{organization.name}</h2>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-danger-500">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current Plan</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <PlanBadge plan={summary.plan} />
                <StatusBadge status={summary.status} />
              </div>
            </div>
            <div className="text-right text-sm text-slate-300">
              <div>{currencyFormatter.format(summary.mrr)} / month</div>
              <div className="text-xs text-slate-500">
                Next billing: {formatDate(summary.nextBillingDate)}
              </div>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-slate-300">
            <div>Billing Cycle: {summary.billingCycle}</div>
            <div>Payment Status: {summary.paymentStatus}</div>
            <div>Trial Ends: {formatDate(summary.trialEndsAt)}</div>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan Actions</p>
          <div className="space-y-3">
            <Select
              value={selectedPlan}
              onChange={(event) => setSelectedPlan(event.target.value as OrganizationPlan)}
              disabled={!canManage}
            >
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </Select>
            <Button onClick={handlePlanChange} disabled={!canManage || actionLoading}>
              Update Plan
            </Button>
            <Button
              variant="secondary"
              onClick={handlePauseResume}
              disabled={!canManage || actionLoading}
            >
              {summary.status === "SUSPENDED" ? "Resume Billing" : "Pause Billing"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!canManage || actionLoading}
            >
              Cancel Subscription
            </Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Billing History</p>
        {invoices.length ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 text-slate-200">{invoice.id}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(invoice.dueAt)}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {currencyFormatter.format(invoice.totalCents / 100)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No invoices found for this subscription.</p>
        )}
      </Card>
    </div>
  );
}
