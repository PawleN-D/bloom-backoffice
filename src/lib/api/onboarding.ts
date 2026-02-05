import { apiClient } from "@/lib/apiClient";
import type { OnboardingFormValues } from "@/lib/schemas/validation";

export type OnboardingResponse = {
  organizationId?: string;
  loginUrl?: string;
  temporaryPassword?: string;
  ownerEmail?: string;
};

export async function createOrganization(payload: OnboardingFormValues): Promise<OnboardingResponse> {
  const { logo, ...rest } = payload;
  const response = await apiClient.post<{ data?: OnboardingResponse } | OnboardingResponse>(
    "/api/backoffice/onboarding/create-organization",
    rest
  );
  const data = response.data as { data?: OnboardingResponse };
  return data?.data ?? response.data;
}
