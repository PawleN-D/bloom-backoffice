export type SubscriptionTier = "Starter" | "Growth" | "Enterprise" | "Custom";

export type Organization = {
  id: string;
  name: string;
  tier: SubscriptionTier;
  userCount: number;
  status: "Active" | "Suspended";
};

export type PlanOverrideFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type BackOfficeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "SUPPORT" | "BILLING" | "VIEWER";
};

export type AuthResponse = {
  token: string;
  user: BackOfficeUser;
};

export type AuthSessionResponse = {
  user: BackOfficeUser;
};

export type AuthSessionStatus = {
  authenticated: boolean;
};

export type OrganizationPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export type OrganizationStatus = "ACTIVE" | "TRIAL" | "SUSPENDED";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  usersUsed: number;
  usersLimit: number;
  clientsUsed: number;
  clientsLimit: number;
  mrr: number;
  healthScore: number;
  lastActivityAt: string | null;
  createdAt: string | null;
};

export type SubscriptionSummary = {
  plan: OrganizationPlan;
  billingCycle: string;
  status: string;
  mrr: number;
  nextBillingDate: string | null;
  paymentStatus: string;
  trialEndsAt: string | null;
};

export type OrganizationUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
};

export type OrganizationActivity = {
  id: string;
  message: string;
  actor: string;
  timestamp: string;
};

export type SupportTicketSummary = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string | null;
  assignee: string;
};
