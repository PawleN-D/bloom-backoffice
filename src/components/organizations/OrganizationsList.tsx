"use client";

import type { Table } from "@tanstack/react-table";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "@/types";

interface OrganizationsListProps {
  table: Table<OrganizationSummary>;
  filteredCount: number;
  canManageOrg: boolean;
  selectedIds: string[];
  onExportCsv: () => void;
  onSuspendSelected: () => void;
  onRowClick: (row: OrganizationSummary) => void;
}

export function OrganizationsList({
  table,
  filteredCount,
  canManageOrg,
  selectedIds,
  onExportCsv,
  onSuspendSelected,
  onRowClick,
}: OrganizationsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {filteredCount} organization(s)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onExportCsv}>
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={onSuspendSelected}
            disabled={selectedIds.length === 0 || !canManageOrg}
            title={canManageOrg ? "" : "Insufficient permissions"}
          >
            Suspend Selected
          </Button>
        </div>
      </div>

      <DataTable table={table} onRowClick={onRowClick} />

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
    </div>
  );
}
