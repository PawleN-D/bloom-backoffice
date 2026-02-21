export type EmailDeliveryStatus = "SENT" | "FAILED" | "PENDING";

export type EmailLog = {
  id: string;
  timestamp: string;
  orgId: string;
  orgName: string;
  recipient: string;
  template: string;
  subject: string;
  bodyPreview: string;
  status: EmailDeliveryStatus;
  errorMessage?: string;
};
