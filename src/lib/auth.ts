import type { BackOfficeUser } from "@/types";

export const AUTH_USER_KEY = "bloom_backoffice_user";

export function getStoredUser(): BackOfficeUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw =
    window.localStorage.getItem(AUTH_USER_KEY) ??
    window.sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as BackOfficeUser;
  } catch {
    return null;
  }
}

export function storeUser(user: BackOfficeUser, persist: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  const storage = persist ? window.localStorage : window.sessionStorage;
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
}
