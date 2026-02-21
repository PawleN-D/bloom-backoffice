import Card from "@/components/Card";

export function OrgRiskRadarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-72 rounded bg-slate-800" />
        <div className="h-4 w-96 rounded bg-slate-900" />
      </div>

      <Card className="space-y-4">
        <div className="h-5 w-56 rounded bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-12 rounded bg-slate-900" />
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="h-5 w-64 rounded bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-12 rounded bg-slate-900" />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <Card key={card}>
            <div className="h-5 w-28 rounded bg-slate-800" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-900" />
          </Card>
        ))}
      </div>
    </div>
  );
}
