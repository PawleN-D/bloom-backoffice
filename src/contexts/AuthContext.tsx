"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { clearStoredAuth, getStoredUser, storeUser } from "@/lib/auth";
import type { AuthSessionResponse, AuthSessionStatus, BackOfficeUser } from "@/types";

type AuthContextValue = {
  user: BackOfficeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, persist?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackOfficeUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }

    const checkSession = async () => {
      try {
        const response = await apiClient.get<AuthSessionStatus>("/api/auth/session");
        if (!response.data.authenticated) {
          clearStoredAuth();
          setUser(null);
          setHasSession(false);
          return;
        }
        setHasSession(true);
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch {
        clearStoredAuth();
        setUser(null);
        setHasSession(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string, persist = true) => {
    const response = await apiClient.post<AuthSessionResponse>("/api/auth/login", {
      email,
      password,
    });

    storeUser(response.data.user, persist);
    setUser(response.data.user);
    setHasSession(true);
  };

  const logout = async () => {
    await apiClient.post("/api/auth/logout");
    clearStoredAuth();
    setUser(null);
    setHasSession(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: hasSession,
      isLoading,
      login,
      logout,
    }),
    [user, hasSession, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
