"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm } from "@/components/organizations/OnboardingForm";
import { OnboardingFormSkeleton } from "@/components/organizations/OnboardingFormSkeleton";
import { fetchWelcomeEmailStatus } from "@/lib/api/emailLogs";
import { useCreateOrg, type CreateOrgPayload } from "@/lib/hooks/api/useCreateOrg";
import { useImportUsers } from "@/lib/hooks/api/useImportUsers";
import { useDisclosure } from "@/lib/hooks/ui/useDisclosure";
import type { ImportedUser } from "@/types/models/user";

const stepCount = 3;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type FormField = keyof CreateOrgPayload;
type ValidationErrors = Partial<Record<FormField | "singleUser", string>>;
type ToastState = {
  message: string;
  tone: "success" | "warning";
};

type SingleUserValidationState = {
  isEmpty: boolean;
  hasErrors: boolean;
};

const initialValues: CreateOrgPayload = {
  company_name: "",
  slug: "",
  plan: "PROFESSIONAL",
  manager_name: "",
  manager_email: "",
  manager_phone: "",
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? fallback);
  }
  return fallback;
}

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const rawStatus = (error as { status?: unknown }).status;
    if (typeof rawStatus === "number") return rawStatus;
    if (typeof rawStatus === "string" && rawStatus.trim()) {
      const parsed = Number(rawStatus);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  return undefined;
}

function dedupeUsers(users: ImportedUser[]) {
  const seen = new Set<string>();
  const deduped: ImportedUser[] = [];
  users.forEach((user) => {
    const key = user.email.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(user);
  });
  return deduped;
}

export function OnboardingFormContainer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<CreateOrgPayload>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [singleUser, setSingleUser] = useState<ImportedUser | null>(null);
  const [singleUserValidation, setSingleUserValidation] = useState<SingleUserValidationState>({
    isEmpty: true,
    hasErrors: false,
  });
  const [bulkUsers, setBulkUsers] = useState<ImportedUser[]>([]);
  const [importResultSummary, setImportResultSummary] = useState<string | null>(null);
  const importModal = useDisclosure(false);

  const { createOrg, isLoading: isCreating } = useCreateOrg();
  const {
    importUsers,
    isLoading: isImportingUsers,
  } = useImportUsers();

  const stagedUsers = useMemo(() => {
    const users: ImportedUser[] = [...bulkUsers];
    if (singleUser) {
      users.unshift(singleUser);
    }
    return dedupeUsers(users);
  }, [bulkUsers, singleUser]);

  const validateStep = useCallback(
    (step: number) => {
      const nextErrors: ValidationErrors = {};

      if (step === 0) {
        if (!values.company_name.trim()) {
          nextErrors.company_name = "Company name is required.";
        }
        if (!values.slug.trim()) {
          nextErrors.slug = "Slug is required.";
        } else if (!slugRegex.test(values.slug.trim())) {
          nextErrors.slug = "Slug can only include lowercase letters, numbers, and hyphens.";
        }
        if (!values.plan) {
          nextErrors.plan = "Plan is required.";
        }
      }

      if (step === 1) {
        if (!values.manager_name.trim()) {
          nextErrors.manager_name = "Manager name is required.";
        }
        if (!values.manager_email.trim()) {
          nextErrors.manager_email = "Manager email is required.";
        } else if (!emailRegex.test(values.manager_email.trim())) {
          nextErrors.manager_email = "Enter a valid manager email.";
        }
      }

      if (step === 2) {
        if (singleUserValidation.hasErrors) {
          nextErrors.singleUser = "Complete the single-user form or clear all fields.";
        }
      }

      setErrors((current) => {
        const cleared = { ...current };
        if (step === 0) {
          delete cleared.company_name;
          delete cleared.slug;
          delete cleared.plan;
        }
        if (step === 1) {
          delete cleared.manager_name;
          delete cleared.manager_email;
        }
        if (step === 2) {
          delete cleared.singleUser;
        }
        return { ...cleared, ...nextErrors };
      });
      return Object.keys(nextErrors).length === 0;
    },
    [singleUserValidation.hasErrors, values]
  );

  const handleFieldChange = useCallback(
    (field: FormField, value: string) => {
      setInlineError(null);
      setErrors((current) => ({ ...current, [field]: undefined }));
      setValues((current) => {
        const nextValue =
          field === "plan"
            ? (value as CreateOrgPayload["plan"])
            : value;
        const nextValues = { ...current, [field]: nextValue };

        if (field === "company_name" && !slugTouched) {
          nextValues.slug = generateSlug(value);
        }
        return nextValues;
      });

      if (field === "slug") {
        setSlugTouched(true);
      }
    },
    [slugTouched]
  );

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((current) => Math.min(current + 1, stepCount - 1));
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(2)) return;

    setInlineError(null);
    setImportResultSummary(null);

    let createdOrganizationId: string | null = null;

    try {
      const organization = await createOrg({
        ...values,
        slug: values.slug.trim(),
        company_name: values.company_name.trim(),
        manager_name: values.manager_name.trim(),
        manager_email: values.manager_email.trim(),
        manager_phone: values.manager_phone?.trim() || undefined,
      });

      createdOrganizationId = organization.id;
      const welcomeEmailStatus = await fetchWelcomeEmailStatus(organization.id);

      let importSummary: string | null = null;
      if (stagedUsers.length > 0) {
        const importResult = await importUsers(stagedUsers, organization.id);
        if (!importResult) {
          throw new Error("User import failed.");
        }
        importSummary = `${importResult.created} created \u00b7 ${importResult.skipped} skipped`;
        setImportResultSummary(importSummary);
      }

      let emailMessage = "Organisation created!";
      if (welcomeEmailStatus === "SENT") {
        emailMessage = "Organisation created! Welcome email delivered.";
      } else if (welcomeEmailStatus === "PENDING") {
        emailMessage = "Organisation created! Welcome email is being sent...";
      } else if (welcomeEmailStatus === "FAILED") {
        emailMessage =
          "Organisation created, but welcome email failed. Check the Communications page.";
      }

      setToast({
        message: importSummary ? `${emailMessage} ${importSummary}` : emailMessage,
        tone: welcomeEmailStatus === "FAILED" ? "warning" : "success",
      });
      setTimeout(() => {
        router.push(`/organizations/${organization.id}`);
      }, 1000);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to create organization.");
      const status = getErrorStatus(error);
      const isSlugConflict =
        status === 409 && /slug|subdomain|taken|exists|conflict/i.test(message);

      if (isSlugConflict) {
        setErrors((current) => ({
          ...current,
          slug: "This subdomain is already taken",
        }));
      }

      if (createdOrganizationId) {
        setInlineError(
          "Organisation created, but users were not imported. You can retry from the organisation detail page."
        );
        setToast({
          message: "Organisation created, but user import failed.",
          tone: "warning",
        });
        setTimeout(() => {
          router.push(`/organizations/${createdOrganizationId}`);
        }, 1500);
        return;
      }

      setInlineError(message);
    }
  }, [createOrg, importUsers, router, stagedUsers, validateStep, values]);

  if (isCreating) {
    return (
      <div className="space-y-4">
        {toast ? (
          <div
            className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-3 text-sm ${
              toast.tone === "success"
                ? "border-success-500/40 bg-success-500/15 text-success-500"
                : "border-warning-500/40 bg-warning-500/15 text-warning-500"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
        <OnboardingFormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-success-500/40 bg-success-500/15 text-success-500"
              : "border-warning-500/40 bg-warning-500/15 text-warning-500"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <OnboardingForm
        currentStep={currentStep}
        values={values}
        errors={errors}
        inlineError={inlineError}
        isSubmitting={isCreating}
        isImportingUsers={isImportingUsers}
        isImportModalOpen={importModal.isOpen}
        importedUsersCount={bulkUsers.length}
        importResultSummary={importResultSummary}
        onFieldChange={handleFieldChange}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={() => {
          void handleSubmit();
        }}
        onSingleUserAdded={setSingleUser}
        onSingleUserValidationChange={(state) => {
          setSingleUserValidation(state);
          setErrors((current) => ({ ...current, singleUser: undefined }));
        }}
        onOpenImportModal={importModal.open}
        onCloseImportModal={importModal.close}
        onBulkImportReady={(rows) => {
          setBulkUsers(rows);
          setImportResultSummary(null);
          setInlineError(null);
        }}
        onClearImportedUsers={() => {
          setBulkUsers([]);
          setImportResultSummary(null);
        }}
      />
    </div>
  );
}
