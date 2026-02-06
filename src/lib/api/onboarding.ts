import { apiClient } from "@/lib/apiClient";
import type { OnboardingFormValues } from "@/lib/schemas/validation";

export type OnboardingResponse = {
  organizationId?: string;
  organizationName?: string;
  subdomain?: string | null;
  loginUrl?: string;
  invitationToken?: string;
  ownerEmail?: string;
};

export async function createOrganization(payload: OnboardingFormValues): Promise<OnboardingResponse> {
  const { logo, ...rest } = payload;
  const response = await apiClient.post<{ data?: unknown } | unknown>(
    "/api/hq/onboard-org",
    {
      orgName: rest.organizationName,
      adminEmail: rest.ownerEmail,
      subscriptionPlan: rest.plan,
      subdomain: rest.subdomain || undefined,
    }
  );

  const payloadData = (response.data as { data?: any })?.data ?? response.data;

  return {
    organizationId: payloadData?.organization?.id ?? payloadData?.organizationId,
    organizationName: payloadData?.organization?.name ?? rest.organizationName,
    subdomain: payloadData?.organization?.subdomain ?? rest.subdomain ?? null,
    loginUrl: payloadData?.loginUrl,
    invitationToken: payloadData?.invitationToken,
    ownerEmail: payloadData?.adminUser?.email ?? payloadData?.ownerEmail,
  };
}
