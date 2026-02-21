"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV } from "@/lib/utils/parsers/csvParser";
import { parseXLSX } from "@/lib/utils/parsers/xlsxParser";
import { downloadImportTemplate } from "@/lib/utils/templates/userImportTemplate";
import { validateImportRows } from "@/lib/utils/validation/userImportSchema";
import type { ImportedUser, ImportedUserRowError } from "@/types/models/user";
import { UserImportErrorBanner } from "@/components/users/UserImportErrorBanner";
import { UserImportPreviewTable } from "@/components/users/UserImportPreviewTable";

interface UserImportPanelProps {
  onRowsReady: (rows: ImportedUser[]) => void;
}

const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

export function UserImportPanel({ onRowsReady }: UserImportPanelProps) {
  const [rows, setRows] = useState<ImportedUser[]>([]);
  const [errors, setErrors] = useState<ImportedUserRowError[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > FILE_SIZE_LIMIT_BYTES) {
        setRows([]);
        setErrors([]);
        setWarning(null);
        setFileError("File is too large. Maximum upload size is 5 MB.");
        return;
      }

      setIsParsing(true);
      setFileError(null);
      setWarning(null);

      try {
        const extension = file.name.split(".").pop()?.toLowerCase();
        let parsedRows: Record<string, string>[] = [];

        if (extension === "csv") {
          parsedRows = await parseCSV(file);
        } else if (extension === "xlsx" || extension === "xls") {
          parsedRows = await parseXLSX(file);
        } else {
          throw new Error("Unsupported file type. Please upload CSV or Excel.");
        }

        if (parsedRows.length > 500) {
          setWarning(
            `This file has ${parsedRows.length} rows. Imports above 500 rows may take longer.`
          );
        }

        const { valid, invalid } = validateImportRows(parsedRows);
        setRows(valid);
        setErrors(invalid);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to parse this file.";
        setRows([]);
        setErrors([]);
        setFileError(message);
      } finally {
        setIsParsing(false);
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={downloadImportTemplate}
        className="text-sm text-primary-light underline hover:text-primary"
      >
        Download CSV template
      </button>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) {
            void handleFile(file);
          }
        }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-white/20 bg-slate-950/40"
        }`}
      >
        <p className="font-medium text-slate-300">Drag and drop your file here</p>
        <p className="mt-1 text-xs text-slate-500">or</p>
        <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-primary-light underline">
          Browse file
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }}
          />
        </label>
        <p className="mt-3 text-xs text-slate-500">
          Accepted: .csv, .xlsx, .xls (max 5 MB)
        </p>
      </div>

      {isParsing ? <p className="text-sm text-slate-400">Parsing file...</p> : null}

      {fileError ? (
        <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
          {fileError}
        </div>
      ) : null}

      {warning ? (
        <div className="rounded-lg border border-warning-500/40 bg-warning-500/10 px-4 py-3 text-sm text-warning-500">
          {warning}
        </div>
      ) : null}

      {errors.length > 0 ? <UserImportErrorBanner errors={errors} /> : null}
      {rows.length > 0 ? <UserImportPreviewTable rows={rows} /> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => onRowsReady(rows)}
          disabled={rows.length === 0 || errors.length > 0 || isParsing}
        >
          Use {rows.length} User{rows.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
