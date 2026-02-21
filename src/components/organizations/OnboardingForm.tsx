"use client";

import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StepIndicator } from "@/components/organizations/StepIndicator";
import { SingleUserForm } from "@/components/users/SingleUserForm";
import { UserImportModal } from "@/components/users/UserImportModal";
import type { CreateOrgPayload } from "@/lib/hooks/api/useCreateOrg";
import type { ImportedUser } from "@/types/models/user";

type SingleUserValidationState = {
  isEmpty: boolean;
  hasErrors: boolean;
};

type OnboardingField = keyof CreateOrgPayload | "singleUser";

interface OnboardingFormProps {
  currentStep: number;
  values: CreateOrgPayload;
  errors: Partial<Record<OnboardingField, string>>;
  inlineError: string | null;
  isSubmitting: boolean;
  isImportingUsers: boolean;
  isImportModalOpen: boolean;
  importedUsersCount: number;
  importResultSummary: string | null;
  onFieldChange: (field: keyof CreateOrgPayload, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSingleUserAdded: (user: ImportedUser | null) => void;
  onSingleUserValidationChange: (state: SingleUserValidationState) => void;
  onOpenImportModal: () => void;
  onCloseImportModal: () => void;
  onBulkImportReady: (rows: ImportedUser[]) => void;
  onClearImportedUsers: () => void;
}

const steps = ["Organisation Details", "Manager Details", "Users"] as const;

export function OnboardingForm({
  currentStep,
  values,
  errors,
  inlineError,
  isSubmitting,
  isImportingUsers,
  isImportModalOpen,
  importedUsersCount,
  importResultSummary,
  onFieldChange,
  onNext,
  onBack,
  onSubmit,
  onSingleUserAdded,
  onSingleUserValidationChange,
  onOpenImportModal,
  onCloseImportModal,
  onBulkImportReady,
  onClearImportedUsers,
}: OnboardingFormProps) {
  const isFinalStep = currentStep === steps.length - 1;
  const isBusy = isSubmitting || isImportingUsers;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Onboard New Organisation</h2>
        <p className="mt-2 text-sm text-slate-400">
          Create the organisation profile, assign a manager, and optionally add users.
        </p>
      </div>

      <StepIndicator steps={steps as unknown as string[]} currentStep={currentStep} />

      <Card className="space-y-6">
        {currentStep === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={values.company_name}
                onChange={(event) => onFieldChange("company_name", event.target.value)}
                placeholder="CareWell Dublin Ltd"
              />
              {errors.company_name ? (
                <p className="text-xs text-danger-500">{errors.company_name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(event) => onFieldChange("slug", event.target.value)}
                placeholder="carewell-dublin-ltd"
              />
              <p className="text-xs text-slate-500">
                Subdomain preview:{" "}
                <span className="font-mono text-slate-300">
                  {(values.slug || "your-subdomain")}.bloom.com
                </span>
              </p>
              {errors.slug ? <p className="text-xs text-danger-500">{errors.slug}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                id="plan"
                value={values.plan}
                onChange={(event) => onFieldChange("plan", event.target.value)}
              >
                <option value="FREE">FREE</option>
                <option value="STARTER">STARTER</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </Select>
              {errors.plan ? <p className="text-xs text-danger-500">{errors.plan}</p> : null}
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manager_name">Manager Name *</Label>
              <Input
                id="manager_name"
                value={values.manager_name}
                onChange={(event) => onFieldChange("manager_name", event.target.value)}
                placeholder="Sarah Murphy"
              />
              {errors.manager_name ? (
                <p className="text-xs text-danger-500">{errors.manager_name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_email">Manager Email *</Label>
              <Input
                id="manager_email"
                type="email"
                value={values.manager_email}
                onChange={(event) => onFieldChange("manager_email", event.target.value)}
                placeholder="sarah@carewell.ie"
              />
              {errors.manager_email ? (
                <p className="text-xs text-danger-500">{errors.manager_email}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manager_phone">Manager Phone</Label>
              <Input
                id="manager_phone"
                value={values.manager_phone ?? ""}
                onChange={(event) => onFieldChange("manager_phone", event.target.value)}
                placeholder="+353870000000"
              />
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Add Users</h3>
                <p className="text-sm text-slate-400">Add one user or import users in bulk.</p>
              </div>
              <button
                type="button"
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary-light transition hover:bg-primary/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M12 16V4" />
                  <path d="m6 10 6-6 6 6" />
                  <path d="M4 20h16" />
                </svg>
                Import Users
              </button>
            </div>

            <SingleUserForm
              onUserAdded={onSingleUserAdded}
              onValidationChange={onSingleUserValidationChange}
            />

            {errors.singleUser ? (
              <p className="text-sm text-danger-500">{errors.singleUser}</p>
            ) : null}

            {importedUsersCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
                <p className="text-sm text-primary-light">
                  {importedUsersCount} user{importedUsersCount !== 1 ? "s" : ""} ready for import
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={onClearImportedUsers}>
                  Clear Import
                </Button>
              </div>
            ) : null}

            {importResultSummary ? (
              <p className="text-sm text-success-500">Import summary: {importResultSummary}</p>
            ) : null}
          </div>
        ) : null}

        {inlineError ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {inlineError}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <Button type="button" variant="ghost" onClick={onBack} disabled={currentStep === 0 || isBusy}>
            Back
          </Button>

          {isFinalStep ? (
            <Button type="button" onClick={onSubmit} disabled={isBusy}>
              {isSubmitting ? "Creating Organisation..." : isImportingUsers ? "Importing Users..." : "Create Organisation"}
            </Button>
          ) : (
            <Button type="button" onClick={onNext} disabled={isBusy}>
              Next
            </Button>
          )}
        </div>
      </Card>

      {isImportModalOpen ? (
        <UserImportModal
          onClose={onCloseImportModal}
          onImportReady={(rows) => {
            onBulkImportReady(rows);
            onCloseImportModal();
          }}
        />
      ) : null}
    </div>
  );
}
