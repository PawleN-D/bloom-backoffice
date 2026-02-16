"use client";

import { useCallback, useState } from "react";
import type { ImportedUser } from "@/types/models/user";

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  detail: { email: string; status: "created" | "skipped" }[];
}

function parseErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const data = payload as { message?: string; error?: string };
  return data.message ?? data.error ?? fallback;
}

function normalizeResult(payload: unknown, usersCount: number): ImportResult {
  if (!payload || typeof payload !== "object") {
    return {
      total: usersCount,
      created: usersCount,
      skipped: 0,
      detail: [],
    };
  }
  const data = payload as {
    total?: number;
    created?: number;
    skipped?: number;
    detail?: { email: string; status: "created" | "skipped" }[];
    data?: {
      total?: number;
      created?: number;
      skipped?: number;
      detail?: { email: string; status: "created" | "skipped" }[];
    };
  };
  const source = data.data ?? data;
  return {
    total: source.total ?? usersCount,
    created: source.created ?? usersCount,
    skipped: source.skipped ?? 0,
    detail: source.detail ?? [],
  };
}

export function useImportUsers(organizationId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importUsers = useCallback(
    async (users: ImportedUser[], organizationIdOverride?: string) => {
      const targetOrganizationId = organizationIdOverride ?? organizationId;
      if (!targetOrganizationId) {
        setError("Missing organization ID for import.");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/hq/organizations/${targetOrganizationId}/users/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users }),
          }
        );

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok) {
          throw new Error(parseErrorMessage(body, "Import failed."));
        }

        const nextResult = normalizeResult(body, users.length);
        setResult(nextResult);
        return nextResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed.";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  return { importUsers, isLoading, result, error };
}
