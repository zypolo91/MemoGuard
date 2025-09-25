import type { Config } from "tailwindcss";

const config = {
  content: ["./index.html", "./**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        outline: "var(--color-outline)",
        content: "var(--color-content)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        danger: "var(--color-danger)"
      },
      fontFamily: {
        sans: ["'Source Han Sans SC'", "'Noto Sans SC'", "system-ui", "sans-serif"],
        display: ["'LXGW WenKai'", "'Noto Serif SC'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        soft: "0 10px 30px -15px rgba(15, 23, 42, 0.35)"
      },
      borderRadius: {
        xl: "1.5rem"
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;
