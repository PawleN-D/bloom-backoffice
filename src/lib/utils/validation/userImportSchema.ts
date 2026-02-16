import { z } from "zod";
import type { ImportedUser, ImportedUserRowError } from "@/types/models/user";

const rowSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name required"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name required"),
  email: z
    .string()
    .trim()
    .email("Invalid email"),
  role: z.enum(["care_worker", "manager", "admin"], {
    errorMap: () => ({
      message: "Role must be: care_worker, manager, or admin",
    }),
  }),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export function validateImportRows(raw: unknown[]) {
  const valid: ImportedUser[] = [];
  const invalid: ImportedUserRowError[] = [];

  raw.forEach((row, index) => {
    const result = rowSchema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
      return;
    }

    invalid.push({
      row: index + 2,
      errors: result.error.issues.map((issue) => issue.message),
    });
  });

  return { valid, invalid };
}
