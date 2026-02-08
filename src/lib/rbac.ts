import type { BackOfficeUser } from "@/types";

export type Permission =
  | "user.manage"
  | "org.view"
  | "org.create"
  | "org.manage"
  | "feature.manage"
  | "subscription.view"
  | "subscription.manage"
  | "analytics.view"
  | "support.view"
  | "billing.view"
  | "settings.manage";

type Role = BackOfficeUser["role"];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "user.manage",
    "org.view",
    "org.create",
    "org.manage",
    "feature.manage",
    "subscription.view",
    "subscription.manage",
    "analytics.view",
    "support.view",
    "billing.view",
    "settings.manage",
  ],
  ADMIN: [
    "user.manage",
    "org.view",
    "subscription.view",
    "analytics.view",
    "support.view",
    "billing.view",
  ],
  BILLING: ["org.view", "subscription.view", "subscription.manage", "billing.view", "analytics.view"],
  SUPPORT: ["org.view", "support.view"],
  VIEWER: ["org.view", "subscription.view", "analytics.view"],
  MANAGER: ["org.view"],
  ORG_OWNER: ["org.view"],
  WORKER: ["org.view"],
};

export function isHqAdmin(user: BackOfficeUser | null): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return user.role === "ADMIN" && !user.organizationId;
}

export function hasPermission(user: BackOfficeUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (!isHqAdmin(user)) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  user: BackOfficeUser | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}
