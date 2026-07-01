/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "var(--color-base)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
        },
        elevated: {
          DEFAULT: "var(--color-elevated)",
        },
        border: {
          DEFAULT: "var(--color-border)",
        },
        accent: {
          DEFAULT: "#5B8CFF",
          dim: "#3D63CC",
          glow: "#7FA4FF",
        },
        success: "#34D399",
        danger: "#F26B6B",
        warn: "#F2B84B",
        ink: {
          DEFAULT: "var(--color-ink)",
          dim: "var(--color-ink-dim)",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "bubble-in": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(52,211,153,0.55)" },
          "70%": { boxShadow: "0 0 0 6px rgba(52,211,153,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(52,211,153,0)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "bubble-in": "bubble-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring": "pulse-ring 2s infinite",
        "typing-dot": "typing-dot 1.2s infinite ease-in-out",
        shimmer: "shimmer 1.6s infinite linear",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
