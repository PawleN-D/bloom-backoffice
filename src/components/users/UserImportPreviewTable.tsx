import type { ImportedUser } from "@/types/models/user";

export function UserImportPreviewTable({ rows }: { rows: ImportedUser[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.2em] text-slate-500">
          <tr>
            {["#", "First Name", "Last Name", "Email", "Role", "Phone"].map((header) => (
              <th key={header} className="px-4 py-2 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.email}-${index}`} className="border-t border-white/10 hover:bg-slate-900/40">
              <td className="px-4 py-2 text-slate-500">{index + 1}</td>
              <td className="px-4 py-2 text-slate-200">{row.first_name}</td>
              <td className="px-4 py-2 text-slate-200">{row.last_name}</td>
              <td className="px-4 py-2 text-slate-200">{row.email}</td>
              <td className="px-4 py-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary-light">
                  {row.role}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-400">{row.phone || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-4 py-2 text-sm text-slate-400">
        {rows.length} user{rows.length !== 1 ? "s" : ""} ready to import
      </p>
    </div>
  );
}
