"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOrganizations } from "@/lib/api/organizations";
import type { OrganizationSummary } from "@/types";

export function useOrganizations() {
  const [data, setData] = useState<OrganizationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const organizations = await fetchOrganizations();
      setData(organizations);
    } catch {
      setData([]);
      setError("Unable to load organizations. Check API connectivity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch, setData };
}
