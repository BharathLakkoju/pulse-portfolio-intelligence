import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: "#0b0f14",
          surface: "#121821",
          surfaceAlt: "#1a2230",
          border: "#263041",
          text: "#e7edf5",
          muted: "#93a2b8",
          accent: "#5b8cff",
          accentSoft: "#2a3a63",
          good: "#2fbf8f",
          bad: "#e2694b",
          warn: "#e0b23c",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "Segoe UI", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
