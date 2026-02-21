"use client";

import { useEffect, useState } from "react";
import { fetchOrgRiskSummary, mockRiskSummary } from "@/lib/api/risks";
import type { OrgRiskSummary } from "@/types/models/risk";

export function useOrgRisks() {
  const [data, setData] = useState<OrgRiskSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const summary = await fetchOrgRiskSummary();
        if (!isMounted) return;
        setData(summary);
        setIsUsingMockData(
          summary.critical.some(
            (item) =>
              item.orgId === "org-carewell" && item.issue === "EMAIL_DELIVERY_FAILED"
          )
        );
      } catch {
        if (!isMounted) return;
        setData(mockRiskSummary);
        setIsUsingMockData(true);
        setError("Unable to load risk data from API. Showing mock exceptions.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error, isUsingMockData };
}
