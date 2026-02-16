interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <div
            key={step}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
              isActive
                ? "border-primary text-primary-light"
                : isComplete
                ? "border-success-500/50 text-success-500"
                : "border-white/10 text-slate-500"
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                isActive
                  ? "bg-primary/20 text-primary-light"
                  : isComplete
                  ? "bg-success-500/20 text-success-500"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            {step}
          </div>
        );
      })}
    </div>
  );
}
