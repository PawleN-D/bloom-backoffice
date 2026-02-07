"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrganizationSummary } from "@/types";

export default function OrganizationActions({
  organization,
  onSuspendToggle,
  permissions,
  variant = "icon",
}: {
  organization: OrganizationSummary;
  onSuspendToggle: (id: string) => void;
  permissions?: {
    canEdit?: boolean;
    canSuspend?: boolean;
    canViewSubscription?: boolean;
    canViewActivity?: boolean;
    canDelete?: boolean;
  };
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const canEdit = permissions?.canEdit ?? true;
  const canSuspend = permissions?.canSuspend ?? true;
  const canViewSubscription = permissions?.canViewSubscription ?? true;
  const canViewActivity = permissions?.canViewActivity ?? true;
  const canDelete = permissions?.canDelete ?? true;

  const hasActions = canEdit || canSuspend || canViewSubscription || canViewActivity || canDelete;

  if (!hasActions) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          variant === "icon"
            ? "rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-300"
            : "rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200"
        }
      >
        {variant === "icon" ? "•••" : "Actions"}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-lg">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/60"
            onClick={() => handleAction(() => router.push(`/organizations/${organization.id}`))}
          >
            View Details
          </button>
          {canEdit ? (
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/60"
              onClick={() =>
                handleAction(() => router.push(`/organizations/${organization.id}?mode=edit`))
              }
            >
              Edit Organization
            </button>
          ) : null}
          {canViewSubscription ? (
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/60"
              onClick={() => handleAction(() => router.push(`/subscriptions/${organization.id}`))}
            >
              View Subscription
            </button>
          ) : null}
          {canViewActivity ? (
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/60"
              onClick={() => handleAction(() => router.push(`/activity?org=${organization.id}`))}
            >
              View Activity Log
            </button>
          ) : null}
          {canSuspend ? (
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/60"
              onClick={() => handleAction(() => onSuspendToggle(organization.id))}
            >
              {organization.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger-500 hover:bg-slate-900/60"
              onClick={() =>
                handleAction(() => {
                  if (window.confirm("Soft delete this organization?")) {
                    onSuspendToggle(organization.id);
                  }
                })
              }
            >
              Delete (Soft)
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
