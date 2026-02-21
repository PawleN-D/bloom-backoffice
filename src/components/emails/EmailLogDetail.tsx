import { format } from "date-fns";
import type { EmailLog } from "@/types/models/email";

interface EmailLogDetailProps {
  log: EmailLog;
  onClose: () => void;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy HH:mm");
}

export function EmailLogDetail({ log, onClose }: EmailLogDetailProps) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close email detail"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/10 bg-slate-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Email Log Detail</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-slate-500 hover:text-slate-300"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <span className="text-slate-500">Timestamp:</span> {formatDateTime(log.timestamp)}
          </div>
          <div>
            <span className="text-slate-500">Organisation:</span> {log.orgName}
          </div>
          <div>
            <span className="text-slate-500">Recipient:</span> {log.recipient}
          </div>
          <div>
            <span className="text-slate-500">Template:</span> {log.template}
          </div>
          <div>
            <span className="text-slate-500">Subject:</span> {log.subject}
          </div>
          <div>
            <span className="text-slate-500">Status:</span> {log.status}
          </div>
          {log.errorMessage ? (
            <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-3 py-2 text-danger-500">
              Error: {log.errorMessage}
            </div>
          ) : null}
          <div>
            <p className="text-slate-500">Body Preview</p>
            <p className="mt-1 rounded-lg border border-white/10 bg-slate-900/70 p-3 text-slate-200">
              {log.bodyPreview}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
