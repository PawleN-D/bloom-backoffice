import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/50 px-8 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Bloom Internal
            </p>
            <h1 className="text-xl font-semibold text-white">HQ Operations</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            <span className="text-xs text-slate-300">Live systems healthy</span>
          </div>
        </header>
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
