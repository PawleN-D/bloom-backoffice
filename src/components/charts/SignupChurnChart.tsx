"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function SignupChurnChart({
  data,
}: {
  data: Array<{ month: string; signups: number; churn: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Legend wrapperStyle={{ color: "#cbd5e1" }} />
          <Bar dataKey="signups" name="Sign-ups" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="churn" name="Churn" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
