"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Select from "@/components/Select";
import Toggle from "@/components/Toggle";
import { organizations, planOverrideFlags } from "@/data/mock";
import type { PlanOverrideFlag } from "@/types";

export default function PlanOverridesPage() {
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id ?? "");
  const [flags, setFlags] = useState<PlanOverrideFlag[]>(planOverrideFlags);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId),
    [selectedOrgId]
  );

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((flag) => (flag.key === key ? { ...flag, enabled: !flag.enabled } : flag))
    );
  };

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
            <Select value={selectedOrgId} onChange={(event) => setSelectedOrgId(event.target.value)}>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            Current plan: {selectedOrg?.tier ?? "-"}
          </div>
        </div>

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
                <Toggle pressed={flag.enabled} onClick={() => toggleFlag(flag.key)} />
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {flag.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
