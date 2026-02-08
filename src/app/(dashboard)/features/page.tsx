"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import PlanBadge from "@/components/PlanBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFeatures } from "@/lib/api/features";
import { hasPermission } from "@/lib/rbac";
import type { FeatureSummary } from "@/types";

type LoadState = "idle" | "loading" | "error" | "ready";

export default function FeaturesPage() {
  const { user } = useAuth();
  const canManageFeatures = hasPermission(user, "feature.manage");
  const [features, setFeatures] = useState<FeatureSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setState("loading");
    setError(null);

    fetchFeatures()
      .then((data) => {
        if (!isMounted) return;
        setFeatures(data);
        setState("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load features. Check API connectivity.");
        setState("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const grouped: Record<string, FeatureSummary[]> = {};
    features.forEach((feature) => {
      grouped[feature.category] = grouped[feature.category] || [];
      grouped[feature.category].push(feature);
    });
    return grouped;
  }, [features]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white">Features</h2>
          <p className="mt-2 text-sm text-slate-400">
            Feature catalog with plan availability and rollout status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/plans/overrides">
            <Button variant="secondary">Plan Overrides</Button>
          </Link>
          <Button
            disabled={!canManageFeatures}
            title={canManageFeatures ? "" : "Insufficient permissions"}
          >
            Add Feature
          </Button>
        </div>
      </div>

      {!canManageFeatures ? (
        <Card>
          <p className="text-sm text-slate-300">
            Read-only access. Feature management requires elevated permissions.
          </p>
        </Card>
      ) : null}

      {state === "loading" ? (
        <Card>
          <p className="text-sm text-slate-300">Loading feature catalog...</p>
        </Card>
      ) : null}

      {state === "error" ? (
        <Card>
          <p className="text-sm text-danger-500">{error}</p>
        </Card>
      ) : null}

      {state === "ready" ? (
        <div className="space-y-6">
          {Object.entries(categories).map(([category, items]) => (
            <Card key={category} className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{category}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{category} Features</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      <th className="px-4 py-3">Plans</th>
                      <th className="px-4 py-3">Default</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {items.map((feature) => (
                      <tr key={feature.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">{feature.name}</div>
                          <div className="text-xs text-slate-400">{feature.description ?? "-"}</div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            {feature.key}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {feature.availableInPlans.length ? (
                              feature.availableInPlans.map((plan) => (
                                <PlanBadge key={`${feature.key}-${plan}`} plan={plan} />
                              ))
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-200">
                          {feature.defaultEnabled ? "Enabled" : "Disabled"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {feature.betaFeature ? "Beta" : feature.comingSoon ? "Coming soon" : "Live"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
