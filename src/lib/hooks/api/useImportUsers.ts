"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { getApiErrorDetails } from "@/lib/api/errors";
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

        const response = await apiClient.post<{ data?: unknown } | unknown>(
          `/api/hq/organizations/${targetOrganizationId}/users/bulk`,
          { users }
        );
        const body = (response.data as { data?: unknown })?.data ?? response.data;

        const nextResult = normalizeResult(body, users.length);
        setResult(nextResult);
        return nextResult;
      } catch (err) {
        const details = getApiErrorDetails(err, "Import failed.");
        const message = parseErrorMessage(details.data, details.message);
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
