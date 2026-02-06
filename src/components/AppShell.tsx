"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { isPagesDevHost, resolveTenantFromWindow } from "@/lib/tenant";

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (typeof window === "undefined") return;
    const tenant = resolveTenantFromWindow();
    const loginPath =
      tenant && isPagesDevHost(window.location.host) ? `/${tenant}/login` : "/login";
    window.location.assign(loginPath);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          />
          <div className="relative h-full w-[280px] max-w-[85vw]">
            <Sidebar onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/50 px-6 py-5 lg:px-8 lg:py-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/70 text-slate-200 lg:hidden"
              onClick={() => setIsMenuOpen(true)}
            >
              <span className="sr-only">Open navigation</span>
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-5 bg-current" />
                <span className="h-0.5 w-5 bg-current" />
                <span className="h-0.5 w-5 bg-current" />
              </span>
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Bloom Internal
              </p>
              <h1 className="text-xl font-semibold text-white">HQ Operations</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              <span className="text-xs text-slate-300">Live systems healthy</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
