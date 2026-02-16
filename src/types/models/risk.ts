export type RiskSeverity = "CRITICAL" | "WARNING" | "HEALTHY";

export type RiskIssueCode =
  | "EMAIL_DELIVERY_FAILED"
  | "ALL_USERS_INACTIVE_30_DAYS"
  | "APPROACHING_USER_LIMIT"
  | "APPROACHING_CLIENT_LIMIT"
  | "USERS_NEVER_LOGGED_IN"
  | "BULK_IMPORT_PARTIAL_FAILURE"
  | "SETUP_INCOMPLETE"
  | "GENERIC";

export type OrgRiskItem = {
  orgId: string;
  orgName: string;
  issue: RiskIssueCode;
  description: string;
  timestamp: string;
  severity: RiskSeverity;
  count?: number;
};

export type OrgRiskMetrics = {
  totalRevenue: number;
  activeOrgs: number;
  planDistribution: Record<string, number>;
};

export type OrgRiskSummary = {
  critical: OrgRiskItem[];
  attention: OrgRiskItem[];
  metrics: OrgRiskMetrics;
};
