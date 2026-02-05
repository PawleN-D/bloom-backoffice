import type { ButtonHTMLAttributes } from "react";

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
};

export default function Toggle({ pressed, className = "", ...props }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        pressed ? "bg-accent-500" : "bg-slate-700"
      } ${className}`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          pressed ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
