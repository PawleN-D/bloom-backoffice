"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isHqAdmin } from "@/lib/rbac";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
        Checking credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isHqAdmin(user)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-sm text-slate-300">
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold text-white">HQ access required</h2>
          <p>
            This portal is reserved for Bloom HQ administrators. Please sign in with an HQ
            admin account or use the main Bloom app to manage your organization.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
