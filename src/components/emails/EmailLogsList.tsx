import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EmailLog } from "@/types/models/email";

interface EmailLogsListProps {
  rows: EmailLog[];
  onView: (id: string) => void;
  onResend: (id: string) => void;
  resendLoadingId: string | null;
}

function statusBadge(status: EmailLog["status"]) {
  if (status === "SENT") return <Badge variant="success">Sent</Badge>;
  if (status === "FAILED") return <Badge variant="error">Failed</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function relative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function EmailLogsList({
  rows,
  onView,
  onResend,
  resendLoadingId,
}: EmailLogsListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-8 text-sm text-slate-400">
        No email logs found for this filter set.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Org</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 text-slate-300">{relative(row.timestamp)}</td>
              <td className="px-4 py-3 text-slate-200">{row.orgName}</td>
              <td className="px-4 py-3 text-slate-300">{row.recipient}</td>
              <td className="px-4 py-3 text-slate-300">{row.template}</td>
              <td className="px-4 py-3">{statusBadge(row.status)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onView(row.id)}>
                    View
                  </Button>
                  {row.status === "FAILED" ? (
                    <Button
                      size="sm"
                      onClick={() => onResend(row.id)}
                      disabled={resendLoadingId === row.id}
                    >
                      {resendLoadingId === row.id ? "Resending..." : "Resend"}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
