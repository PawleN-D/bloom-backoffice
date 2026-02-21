"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { getApiErrorDetails } from "@/lib/api/errors";
import type { OrganizationPlan } from "@/types";

export type CreateOrgPayload = {
  company_name: string;
  slug: string;
  plan: OrganizationPlan;
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
};

export type CreateOrgResult = {
  id: string;
  raw: unknown;
};

export type ApiMutationError = {
  message: string;
  status?: number;
};

function parseErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const data = payload as { message?: string; error?: string; detail?: string };
  return data.message ?? data.error ?? data.detail ?? fallback;
}

function resolveOrganizationId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as {
    id?: string;
    organizationId?: string;
    organization?: { id?: string };
    data?: { id?: string; organizationId?: string; organization?: { id?: string } };
  };

  return (
    record.id ??
    record.organizationId ??
    record.organization?.id ??
    record.data?.id ??
    record.data?.organizationId ??
    record.data?.organization?.id ??
    null
  );
}

export function useCreateOrg() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiMutationError | null>(null);

  const createOrg = useCallback(async (payload: CreateOrgPayload): Promise<CreateOrgResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ data?: unknown } | unknown>(
        "/api/hq/organizations",
        payload
      );
      const body = (response.data as { data?: unknown })?.data ?? response.data;

      const id = resolveOrganizationId(body);
      if (!id) {
        const nextError = { message: "Organization created but no ID was returned." };
        setError(nextError);
        throw nextError;
      }

      return { id, raw: body };
    } catch (error) {
      const details = getApiErrorDetails(error, "Unable to create organization.");
      const message = parseErrorMessage(details.data, details.message);
      const nextError = { message, status: details.status };
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createOrg, isLoading, error };
}
