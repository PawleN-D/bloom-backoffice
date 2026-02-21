import {
  fetchOrganization,
  fetchOrganizationActivity,
  fetchOrganizationTickets,
  fetchOrganizationUsers,
} from "@/lib/api/organizations";

type SuspendedOrgAccessResult = {
  organizationLoaded: boolean;
  usersLoaded: boolean;
  activityLoaded: boolean;
  ticketsLoaded: boolean;
};

// Integration harness for Phase 6 verification.
// Run this in an authenticated browser session or a test runner with valid auth cookies.
export async function verifySuspendedOrgDataAccess(
  organizationId: string
): Promise<SuspendedOrgAccessResult> {
  const organization = await fetchOrganization(organizationId);
  const users = await fetchOrganizationUsers(organizationId);
  const activity = await fetchOrganizationActivity(organizationId);
  const tickets = await fetchOrganizationTickets(organizationId);

  return {
    organizationLoaded: Boolean(organization?.id),
    usersLoaded: Array.isArray(users),
    activityLoaded: Array.isArray(activity),
    ticketsLoaded: Array.isArray(tickets),
  };
}
