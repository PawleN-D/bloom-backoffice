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
        <p className="text-sm text-slate-300">
          This section is scaffolded and protected. We'll fill in data, tables, and workflows next.
        </p>
      </Card>
    </div>
  );
}
