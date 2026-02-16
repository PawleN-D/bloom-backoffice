import Link from "next/link";
import Card from "@/components/Card";
import type { OrganizationSummary } from "@/types";

export type OrganizationRiskDetail = {
  issue: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "HEALTHY";
  link: string;
};

interface OrganizationCardProps {
  organization: OrganizationSummary;
  risks: OrganizationRiskDetail[];
}

function severityStyles(severity: "CRITICAL" | "WARNING" | "HEALTHY") {
  if (severity === "CRITICAL") {
    return "border-danger-500/40 bg-danger-500/10 text-danger-500";
  }
  if (severity === "WARNING") {
    return "border-warning-500/40 bg-warning-500/10 text-warning-500";
  }
  return "border-success-500/40 bg-success-500/10 text-success-500";
}

export function OrganizationCard({ organization, risks }: OrganizationCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{organization.name}</h3>
          <p className="text-sm text-slate-400">{organization.slug}</p>
        </div>
        <Link
          href={`/organizations/${organization.id}`}
          className="text-sm text-primary-light hover:underline"
        >
          Open organisation
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
        <div>Users: {organization.usersUsed}/{organization.usersLimit}</div>
        <div>Clients: {organization.clientsUsed}/{organization.clientsLimit}</div>
        <div>Health Score: {organization.healthScore}</div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Risk Breakdown</p>
        {risks.length === 0 ? (
          <div className="rounded-lg border border-success-500/40 bg-success-500/10 px-3 py-2 text-sm text-success-500">
            No active exceptions.
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map((risk, index) => (
              <div
                key={`${risk.issue}-${index}`}
                className={`rounded-lg border px-3 py-2 text-sm ${severityStyles(risk.severity)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{risk.issue}</span>
                  <Link href={risk.link} className="text-xs underline">
                    Open
                  </Link>
                </div>
                <p className="mt-1">{risk.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
