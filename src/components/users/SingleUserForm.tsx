"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ImportedUser, ImportUserRole } from "@/types/models/user";

type SingleUserErrors = Partial<Record<keyof ImportedUser, string>>;

type SingleUserValidationState = {
  isEmpty: boolean;
  hasErrors: boolean;
};

interface SingleUserFormProps {
  onUserAdded: (user: ImportedUser | null) => void;
  onValidationChange?: (state: SingleUserValidationState) => void;
}

const roleOptions: ImportUserRole[] = ["care_worker", "manager", "admin"];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(values: ImportedUser): SingleUserErrors {
  const errors: SingleUserErrors = {};
  if (!values.first_name.trim()) errors.first_name = "First name is required.";
  if (!values.last_name.trim()) errors.last_name = "Last name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.role) errors.role = "Role is required.";
  return errors;
}

export function SingleUserForm({ onUserAdded, onValidationChange }: SingleUserFormProps) {
  const [values, setValues] = useState<ImportedUser>({
    first_name: "",
    last_name: "",
    email: "",
    role: "care_worker",
    phone: "",
  });
  const [errors, setErrors] = useState<SingleUserErrors>({});

  const isEmpty = useMemo(
    () =>
      !values.first_name.trim() &&
      !values.last_name.trim() &&
      !values.email.trim() &&
      !values.phone?.trim(),
    [values]
  );

  useEffect(() => {
    if (isEmpty) {
      setErrors({});
      onUserAdded(null);
      onValidationChange?.({ isEmpty: true, hasErrors: false });
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);
    const hasErrors = Object.keys(nextErrors).length > 0;

    onValidationChange?.({ isEmpty: false, hasErrors });
    if (hasErrors) {
      onUserAdded(null);
      return;
    }

    onUserAdded({
      ...values,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
    });
  }, [isEmpty, onUserAdded, onValidationChange, values]);

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-slate-950/60 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="single-user-first-name">First Name</Label>
          <Input
            id="single-user-first-name"
            value={values.first_name}
            onChange={(event) =>
              setValues((current) => ({ ...current, first_name: event.target.value }))
            }
            placeholder="Ava"
          />
          {errors.first_name ? <p className="text-xs text-danger-500">{errors.first_name}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="single-user-last-name">Last Name</Label>
          <Input
            id="single-user-last-name"
            value={values.last_name}
            onChange={(event) =>
              setValues((current) => ({ ...current, last_name: event.target.value }))
            }
            placeholder="Byrne"
          />
          {errors.last_name ? <p className="text-xs text-danger-500">{errors.last_name}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="single-user-email">Email</Label>
          <Input
            id="single-user-email"
            type="email"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="ava@example.com"
          />
          {errors.email ? <p className="text-xs text-danger-500">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="single-user-role">Role</Label>
          <Select
            id="single-user-role"
            value={values.role}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                role: event.target.value as ImportUserRole,
              }))
            }
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          {errors.role ? <p className="text-xs text-danger-500">{errors.role}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="single-user-phone">Phone (optional)</Label>
        <Input
          id="single-user-phone"
          value={values.phone}
          onChange={(event) =>
            setValues((current) => ({ ...current, phone: event.target.value }))
          }
          placeholder="+353870000001"
        />
      </div>

      <p className="text-xs text-slate-500">
        Leave all fields empty to skip single-user creation.
      </p>
    </div>
  );
}
