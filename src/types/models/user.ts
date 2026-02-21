export type ImportUserRole = "care_worker" | "manager" | "admin";

export type ImportedUser = {
  first_name: string;
  last_name: string;
  email: string;
  role: ImportUserRole;
  phone?: string;
};

export type ImportedUserRowError = {
  row: number;
  errors: string[];
};

export type User = ImportedUser & {
  id: string;
  created_at?: string;
  updated_at?: string;
};
