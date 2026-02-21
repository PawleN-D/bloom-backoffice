import Card from "@/components/Card";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      <Card>
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary-light">
            Coming Soon
          </p>
          <p className="text-sm text-slate-300">
            This section is intentionally held for a planned release and is not yet part of the active operational workflow.
          </p>
        </div>
      </Card>
    </div>
  );
}
