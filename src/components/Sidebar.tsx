"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, type Permission } from "@/lib/rbac";

const navItems: Array<{ href: string; label: string; permission?: Permission }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizations", label: "Organizations", permission: "org.view" },
  { href: "/emails", label: "Communications", permission: "org.view" },
  { href: "/subscriptions", label: "Subscriptions", permission: "subscription.view" },
  { href: "/analytics", label: "Analytics", permission: "analytics.view" },
  { href: "/support", label: "Support", permission: "support.view" },
  { href: "/invoices", label: "Invoices", permission: "billing.view" },
  { href: "/features", label: "Features", permission: "feature.manage" },
  { href: "/activity", label: "Activity", permission: "analytics.view" },
  { href: "/settings", label: "Settings", permission: "settings.manage" },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="h-full w-full border-r border-white/10 bg-slate-950/60 px-6 py-8 overflow-y-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Internal
        </div>
        <div className="text-2xl font-semibold text-white">Bloom HQ</div>
        <div className="mt-1 text-sm text-slate-400">
          Operations control center
        </div>
      </div>
      <nav className="space-y-2">
        {navItems
          .filter((item) => (item.permission ? hasPermission(user, item.permission) : true))
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-glow"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <span className="font-medium">{item.label}</span>
                {isActive ? (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accent-400">
                    Live
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>
      <div className="mt-12 rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</div>
        <div className="mt-2 text-sm text-slate-200">Secure internal portal</div>
        <div className="mt-1 text-xs text-slate-500">Restricted access only</div>
      </div>
    </aside>
  );
}
