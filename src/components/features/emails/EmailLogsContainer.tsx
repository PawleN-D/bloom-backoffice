"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { EmailLogDetail } from "@/components/emails/EmailLogDetail";
import { EmailLogsFilters } from "@/components/emails/EmailLogsFilters";
import { EmailLogsList } from "@/components/emails/EmailLogsList";
import { useEmailLogs } from "@/lib/hooks/api/useEmailLogs";
import type { EmailLog } from "@/types/models/email";

type ToastTone = "success" | "error";
type ToastState = { message: string; tone: ToastTone } | null;

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Sent", value: "SENT" },
  { label: "Failed", value: "FAILED" },
  { label: "Pending", value: "PENDING" },
];

const rangeOptions = [
  { label: "Last 30 days", value: "30d" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 24 hours", value: "24h" },
];

function rangeThreshold(range: string) {
  if (range === "24h") return Date.now() - 24 * 60 * 60 * 1000;
  if (range === "7d") return Date.now() - 7 * 24 * 60 * 60 * 1000;
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

export function EmailLogsContainer() {
  const searchParams = useSearchParams();
  const requestedOrg = searchParams.get("org");

  const {
    logs,
    isLoading,
    error,
    selected,
    resendLoadingId,
    refresh,
    openDetail,
    closeDetail,
    resend,
  } = useEmailLogs();

  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState(requestedOrg || "all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("30d");
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!requestedOrg) return;
    setOrgFilter(requestedOrg);
  }, [requestedOrg]);

  const orgOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.orgId)));
    return [
      { label: "All Orgs", value: "all" },
      ...values.map((orgId) => {
        const orgName = logs.find((log) => log.orgId === orgId)?.orgName ?? orgId;
        return { label: orgName, value: orgId };
      }),
    ];
  }, [logs]);

  const templateOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.template)));
    return [
      { label: "All Templates", value: "all" },
      ...values.map((template) => ({ label: template, value: template })),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const threshold = rangeThreshold(rangeFilter);
    return logs.filter((log) => {
      const timestamp = new Date(log.timestamp).getTime();
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      const matchesOrg = orgFilter === "all" || log.orgId === orgFilter;
      const matchesTemplate = templateFilter === "all" || log.template === templateFilter;
      const matchesRange = Number.isNaN(timestamp) ? true : timestamp >= threshold;
      return matchesStatus && matchesOrg && matchesTemplate && matchesRange;
    });
  }, [logs, orgFilter, rangeFilter, statusFilter, templateFilter]);

  const handleResend = async (id: string) => {
    const result = await resend(id);
    if (result.ok) {
      setToast({ message: "Email resent. Status updated to pending.", tone: "success" });
      return;
    }
    setToast({ message: result.message, tone: "error" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white">Communications</h2>
          <p className="mt-2 text-sm text-slate-400">
            Track delivery status for onboarding and user-invite emails.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {toast ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-success-500/40 bg-success-500/10 text-success-500"
              : "border-danger-500/40 bg-danger-500/10 text-danger-500"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
          {error}
        </div>
      ) : null}

      <Card className="space-y-6">
        <EmailLogsFilters
          status={statusFilter}
          organization={orgFilter}
          template={templateFilter}
          range={rangeFilter}
          statusOptions={statusOptions}
          orgOptions={orgOptions}
          templateOptions={templateOptions}
          rangeOptions={rangeOptions}
          onStatusChange={setStatusFilter}
          onOrganizationChange={setOrgFilter}
          onTemplateChange={setTemplateFilter}
          onRangeChange={setRangeFilter}
        />

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 rounded bg-slate-900" />
            ))}
          </div>
        ) : (
          <EmailLogsList
            rows={filteredLogs}
            onView={(id) => void openDetail(id)}
            onResend={(id) => void handleResend(id)}
            resendLoadingId={resendLoadingId}
          />
        )}
      </Card>

      {selected ? <EmailLogDetail log={selected} onClose={closeDetail} /> : null}
    </div>
  );
}
