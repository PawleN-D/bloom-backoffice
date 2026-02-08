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
  availableInPlans?: OrganizationPlan[];
  defaultEnabled?: boolean;
  isInPlan?: boolean;
  isOverridden?: boolean;
  category?: string;
  betaFeature?: boolean;
  comingSoon?: boolean;
};

export type BackOfficeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "SUPPORT" | "BILLING" | "VIEWER" | "SUPER_ADMIN" | "MANAGER" | "ORG_OWNER" | "WORKER";
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
  user?: BackOfficeUser;
};

export type OrganizationPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export type OrganizationStatus = "ACTIVE" | "TRIAL" | "SUSPENDED";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
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
  isActive: boolean;
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

export type FeatureSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  availableInPlans: OrganizationPlan[];
  betaFeature: boolean;
  comingSoon: boolean;
  defaultEnabled: boolean;
};

export type SubscriptionRow = {
  organizationId: string;
  organizationName: string;
  plan: OrganizationPlan;
  status: string;
  billingCycle: string;
  mrr: number;
  nextBillingDate: string | null;
  paymentStatus: string;
  trialEndsAt: string | null;
};

export type InvoiceSummary = {
  id: string;
  issuedAt: string | null;
  dueAt: string | null;
  status: string;
  totalCents: number;
  currency: string;
};
