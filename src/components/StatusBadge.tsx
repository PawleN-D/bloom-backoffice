import { Badge } from "@/components/ui/badge";

const variants: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  ACTIVE: "success",
  TRIAL: "info",
  SUSPENDED: "error",
  PAST_DUE: "warning",
  CANCELLED: "neutral",
  CANCELED: "neutral",
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const variant = variants[normalized] ?? "neutral";
  return <Badge variant={variant}>{normalized}</Badge>;
}
