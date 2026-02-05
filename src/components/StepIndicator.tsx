export default function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        return (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] ${
              isActive
                ? "border-accent-500 text-accent-400"
                : isComplete
                ? "border-success-500/60 text-success-500"
                : "border-white/10 text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive
                  ? "bg-accent-500"
                  : isComplete
                  ? "bg-success-500"
                  : "bg-slate-600"
              }`}
            />
            {step}
          </div>
        );
      })}
    </div>
  );
}
