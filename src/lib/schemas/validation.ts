import { z } from "zod";
import { isValidSubdomain } from "@/lib/utils/subdomain";

export const onboardingSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes"),
  billingEmail: z.string().email("Billing email is required"),
  subdomain: z
    .string()
    .min(1, "Subdomain is required")
    .refine((value) => isValidSubdomain(value), "Subdomain is invalid or reserved"),
  logo: z.any().optional(),
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  trialEnabled: z.boolean().default(false),
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),
  ownerEmail: z.string().email("Owner email is required"),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
  features: z.array(z.string()).default([]),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
