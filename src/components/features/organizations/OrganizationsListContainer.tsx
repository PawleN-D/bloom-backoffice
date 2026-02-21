"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Card from "@/components/Card";
import HealthScore from "@/components/HealthScore";
import OrganizationActions from "@/components/OrganizationActions";
import PlanBadge from "@/components/PlanBadge";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizationsFilters } from "@/components/organizations/OrganizationsFilters";
import { OrganizationsList } from "@/components/organizations/OrganizationsList";
import { OrganizationsListSkeleton } from "@/components/organizations/OrganizationsListSkeleton";
import { OrganizationCard, type OrganizationRiskDetail } from "@/components/organizations/OrganizationCard";
import { useAuth } from "@/contexts/AuthContext";
import { suspendOrganization, unsuspendOrganization } from "@/lib/api/organizations";
import { useOrgRisks } from "@/lib/hooks/api/useOrgRisks";
import { useOrganizations } from "@/lib/hooks/api/useOrganizations";
import { hasPermission } from "@/lib/rbac";
import { getOrganizationUrl } from "@/lib/utils/subdomain";
import type { OrgRiskItem, OrganizationSummary } from "@/types";
import { formatDistanceToNow } from "date-fns";

const planOptions = [
  { label: "All", value: "ALL" },
  { label: "Free", value: "FREE" },
  { label: "Starter", value: "STARTER" },
  { label: "Professional", value: "PROFESSIONAL" },
  { label: "Enterprise", value: "ENTERPRISE" },
];

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Trial", value: "TRIAL" },
  { label: "Suspended", value: "SUSPENDED" },
];

const healthOptions = [
  { label: "All", value: "ALL" },
  { label: "High (80-100)", value: "HIGH" },
  { label: "Medium (50-79)", value: "MEDIUM" },
  { label: "Low (0-49)", value: "LOW" },
];

const riskOptions = [
  { label: "All Orgs", value: "all" },
  { label: "Critical Issues", value: "critical" },
  { label: "At Risk", value: "at-risk" },
  { label: "Healthy", value: "healthy" },
];

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type RiskLevel = "CRITICAL" | "WARNING" | "HEALTHY";

type OrganizationRiskSummary = {
  level: RiskLevel;
  items: OrganizationRiskDetail[];
  shortLabel: string;
};

function formatRelativeDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
}

function usagePercent(used: number, limit: number) {
  if (!limit) return 0;
  return Math.round((used / limit) * 100);
}

function resolveRiskLink(item: OrgRiskItem) {
  if (item.issue === "EMAIL_DELIVERY_FAILED") {
    return `/emails?org=${item.orgId}`;
  }
  if (
    item.issue === "USERS_NEVER_LOGGED_IN" ||
    item.issue === "SETUP_INCOMPLETE" ||
    item.issue === "ALL_USERS_INACTIVE_30_DAYS"
  ) {
    return `/organizations/${item.orgId}?tab=Users`;
  }
  return `/organizations/${item.orgId}`;
}

function getUsageRiskDetails(
  organization: OrganizationSummary
): OrganizationRiskDetail[] {
  const items: OrganizationRiskDetail[] = [];
  const userPct = usagePercent(organization.usersUsed, organization.usersLimit);
  const clientPct = usagePercent(organization.clientsUsed, organization.clientsLimit);

  if (userPct >= 95) {
    items.push({
      issue: "Near user capacity",
      description: `${organization.usersUsed}/${organization.usersLimit} users used`,
      severity: "CRITICAL",
      link: `/organizations/${organization.id}`,
    });
  } else if (userPct > 80) {
    items.push({
      issue: "Approaching user limit",
      description: `${organization.usersUsed}/${organization.usersLimit} users used`,
      severity: "WARNING",
      link: `/organizations/${organization.id}`,
    });
  }

  if (clientPct >= 95) {
    items.push({
      issue: "Near client capacity",
      description: `${organization.clientsUsed}/${organization.clientsLimit} clients used`,
      severity: "CRITICAL",
      link: `/organizations/${organization.id}`,
    });
  } else if (clientPct > 80) {
    items.push({
      issue: "Approaching client limit",
      description: `${organization.clientsUsed}/${organization.clientsLimit} clients used`,
      severity: "WARNING",
      link: `/organizations/${organization.id}`,
    });
  }

  return items;
}

function getInactivityRiskDetail(organization: OrganizationSummary) {
  if (!organization.lastActivityAt) {
    return {
      issue: "No recent activity",
      description: "No activity timestamp available",
      severity: "WARNING" as const,
      link: `/organizations/${organization.id}?tab=Activity`,
    };
  }

  const lastActivity = new Date(organization.lastActivityAt).getTime();
  if (Number.isNaN(lastActivity)) return null;
  const daysInactive = Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000));

  if (daysInactive >= 30) {
    return {
      issue: "All users inactive 30+ days",
      description: `Last activity ${daysInactive} days ago`,
      severity: "CRITICAL" as const,
      link: `/organizations/${organization.id}?tab=Users`,
    };
  }

  if (daysInactive >= 14) {
    return {
      issue: "Inactivity warning",
      description: `Last activity ${daysInactive} days ago`,
      severity: "WARNING" as const,
      link: `/organizations/${organization.id}?tab=Activity`,
    };
  }

  return null;
}

function levelFromItems(items: OrganizationRiskDetail[]): RiskLevel {
  if (items.some((item) => item.severity === "CRITICAL")) return "CRITICAL";
  if (items.some((item) => item.severity === "WARNING")) return "WARNING";
  return "HEALTHY";
}

function shortRiskLabel(level: RiskLevel, items: OrganizationRiskDetail[]) {
  if (level === "HEALTHY") return "Healthy";
  const first = items[0];
  if (!first) return level === "CRITICAL" ? "Critical" : "Warning";
  return first.issue;
}

export function OrganizationsListContainer() {
  const { user } = useAuth();
  const { data: orgRows, isLoading, error, refetch, setData: setRows } = useOrganizations();
  const { data: riskData, isLoading: risksLoading } = useOrgRisks();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, planFilter, statusFilter, healthFilter, riskFilter]);

  const canCreateOrg = hasPermission(user, "org.create");
  const canManageOrg = hasPermission(user, "org.manage");
  const canViewSubscription = hasPermission(user, "subscription.view");
  const canViewActivity = hasPermission(user, "analytics.view");

  const riskByOrgId = useMemo(() => {
    const map = new Map<string, OrganizationRiskSummary>();

    orgRows.forEach((org) => {
      const fromRiskApi = [
        ...(riskData?.critical ?? []),
        ...(riskData?.attention ?? []),
      ].filter((riskItem) => riskItem.orgId === org.id);

      const apiRiskItems: OrganizationRiskDetail[] = fromRiskApi.map((item) => ({
        issue: item.issue,
        description: item.description,
        severity: item.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
        link: resolveRiskLink(item),
      }));

      const usageItems = getUsageRiskDetails(org);
      const inactivityItem = getInactivityRiskDetail(org);

      const combinedItems = [
        ...apiRiskItems,
        ...usageItems,
        ...(inactivityItem ? [inactivityItem] : []),
      ];

      const deduped = combinedItems.filter((item, index, arr) => {
        return arr.findIndex((target) => target.issue === item.issue) === index;
      });

      const level = levelFromItems(deduped);
      map.set(org.id, {
        level,
        items: deduped,
        shortLabel: shortRiskLabel(level, deduped),
      });
    });

    return map;
  }, [orgRows, riskData]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orgRows.filter((row) => {
      const risk = riskByOrgId.get(row.id);
      const level = risk?.level ?? "HEALTHY";

      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.slug.toLowerCase().includes(term) ||
        row.billingEmail.toLowerCase().includes(term) ||
        row.subdomain?.toLowerCase().includes(term);

      const matchesPlan = planFilter === "ALL" || row.plan === planFilter;
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      const matchesHealth =
        healthFilter === "ALL" ||
        (healthFilter === "HIGH" && row.healthScore >= 80) ||
        (healthFilter === "MEDIUM" && row.healthScore >= 50 && row.healthScore < 80) ||
        (healthFilter === "LOW" && row.healthScore < 50);

      const matchesRisk =
        riskFilter === "all" ||
        (riskFilter === "critical" && level === "CRITICAL") ||
        (riskFilter === "at-risk" && level !== "HEALTHY") ||
        (riskFilter === "healthy" && level === "HEALTHY");

      return matchesSearch && matchesPlan && matchesStatus && matchesHealth && matchesRisk;
    });
  }, [healthFilter, orgRows, planFilter, riskByOrgId, riskFilter, search, statusFilter]);

  const handleSuspendToggle = useCallback(
    async (id: string) => {
      if (!canManageOrg) return;
      const target = orgRows.find((item) => item.id === id);
      if (!target) return;

      const isSuspended = target.status === "SUSPENDED";
      try {
        if (isSuspended) {
          await unsuspendOrganization(id);
        } else {
          await suspendOrganization(id);
        }
        setRows((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, status: isSuspended ? "ACTIVE" : "SUSPENDED" }
              : item
          )
        );
      } catch {
        setInlineError("Unable to update organization status. Please try again.");
      }
    },
    [canManageOrg, orgRows, setRows]
  );

  const columns = useMemo<ColumnDef<OrganizationSummary>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-white">{row.original.name}</div>
            <div className="text-xs text-slate-500">{row.original.slug}</div>
          </div>
        ),
      },
      {
        accessorKey: "subdomain",
        header: "Subdomain",
        cell: ({ row }) => {
          if (!row.original.subdomain) {
            return <span className="text-xs text-slate-500">-</span>;
          }
          const orgUrl = getOrganizationUrl(row.original.subdomain);
          return (
            <a
              href={orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-accent-300 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {orgUrl}
            </a>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "risk",
        header: "Risk Flags",
        cell: ({ row }) => {
          const risk = riskByOrgId.get(row.original.id);
          if (!risk || risk.level === "HEALTHY") {
            return <Badge variant="success">Healthy</Badge>;
          }
          if (risk.level === "CRITICAL") {
            return <Badge variant="error">Critical: {risk.shortLabel}</Badge>;
          }
          return <Badge variant="warning">Warning: {risk.shortLabel}</Badge>;
        },
      },
      {
        id: "users",
        header: "Users",
        cell: ({ row }) => {
          const used = row.original.usersUsed;
          const limit = row.original.usersLimit;
          const pct = usagePercent(used, limit);
          return (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
              <span>
                {used}/{limit}
              </span>
              {pct > 80 && pct < 95 ? <Badge variant="warning">Approaching Limit</Badge> : null}
              {pct >= 95 ? <Badge variant="error">Near Capacity</Badge> : null}
            </div>
          );
        },
      },
      {
        id: "clients",
        header: "Clients",
        cell: ({ row }) => {
          const used = row.original.clientsUsed;
          const limit = row.original.clientsLimit;
          const pct = usagePercent(used, limit);
          return (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
              <span>
                {used}/{limit}
              </span>
              {pct > 80 && pct < 95 ? <Badge variant="warning">Approaching Limit</Badge> : null}
              {pct >= 95 ? <Badge variant="error">Near Capacity</Badge> : null}
            </div>
          );
        },
      },
      {
        accessorKey: "healthScore",
        header: "Health",
        cell: ({ row }) => <HealthScore score={row.original.healthScore} />,
      },
      {
        accessorKey: "lastActivityAt",
        header: "Last Activity",
        cell: ({ row }) => (
          <span className="text-sm text-slate-400">
            {formatRelativeDate(row.original.lastActivityAt)}
          </span>
        ),
      },
      {
        id: "mrr",
        header: "MRR",
        cell: ({ row }) => (
          <span className="text-sm text-slate-200">
            {currencyFormatter.format(row.original.mrr)}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <OrganizationActions
            organization={row.original}
            onSuspendToggle={handleSuspendToggle}
            permissions={{
              canEdit: canManageOrg,
              canSuspend: canManageOrg,
              canDelete: canManageOrg,
              canViewSubscription,
              canViewActivity,
            }}
          />
        ),
      },
    ],
    [canManageOrg, canViewActivity, canViewSubscription, handleSuspendToggle, riskByOrgId]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => (row.original as OrganizationSummary).id);

  const activeCount = orgRows.filter((row) => row.status === "ACTIVE").length;

  const handleSuspendSelected = () => {
    if (selectedIds.length === 0 || !canManageOrg) return;
    Promise.allSettled(selectedIds.map((id) => suspendOrganization(id))).then((results) => {
      const hasFailure = results.some((result) => result.status === "rejected");
      setRows((prev) =>
        prev.map((row) =>
          selectedIds.includes(row.id) ? { ...row, status: "SUSPENDED" } : row
        )
      );
      setRowSelection({});
      if (hasFailure) {
        setInlineError("Some organizations could not be suspended.");
      }
    });
  };

  const handleExportCsv = () => {
    const headers = [
      "Organization",
      "Subdomain",
      "Plan",
      "Status",
      "Risk",
      "Users",
      "Clients",
      "MRR",
      "Health",
      "Last Activity",
    ];
    const lines = filteredRows.map((row) => {
      const risk = riskByOrgId.get(row.id);
      return [
        row.name,
        row.subdomain ? getOrganizationUrl(row.subdomain) : "",
        row.plan,
        row.status,
        risk?.shortLabel ?? "Healthy",
        `${row.usersUsed}/${row.usersLimit}`,
        `${row.clientsUsed}/${row.clientsLimit}`,
        currencyFormatter.format(row.mrr),
        row.healthScore,
        row.lastActivityAt ?? "",
      ];
    });
    const csv = [headers.join(","), ...lines.map((line) => line.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "organizations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const expandedOrganization = expandedOrgId
    ? orgRows.find((organization) => organization.id === expandedOrgId) ?? null
    : null;
  const expandedRiskSummary = expandedOrganization
    ? riskByOrgId.get(expandedOrganization.id)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white">Organizations</h2>
          <p className="mt-2 text-sm text-slate-400">
            Search, filter, and manage customer organizations with risk-first context.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            Active: {activeCount}
          </div>
          {canCreateOrg ? (
            <Link href="/organizations/new">
              <Button>New Organization</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card className="space-y-6">
        <OrganizationsFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          planFilter={planFilter}
          onPlanFilterChange={setPlanFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          healthFilter={healthFilter}
          onHealthFilterChange={setHealthFilter}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          planOptions={planOptions}
          statusOptions={statusOptions}
          healthOptions={healthOptions}
          riskOptions={riskOptions}
        />

        {error || inlineError ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {inlineError ?? error}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {isLoading || risksLoading ? (
        <OrganizationsListSkeleton />
      ) : (
        <OrganizationsList
          table={table}
          filteredCount={filteredRows.length}
          canManageOrg={canManageOrg}
          selectedIds={selectedIds}
          onExportCsv={handleExportCsv}
          onSuspendSelected={handleSuspendSelected}
          onRowClick={(row) =>
            setExpandedOrgId((current) => (current === row.id ? null : row.id))
          }
        />
      )}

      {expandedOrganization ? (
        <OrganizationCard
          organization={expandedOrganization}
          risks={expandedRiskSummary?.items ?? []}
        />
      ) : null}
    </div>
  );
}
