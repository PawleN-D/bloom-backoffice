import type { OrganizationStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const variants: Record<OrganizationStatus, Parameters<typeof Badge>[0]["variant"]> = {
  ACTIVE: "success",
  TRIAL: "info",
  SUSPENDED: "error",
};

export default function StatusBadge({ status }: { status: OrganizationStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
