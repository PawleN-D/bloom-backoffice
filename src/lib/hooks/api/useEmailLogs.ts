"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchEmailLogDetail,
  fetchEmailLogs,
  resendEmailLog,
} from "@/lib/api/emailLogs";
import type { EmailLog } from "@/types/models/email";

export function useEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextLogs = await fetchEmailLogs();
      setLogs(nextLogs);
    } catch {
      setError("Unable to load email logs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDetail = useCallback(async (id: string) => {
    const detail = await fetchEmailLogDetail(id);
    if (detail) {
      setSelected(detail);
    }
  }, []);

  const closeDetail = useCallback(() => setSelected(null), []);

  const resend = useCallback(async (id: string) => {
    setResendLoadingId(id);
    try {
      const nextStatus = await resendEmailLog(id);
      setLogs((current) =>
        current.map((log) =>
          log.id === id
            ? {
                ...log,
                status: nextStatus,
                errorMessage: undefined,
              }
            : log
        )
      );
      return { ok: true as const, status: nextStatus };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Resend failed.",
      };
    } finally {
      setResendLoadingId(null);
    }
  }, []);

  return {
    logs,
    isLoading,
    error,
    selected,
    resendLoadingId,
    refresh,
    openDetail,
    closeDetail,
    resend,
  };
}
