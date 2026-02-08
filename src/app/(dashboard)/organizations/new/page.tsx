"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "@/components/Card";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/rbac";
import { createOrganization } from "@/lib/api/onboarding";
import { checkSubdomainAvailability } from "@/lib/api/organizations";
import { onboardingSchema, type OnboardingFormValues } from "@/lib/schemas/validation";
import {
  generateSubdomain,
  getOrganizationUrl,
  isValidSubdomain,
} from "@/lib/utils/subdomain";

const steps = [
  "Organization",
  "Subscription",
  "Owner",
  "Features",
  "Review",
] as const;

const stepFields: Record<number, Array<keyof OnboardingFormValues>> = {
  0: ["organizationName", "slug", "subdomain", "billingEmail"],
  1: ["plan", "billingCycle"],
  2: ["ownerFirstName", "ownerLastName", "ownerEmail", "temporaryPassword"],
  3: [],
  4: [],
};

const featureOptions = [
  { id: "hiqa_dashboard", label: "HIQA Compliance Dashboard" },
  { id: "ai_scheduling", label: "AI Scheduling (PRO+)" },
  { id: "voice_notes", label: "Voice Notes" },
  { id: "family_portal", label: "Family Portal" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function generatePassword() {
  return Math.random().toString(36).slice(-10) + "A1";
}

export default function OnboardOrganizationPage() {
  const { user } = useAuth();
  const canCreateOrg = hasPermission(user, "org.create");
  const [currentStep, setCurrentStep] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{
    organizationId?: string;
    organizationName?: string;
    subdomain?: string | null;
    organizationUrl?: string;
    loginUrl?: string;
    invitationToken?: string;
    ownerEmail?: string;
    temporaryPassword?: string;
  } | null>(null);
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: "",
      slug: "",
      billingEmail: "",
      subdomain: "",
      plan: "PROFESSIONAL",
      billingCycle: "MONTHLY",
      trialEnabled: true,
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      temporaryPassword: generatePassword(),
      features: ["hiqa_dashboard", "ai_scheduling"],
    },
    mode: "onBlur",
  });

  const { register, setValue, getValues, formState, trigger } = form;
  const watchedName = useWatch({ control: form.control, name: "organizationName" });
  const watchedSubdomain = useWatch({ control: form.control, name: "subdomain" });
  const watchedFeatures = useWatch({ control: form.control, name: "features" });

  const organizationNameField = register("organizationName");
  const slugField = register("slug");
  const subdomainField = register("subdomain");

  useEffect(() => {
    if (!slugTouched && watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: true });
    }
    if (!customSubdomain && watchedName) {
      setValue("subdomain", generateSubdomain(watchedName), { shouldValidate: true });
    }
    if (!watchedName && !customSubdomain) {
      setValue("subdomain", "", { shouldValidate: true });
    }
  }, [slugTouched, watchedName, customSubdomain, setValue]);

  useEffect(() => {
    const value = watchedSubdomain?.trim().toLowerCase() ?? "";
    if (!value) {
      setSubdomainAvailable(null);
      setAvailabilityMessage(null);
      return;
    }
    if (!isValidSubdomain(value)) {
      setSubdomainAvailable(false);
      setAvailabilityMessage("Subdomain is invalid or reserved.");
      return;
    }

    const handle = setTimeout(async () => {
      setCheckingAvailability(true);
      try {
        const result = await checkSubdomainAvailability(value);
        setSubdomainAvailable(result.available);
        setAvailabilityMessage(
          result.available ? "Subdomain is available." : result.reason ?? "Subdomain is taken."
        );
      } catch {
        setSubdomainAvailable(null);
        setAvailabilityMessage("Unable to verify subdomain availability.");
      } finally {
        setCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [watchedSubdomain]);

  const handleNext = async () => {
    const fields = stepFields[currentStep] ?? [];
    const valid = await trigger(fields, { shouldFocus: true });
    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleFeature = (id: string) => {
    const current = new Set(watchedFeatures ?? []);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setValue("features", Array.from(current), { shouldValidate: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await createOrganization(values);
      const resolvedSubdomain = result.subdomain ?? values.subdomain ?? "";
      const organizationUrl = resolvedSubdomain
        ? getOrganizationUrl(resolvedSubdomain)
        : undefined;
      const loginUrl =
        result.loginUrl ??
        (organizationUrl ? `${organizationUrl}/login` : "https://admin.bloom.com/login");
      setSuccessData({
        organizationId: result.organizationId,
        organizationName: result.organizationName ?? values.organizationName,
        subdomain: resolvedSubdomain || null,
        organizationUrl,
        loginUrl,
        invitationToken: result.invitationToken,
        ownerEmail: result.ownerEmail ?? values.ownerEmail,
        temporaryPassword: values.temporaryPassword,
      });
    } catch (error) {
      setSubmitError("Unable to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

    const review = useMemo(() => getValues(), [currentStep, getValues]);
  const disableNext =
    currentStep === 0 && (checkingAvailability || subdomainAvailable !== true);

  if (!canCreateOrg) {
    return (
      <Card className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Access Restricted</h2>
        <p className="text-sm text-slate-400">
          You do not have permission to create organizations. Contact an HQ administrator.
        </p>
      </Card>
    );
  }

  if (successData) {
    const organizationUrl = successData.organizationUrl;
    const loginUrl = successData.loginUrl;
    const credentialsText = [
      loginUrl ? `Login URL: ${loginUrl}` : null,
      successData.ownerEmail ? `Email: ${successData.ownerEmail}` : null,
      successData.temporaryPassword
        ? `Password: ${successData.temporaryPassword}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-white">Organization Created Successfully</h2>
          <p className="mt-2 text-sm text-slate-400">
            Share the login credentials and invitation token with the organization owner.
          </p>
        </div>
        {organizationUrl ? (
          <Card className="space-y-4 border border-primary/30 bg-primary/10">
            <div className="text-xs uppercase tracking-[0.3em] text-primary-light">
              Organization URL
            </div>
            <div className="text-xl font-mono text-primary-light">
              {organizationUrl}
            </div>
          </Card>
        ) : null}

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Login Credentials
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!credentialsText) return;
                void navigator.clipboard.writeText(credentialsText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="space-y-2 font-mono text-sm text-slate-300">
            <div>Login URL: {loginUrl ?? "—"}</div>
            <div>Email: {successData.ownerEmail ?? "—"}</div>
            <div>Password: {successData.temporaryPassword ?? "—"}</div>
          </div>
          <div className="text-xs text-slate-500">
            Invitation Token: {successData.invitationToken ?? "—"}
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          {organizationUrl ? (
            <Button
              type="button"
              onClick={() => {
                window.open(organizationUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Open Organization →
            </Button>
          ) : null}
          {successData.organizationId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = `/organizations/${successData.organizationId}`;
              }}
            >
              View Organization Details
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Onboard Organization</h2>
        <p className="mt-2 text-sm text-slate-400">
          Structured intake for a new care home, including subscription setup and owner credentials.
        </p>
      </div>

      <StepIndicator steps={steps as unknown as string[]} current={currentStep} />

      <FormProvider {...form}>
        <form className="space-y-6" onSubmit={onSubmit}>
          <Card className="space-y-6">
            {currentStep === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input
                    {...organizationNameField}
                    placeholder="CareWell Dublin"
                  />
                  {formState.errors.organizationName ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.organizationName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    {...slugField}
                    onChange={(event) => {
                      setSlugTouched(true);
                      slugField.onChange(event);
                    }}
                    placeholder="carewell-dublin"
                  />
                  {formState.errors.slug ? (
                    <p className="text-xs text-danger-500">{formState.errors.slug.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Billing Email *</Label>
                  <Input
                    {...register("billingEmail")}
                    type="email"
                    placeholder="billing@carewell.ie"
                  />
                  {formState.errors.billingEmail ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.billingEmail.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Subdomain *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      {...subdomainField}
                      onChange={(event) => {
                        setCustomSubdomain(true);
                        subdomainField.onChange(event);
                      }}
                      placeholder="carewell-dublin"
                    />
                  </div>
                  {formState.errors.subdomain ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.subdomain.message}
                    </p>
                  ) : null}
                  {watchedSubdomain ? (
                    <div className="text-xs text-slate-400">
                      {checkingAvailability ? (
                        <span>Checking availability...</span>
                      ) : subdomainAvailable === true ? (
                        <span className="text-emerald-400">Available</span>
                      ) : subdomainAvailable === false ? (
                        <span className="text-danger-500">{availabilityMessage}</span>
                      ) : availabilityMessage ? (
                        <span>{availabilityMessage}</span>
                      ) : null}
                    </div>
                  ) : null}
                  {watchedSubdomain && isValidSubdomain(watchedSubdomain) ? (
                    <p className="text-xs text-slate-500">
                      Organization URL:{" "}
                      <span className="font-mono text-slate-200">
                      {getOrganizationUrl(watchedSubdomain)}
                    </span>
                  </p>
                ) : null}
                  {!customSubdomain && watchedSubdomain ? (
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                      Auto-generated from organization name
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logo Upload (optional)</Label>
                  <Input type="file" {...register("logo")} />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {[
                      {
                        value: "STARTER",
                        title: "Starter",
                        price: "€49 / month",
                        detail: "Up to 10 users • 50 clients",
                      },
                      {
                        value: "PROFESSIONAL",
                        title: "Professional",
                        price: "€149 / month",
                        detail: "Up to 25 users • 150 clients",
                      },
                      {
                        value: "ENTERPRISE",
                        title: "Enterprise",
                        price: "Custom pricing",
                        detail: "Unlimited users & clients",
                      },
                    ].map((plan) => (
                      <label
                        key={plan.value}
                        className="flex cursor-pointer flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200"
                      >
                        <input
                          type="radio"
                          value={plan.value}
                          {...register("plan")}
                          className="accent-primary"
                        />
                        <div className="text-base font-semibold text-white">{plan.title}</div>
                        <div className="text-sm text-slate-400">{plan.price}</div>
                        <div className="text-xs text-slate-500">{plan.detail}</div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Billing Cycle</Label>
                    <Select {...register("billingCycle")}>
                      <option value="MONTHLY">Monthly</option>
                      <option value="ANNUAL">Annual (2 months free)</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                    <Checkbox {...register("trialEnabled")} />
                    Enable 30-day free trial
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Owner First Name *</Label>
                  <Input {...register("ownerFirstName")} placeholder="Sarah" />
                  {formState.errors.ownerFirstName ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.ownerFirstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Owner Last Name *</Label>
                  <Input {...register("ownerLastName")} placeholder="Murphy" />
                  {formState.errors.ownerLastName ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.ownerLastName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Owner Email *</Label>
                  <Input {...register("ownerEmail")} type="email" placeholder="admin@carewell.ie" />
                  {formState.errors.ownerEmail ? (
                    <p className="text-xs text-danger-500">{formState.errors.ownerEmail.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password *</Label>
                  <div className="flex gap-2">
                    <Input {...register("temporaryPassword")} />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setValue("temporaryPassword", generatePassword(), { shouldValidate: true })}
                    >
                      Generate
                    </Button>
                  </div>
                  {formState.errors.temporaryPassword ? (
                    <p className="text-xs text-danger-500">
                      {formState.errors.temporaryPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <Label>Select Additional Features</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {featureOptions.map((feature) => (
                    <button
                      type="button"
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition ${
                        watchedFeatures?.includes(feature.id)
                          ? "border-primary bg-primary/10 text-primary-light"
                          : "border-white/10 bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      <span>{feature.label}</span>
                      <Checkbox
                        checked={watchedFeatures?.includes(feature.id)}
                        readOnly
                        onClick={(event) => event.stopPropagation()}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Organization</p>
                  <div className="mt-2">Name: {review.organizationName}</div>
                  <div>Slug: {review.slug}</div>
                  <div>Subdomain: {review.subdomain}</div>
                  {review.subdomain ? <div>URL: {getOrganizationUrl(review.subdomain)}</div> : null}
                  <div>Email: {review.billingEmail}</div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Subscription</p>
                  <div className="mt-2">Plan: {review.plan}</div>
                  <div>Billing: {review.billingCycle}</div>
                  <div>Trial: {review.trialEnabled ? "Enabled" : "Disabled"}</div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Owner</p>
                  <div className="mt-2">
                    Name: {review.ownerFirstName} {review.ownerLastName}
                  </div>
                  <div>Email: {review.ownerEmail}</div>
                  <div>Temporary Password: {review.temporaryPassword}</div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Features</p>
                  <div className="mt-2">
                    {review.features.length > 0 ? review.features.join(", ") : "None"}
                  </div>
                </div>
              </div>
            )}

            {submitError ? <p className="text-sm text-danger-500">{submitError}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} disabled={disableNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Organization"}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
