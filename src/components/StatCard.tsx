import Card from "@/components/Card";

type StatCardProps = {
  title?: string;
  label?: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  helper?: string;
};

export default function StatCard({
  title,
  label,
  value,
  change,
  trend = "neutral",
  icon,
  helper,
}: StatCardProps) {
  const displayTitle = title ?? label ?? "";
  const trendColor =
    trend === "up" ? "text-success-500" : trend === "down" ? "text-danger-500" : "text-slate-400";

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{displayTitle}</p>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <div className="flex items-center gap-3 text-sm">
        {change ? <span className={trendColor}>{change}</span> : null}
        {helper ? <span className="text-slate-400">{helper}</span> : null}
      </div>
    </Card>
  );
}
