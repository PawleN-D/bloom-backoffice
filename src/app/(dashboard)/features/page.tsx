import Card from "@/components/Card";
import PlaceholderPage from "@/components/PlaceholderPage";

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <PlaceholderPage
        title="Features"
        description="Manage feature flags, plan overrides, and rollout status."
      />
      <Card>
        <p className="text-sm text-slate-300">
          Plan overrides will live here once we wire the organization selector and feature toggles.
        </p>
      </Card>
    </div>
  );
}
