"use client";

import type { ImportedUser } from "@/types/models/user";
import { UserImportPanel } from "@/components/users/UserImportPanel";

interface UserImportModalProps {
  onClose: () => void;
  onImportReady: (rows: ImportedUser[]) => void;
}

export function UserImportModal({ onClose, onImportReady }: UserImportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close import dialog"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/10 bg-slate-950 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Import Users</h2>
            <p className="mt-1 text-sm text-slate-400">
              Upload a CSV or Excel file to add multiple users at once.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-slate-500 hover:text-slate-300"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <UserImportPanel onRowsReady={onImportReady} />
      </div>
    </div>
  );
}
