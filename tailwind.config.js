module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#0f172a",
          900: "#0b1120"
        },
        primary: {
          DEFAULT: "#0F766E",
          dark: "#0d9488",
          light: "#14b8a6"
        },
        accent: {
          400: "#14b8a6",
          500: "#0F766E",
          600: "#0d9488"
        },
        success: {
          DEFAULT: "#10b981",
          500: "#10b981"
        },
        warning: {
          DEFAULT: "#f59e0b",
          500: "#f59e0b"
        },
        danger: {
          500: "#ef4444"
        },
        error: {
          DEFAULT: "#ef4444",
          500: "#ef4444"
        },
        info: {
          DEFAULT: "#3b82f6",
          500: "#3b82f6"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(20, 184, 166, 0.25)",
      }
    },
  },
  plugins: [],
};
