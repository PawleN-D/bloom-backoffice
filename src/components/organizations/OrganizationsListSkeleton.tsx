import Card from "@/components/Card";

export function OrganizationsListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-64 rounded bg-slate-900" />
          <div className="h-10 w-40 rounded bg-slate-900" />
          <div className="h-10 w-40 rounded bg-slate-900" />
          <div className="h-10 w-40 rounded bg-slate-900" />
        </div>
      </Card>
      <Card className="space-y-3">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="h-12 rounded bg-slate-900" />
        ))}
      </Card>
    </div>
  );
}
