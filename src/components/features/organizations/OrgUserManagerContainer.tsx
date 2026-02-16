"use client";

import Link from "next/link";
import { useState } from "react";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { SingleUserForm } from "@/components/users/SingleUserForm";
import { UserImportModal } from "@/components/users/UserImportModal";
import { useImportUsers } from "@/lib/hooks/api/useImportUsers";
import { useDisclosure } from "@/lib/hooks/ui/useDisclosure";
import type { ImportedUser } from "@/types/models/user";

type SingleUserValidationState = {
  isEmpty: boolean;
  hasErrors: boolean;
};

interface OrgUserManagerContainerProps {
  organizationId: string;
}

export function OrgUserManagerContainer({ organizationId }: OrgUserManagerContainerProps) {
  const modal = useDisclosure(false);
  const { importUsers, isLoading, result, error } = useImportUsers(organizationId);
  const [singleUser, setSingleUser] = useState<ImportedUser | null>(null);
  const [singleUserValidation, setSingleUserValidation] = useState<SingleUserValidationState>({
    isEmpty: true,
    hasErrors: false,
  });
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSingleUserSave = async () => {
    setInlineError(null);
    if (singleUserValidation.hasErrors || !singleUser) {
      setInlineError("Complete the single-user form before adding this user.");
      return;
    }

    await importUsers([singleUser], organizationId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-white">Manage Organisation Users</h2>
          <p className="mt-2 text-sm text-slate-400">
            Add users one-by-one or upload a CSV/Excel file.
          </p>
        </div>
        <Link href={`/organizations/${organizationId}`} className="text-sm text-primary-light hover:underline">
          Back to organisation
        </Link>
      </div>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Add Users</h3>
          <Button type="button" variant="secondary" onClick={modal.open}>
            Import Users
          </Button>
        </div>

        <SingleUserForm
          onUserAdded={setSingleUser}
          onValidationChange={setSingleUserValidation}
        />

        {inlineError ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {inlineError}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-success-500/40 bg-success-500/10 px-4 py-3 text-sm text-success-500">
            {result.created} created {"\u00b7"} {result.skipped} skipped
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleSingleUserSave()} disabled={isLoading}>
            {isLoading ? "Saving..." : "Add User"}
          </Button>
        </div>
      </Card>

      {modal.isOpen ? (
        <UserImportModal
          onClose={modal.close}
          onImportReady={(rows) => {
            void importUsers(rows, organizationId);
            modal.close();
          }}
        />
      ) : null}
    </div>
  );
}
