import type { OrganizationPlan } from "@/types";
import { Badge } from "@/components/ui/badge";

const labels: Record<OrganizationPlan, string> = {
  FREE: "FREE",
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
};

const variants: Record<OrganizationPlan, Parameters<typeof Badge>[0]["variant"]> = {
  FREE: "neutral",
  STARTER: "success",
  PROFESSIONAL: "info",
  ENTERPRISE: "default",
};

export default function PlanBadge({ plan }: { plan: OrganizationPlan }) {
  return <Badge variant={variants[plan]}>{labels[plan]}</Badge>;
}
