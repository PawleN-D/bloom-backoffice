"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Card from "@/components/Card";
import DataTable from "@/components/DataTable";
import FilterDropdown from "@/components/FilterDropdown";
import HealthScore from "@/components/HealthScore";
import OrganizationActions from "@/components/OrganizationActions";
import PlanBadge from "@/components/PlanBadge";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { organizationSummaries } from "@/data/mock";
import { fetchOrganizations } from "@/lib/api/organizations";
import type { OrganizationSummary } from "@/types";

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

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatRelativeDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<OrganizationSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchOrganizations()
      .then((data) => {
        if (!isMounted) return;
        setRows(data);
        setUsingSample(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load organizations. Check API connectivity.");
        setRows([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, planFilter, statusFilter, healthFilter]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchOrganizations()
      .then((data) => {
        setRows(data);
        setUsingSample(false);
      })
      .catch(() => {
        setError("Unable to load organizations. Check API connectivity.");
        setRows([]);
      })
      .finally(() => setIsLoading(false));
  };

  const handleUseSample = () => {
    setRows(organizationSummaries);
    setUsingSample(true);
    setError(null);
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.slug.toLowerCase().includes(term) ||
        row.billingEmail.toLowerCase().includes(term);

      const matchesPlan = planFilter === "ALL" || row.plan === planFilter;
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;

      const matchesHealth =
        healthFilter === "ALL" ||
        (healthFilter === "HIGH" && row.healthScore >= 80) ||
        (healthFilter === "MEDIUM" && row.healthScore >= 50 && row.healthScore < 80) ||
        (healthFilter === "LOW" && row.healthScore < 50);

      return matchesSearch && matchesPlan && matchesStatus && matchesHealth;
    });
  }, [rows, search, planFilter, statusFilter, healthFilter]);

  const handleSuspendToggle = useCallback((id: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }
          : item
      )
    );
  }, []);

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
        id: "users",
        header: "Users",
        cell: ({ row }) => (
          <div className="text-sm text-slate-200">
            {row.original.usersUsed}/{row.original.usersLimit}
          </div>
        ),
      },
      {
        id: "clients",
        header: "Clients",
        cell: ({ row }) => (
          <div className="text-sm text-slate-200">
            {row.original.clientsUsed}/{row.original.clientsLimit}
          </div>
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
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <OrganizationActions
            organization={row.original}
            onSuspendToggle={handleSuspendToggle}
          />
        ),
      },
    ],
    [handleSuspendToggle]
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

  const activeCount = rows.filter((row) => row.status === "ACTIVE").length;

  const handleSuspendSelected = () => {
    if (selectedIds.length === 0) {
      return;
    }
    setRows((prev) =>
      prev.map((row) => (selectedIds.includes(row.id) ? { ...row, status: "SUSPENDED" } : row))
    );
    setRowSelection({});
  };

  const handleExportCsv = () => {
    const headers = [
      "Organization",
      "Plan",
      "Status",
      "Users",
      "Clients",
      "MRR",
      "Health",
      "Last Activity",
    ];
    const lines = filteredRows.map((row) => [
      row.name,
      row.plan,
      row.status,
      `${row.usersUsed}/${row.usersLimit}`,
      `${row.clientsUsed}/${row.clientsLimit}`,
      currencyFormatter.format(row.mrr),
      row.healthScore,
      row.lastActivityAt ?? "",
    ]);
    const csv = [headers.join(","), ...lines.map((line) => line.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "organizations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white">Organizations</h2>
          <p className="mt-2 text-sm text-slate-400">
            Search, filter, and manage all customer organizations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            Active: {activeCount}
          </div>
          <Link href="/organizations/new">
            <Button>New Organization</Button>
          </Link>
        </div>
      </div>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</label>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by name, slug, or billing email"
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
              label="Health"
              value={healthFilter}
              onChange={setHealthFilter}
              options={healthOptions}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
              <Button variant="ghost" onClick={handleUseSample}>
                Use Sample Data
              </Button>
            </div>
          </div>
        ) : null}

        {usingSample ? (
          <div className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-500">
            Showing sample data
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {filteredRows.length} organization(s)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleExportCsv}>
              Export CSV
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendSelected}
              disabled={selectedIds.length === 0}
            >
              Suspend Selected
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-300">Loading organizations...</p>
        </Card>
      ) : (
        <>
          <DataTable table={table} onRowClick={(row) => router.push(`/organizations/${row.id}`)} />
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
