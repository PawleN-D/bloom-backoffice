import { apiClient } from "@/lib/apiClient";
import type { EmailDeliveryStatus, EmailLog } from "@/types/models/email";

type ApiPayload<T> = { data?: T } | T;

function nowMinusHours(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function unwrapPayload<T>(payload: ApiPayload<T>): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data?: T }).data as T;
  }
  return payload as T;
}

const mockLogs: EmailLog[] = [
  {
    id: "email-1",
    timestamp: nowMinusHours(2),
    orgId: "org-carewell",
    orgName: "CareWell Dublin",
    recipient: "mary@carewell.ie",
    template: "welcome_onboarding",
    subject: "Welcome to Bloom",
    bodyPreview: "Your organization has been created...",
    status: "SENT",
  },
  {
    id: "email-2",
    timestamp: nowMinusHours(5),
    orgId: "org-health-first",
    orgName: "Health First",
    recipient: "john@health.ie",
    template: "user_invite",
    subject: "You are invited to Bloom",
    bodyPreview: "Please complete your account setup...",
    status: "FAILED",
    errorMessage: "SMTP provider timeout",
  },
  {
    id: "email-3",
    timestamp: nowMinusHours(24),
    orgId: "org-oak-care",
    orgName: "Oak Care",
    recipient: "admin@oak.ie",
    template: "welcome_onboarding",
    subject: "Welcome to Bloom",
    bodyPreview: "Let's get your team started...",
    status: "PENDING",
  },
];

function normalizeLogs(raw: unknown): EmailLog[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as Partial<EmailLog>)
    .filter((item): item is EmailLog => {
      return Boolean(
        item.id &&
          item.timestamp &&
          item.orgId &&
          item.orgName &&
          item.recipient &&
          item.template &&
          item.subject &&
          item.bodyPreview &&
          item.status
      );
    })
    .map((item) => ({
      ...item,
      status: item.status as EmailDeliveryStatus,
    }));
}

export async function fetchEmailLogs(): Promise<EmailLog[]> {
  try {
    // TODO: API endpoint not yet implemented
    // Expected: GET /api/hq/email-logs
    // Response shape: EmailLog[]
    const response = await apiClient.get<ApiPayload<unknown>>("/api/hq/email-logs");
    const payload = unwrapPayload(response.data);
    const logs = normalizeLogs(payload);
    return logs.length ? logs : mockLogs;
  } catch {
    return mockLogs;
  }
}

export async function fetchEmailLogDetail(id: string): Promise<EmailLog | null> {
  try {
    // TODO: API endpoint not yet implemented
    // Expected: GET /api/hq/email-logs/:id
    // Response shape: EmailLog
    const response = await apiClient.get<ApiPayload<unknown>>(`/api/hq/email-logs/${id}`);
    const payload = unwrapPayload(response.data);
    const [log] = normalizeLogs([payload]);
    return log ?? null;
  } catch {
    return mockLogs.find((log) => log.id === id) ?? null;
  }
}

export async function resendEmailLog(id: string): Promise<EmailDeliveryStatus> {
  try {
    // TODO: API endpoint not yet implemented
    // Expected: POST /api/hq/email-logs/:id/resend
    // Response shape: { status: "PENDING" | "SENT" }
    const response = await apiClient.post<ApiPayload<{ status?: EmailDeliveryStatus }>>(
      `/api/hq/email-logs/${id}/resend`
    );
    const payload = unwrapPayload(response.data) as { status?: EmailDeliveryStatus } | undefined;
    return payload?.status ?? "PENDING";
  } catch (error) {
    if (mockLogs.some((log) => log.id === id)) {
      return "PENDING";
    }
    const message = error instanceof Error ? error.message : "Resend failed";
    throw new Error(message);
  }
}

export async function fetchWelcomeEmailStatus(orgId: string): Promise<EmailDeliveryStatus> {
  try {
    const logs = await fetchEmailLogs();
    const welcomeLog = logs.find(
      (log) => log.orgId === orgId && log.template === "welcome_onboarding"
    );
    return welcomeLog?.status ?? "PENDING";
  } catch {
    return "PENDING";
  }
}
