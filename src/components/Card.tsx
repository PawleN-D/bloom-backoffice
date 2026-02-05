import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
