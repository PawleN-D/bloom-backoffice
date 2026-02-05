"use client";

import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

export default function DataTable<T>({
  table,
  onRowClick,
}: {
  table: Table<T>;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3">
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center gap-2 text-left"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-[10px] text-slate-500">
                        {header.column.getIsSorted() === "asc"
                          ? "▲"
                          : header.column.getIsSorted() === "desc"
                          ? "▼"
                          : "↕"}
                      </span>
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/10">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td className="px-6 py-10 text-center text-sm text-slate-400" colSpan={table.getAllColumns().length}>
                No organizations match this filter set.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="transition hover:bg-slate-900/40"
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
