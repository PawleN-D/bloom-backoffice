import type { ImportedUserRowError } from "@/types/models/user";

export function UserImportErrorBanner({ errors }: { errors: ImportedUserRowError[] }) {
  return (
    <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 p-4">
      <p className="mb-2 text-sm font-semibold text-danger-500">
        Fix these rows before importing:
      </p>
      <ul className="list-inside list-disc space-y-1 text-sm text-danger-500">
        {errors.map((error) => (
          <li key={error.row}>
            Row {error.row}: {error.errors.join(" \u00b7 ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
