import type { ReactNode } from "react";

function getHealthMeta(score: number) {
  if (score >= 80) {
    return { label: "Healthy", color: "bg-success-500", text: "text-success-500" };
  }
  if (score >= 50) {
    return { label: "At Risk", color: "bg-amber-400", text: "text-amber-400" };
  }
  return { label: "Unhealthy", color: "bg-danger-500", text: "text-danger-500" };
}

export default function HealthScore({
  score,
  showDetails = false,
  suffix,
}: {
  score: number;
  showDetails?: boolean;
  suffix?: ReactNode;
}) {
  const meta = getHealthMeta(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-semibold ${meta.text}`}>{score}</span>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{meta.label}</span>
        {suffix}
      </div>
      {showDetails ? (
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div className={`h-2 rounded-full ${meta.color}`} style={{ width: `${score}%` }} />
        </div>
      ) : null}
    </div>
  );
}
