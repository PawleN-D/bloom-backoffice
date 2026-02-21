import Card from "@/components/Card";

export function OnboardingFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-72 rounded bg-slate-800" />
        <div className="h-4 w-96 rounded bg-slate-900" />
      </div>

      <div className="flex gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-10 w-40 rounded-full bg-slate-900" />
        ))}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-10 rounded bg-slate-900" />
          <div className="h-10 rounded bg-slate-900" />
          <div className="h-10 rounded bg-slate-900" />
          <div className="h-10 rounded bg-slate-900" />
        </div>
        <div className="h-10 w-40 rounded bg-slate-900" />
      </Card>
    </div>
  );
}
