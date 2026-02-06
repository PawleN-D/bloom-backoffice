"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Select from "@/components/Select";
import Toggle from "@/components/Toggle";
import { fetchOrganizationFeatures, fetchOrganizations } from "@/lib/api/organizations";
import type { OrganizationSummary, PlanOverrideFlag } from "@/types";

type LoadState = "idle" | "loading" | "error" | "ready";

export default function PlanOverridesPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [flags, setFlags] = useState<PlanOverrideFlag[]>([]);
  const [planLabel, setPlanLabel] = useState("-");
  const [orgState, setOrgState] = useState<LoadState>("loading");
  const [flagState, setFlagState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setOrgState("loading");
    setError(null);

    fetchOrganizations()
      .then((data) => {
        if (!isMounted) return;
        setOrganizations(data);
        setSelectedOrgId(data[0]?.id ?? "");
        setOrgState("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setOrgState("error");
        setError("Unable to load organizations.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrgId) {
      setFlags([]);
      setPlanLabel("-");
      setFlagState("idle");
      return;
    }

    let isMounted = true;
    setFlagState("loading");
    setError(null);

    fetchOrganizationFeatures(selectedOrgId)
      .then((data) => {
        if (!isMounted) return;
        setFlags(data.flags);
        setPlanLabel(data.plan ?? "-");
        setFlagState("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setFlags([]);
        setPlanLabel("-");
        setFlagState("error");
        setError("Unable to load feature overrides.");
      });

    return () => {
      isMounted = false;
    };
  }, [selectedOrgId]);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-white">Plan Overrides</h2>
        <p className="mt-2 text-sm text-slate-400">
          Toggle custom feature flags for organizations on bespoke contracts.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Organization</label>
            <Select
              value={selectedOrgId}
              onChange={(event) => setSelectedOrgId(event.target.value)}
              disabled={orgState === "loading" || orgState === "error"}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            Current plan: {planLabel}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        ) : null}

        {orgState === "loading" ? (
          <p className="text-sm text-slate-300">Loading organizations...</p>
        ) : null}

        {selectedOrg && flagState === "loading" ? (
          <p className="text-sm text-slate-300">Loading feature overrides...</p>
        ) : null}

        {selectedOrg && flagState === "ready" && flags.length === 0 ? (
          <p className="text-sm text-slate-400">No feature overrides found for this organization.</p>
        ) : null}

        {flags.length ? (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag.key}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-4"
              >
                <div>
                  <div className="text-sm font-medium text-white">{flag.label}</div>
                  <div className="text-xs text-slate-400">{flag.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    pressed={flag.enabled}
                    disabled
                    className="cursor-not-allowed opacity-60"
                  />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {flag.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
