import { apiClient } from "@/lib/apiClient";
import type { OnboardingFormValues } from "@/lib/schemas/validation";

export type OnboardingResponse = {
  organizationId?: string;
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
    }
  );

  const payloadData = (response.data as { data?: any })?.data ?? response.data;

  return {
    organizationId: payloadData?.organization?.id ?? payloadData?.organizationId,
    loginUrl: payloadData?.loginUrl,
    invitationToken: payloadData?.invitationToken,
    ownerEmail: payloadData?.adminUser?.email ?? payloadData?.ownerEmail,
  };
}
