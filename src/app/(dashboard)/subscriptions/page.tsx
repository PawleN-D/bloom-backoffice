"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import FilterDropdown from "@/components/FilterDropdown";
import PlanBadge from "@/components/PlanBadge";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSubscriptions } from "@/lib/api/subscriptions";
import { hasPermission } from "@/lib/rbac";
import type { SubscriptionRow } from "@/types";
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
  { label: "Past Due", value: "PAST_DUE" },
  { label: "Paused", value: "SUSPENDED" },
];

const billingOptions = [
  { label: "All", value: "ALL" },
  { label: "Monthly", value: "MONTHLY" },
  { label: "Annual", value: "ANNUAL" },
];

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatRelativeDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canView = hasPermission(user, "subscription.view");
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [billingFilter, setBillingFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      setError("You do not have access to view subscriptions.");
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchSubscriptions()
      .then((data) => {
        if (!isMounted) return;
        setRows(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load subscriptions. Check API connectivity.");
        setRows([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canView]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, planFilter, statusFilter, billingFilter]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term || row.organizationName.toLowerCase().includes(term);
      const matchesPlan = planFilter === "ALL" || row.plan === planFilter;
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      const matchesBilling = billingFilter === "ALL" || row.billingCycle === billingFilter;
      return matchesSearch && matchesPlan && matchesStatus && matchesBilling;
    });
  }, [rows, search, planFilter, statusFilter, billingFilter]);

  const columns = useMemo<ColumnDef<SubscriptionRow>[]>(
    () => [
      {
        accessorKey: "organizationName",
        header: "Organization",
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-white">
              {row.original.organizationName}
            </div>
            <div className="text-xs text-slate-500">{row.original.organizationId}</div>
          </div>
        ),
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
        accessorKey: "billingCycle",
        header: "Billing",
        cell: ({ row }) => (
          <span className="text-sm text-slate-200">{row.original.billingCycle}</span>
        ),
      },
      {
        accessorKey: "mrr",
        header: "MRR",
        cell: ({ row }) => (
          <span className="text-sm text-slate-200">
            {currencyFormatter.format(row.original.mrr)}
          </span>
        ),
      },
      {
        accessorKey: "nextBillingDate",
        header: "Next Billing",
        cell: ({ row }) => (
          <span className="text-sm text-slate-400">
            {formatRelativeDate(row.original.nextBillingDate)}
          </span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <span className="text-sm text-slate-300">{row.original.paymentStatus}</span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/subscriptions/${row.original.organizationId}`)}
          >
            View
          </Button>
        ),
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalMrr = rows.reduce((sum, row) => sum + row.mrr, 0);
  const totalArr = totalMrr * 12;
  const activeCount = rows.filter((row) => row.status === "ACTIVE").length;
  const trialsEndingSoon = rows.filter((row) => {
    if (!row.trialEndsAt) return false;
    const date = new Date(row.trialEndsAt);
    const diff = date.getTime() - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Subscriptions</h2>
        <p className="mt-2 text-sm text-slate-400">
          Review billing status, renewals, and plan coverage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total MRR</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {currencyFormatter.format(totalMrr)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total ARR</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {currencyFormatter.format(totalArr)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active Subs</p>
          <p className="mt-2 text-2xl font-semibold text-white">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trials Ending</p>
          <p className="mt-2 text-2xl font-semibold text-white">{trialsEndingSoon}</p>
        </Card>
      </div>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</label>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by organization name"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <FilterDropdown label="Plan" value={planFilter} onChange={setPlanFilter} options={planOptions} />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
            <FilterDropdown
              label="Billing"
              value={billingFilter}
              onChange={setBillingFilter}
              options={billingOptions}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        ) : null}
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-300">Loading subscriptions...</p>
        </Card>
      ) : (
        <>
          <DataTable table={table} onRowClick={(row) => router.push(`/subscriptions/${row.organizationId}`)} />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
