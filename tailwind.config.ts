import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        control: {
          base: "#05070b",
          panel: "#0b1118",
          panel2: "#101922",
          edge: "#203141",
          line: "#2d4153",
          text: "#e5eef5",
          muted: "#8394a5"
        },
        alarm: {
          critical: "#ff3b4f",
          high: "#ff8a3d",
          medium: "#ffd24d",
          low: "#38bdf8",
          normal: "#35d08f"
        },
        process: {
          cyan: "#31d6ff",
          mint: "#35d08f",
          amber: "#ffd24d",
          coral: "#ff6b62"
        }
      },
      boxShadow: {
        critical: "0 0 0 1px rgba(255,59,79,0.42), 0 0 32px rgba(255,59,79,0.2)",
        high: "0 0 0 1px rgba(255,138,61,0.34), 0 0 26px rgba(255,138,61,0.16)",
        panel: "0 18px 60px rgba(0,0,0,0.32)"
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"]
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        scan: "scan 3.8s linear infinite",
        breathe: "breathe 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
