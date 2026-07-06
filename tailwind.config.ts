import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0C1E17",
        pine: "#163026",
        moss: "#1F4033",
        fern: "#2C5744",
        ivory: "#F7F3E8",
        parchment: "#EFE8D6",
        amber: "#F2B33D",
        honey: "#FFD27A",
        sage: "#9DB8A6",
        coral: "#E2654E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,30,23,0.18), 0 12px 32px -12px rgba(12,30,23,0.45)",
        cue: "0 2px 0 #d9d0ba, 0 18px 40px -18px rgba(0,0,0,0.6)",
        glowAmber: "0 0 0 1px rgba(242,179,61,0.35), 0 8px 40px -8px rgba(242,179,61,0.35)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.8)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--tw-rotate, 0))" },
          "50%": { transform: "translateY(-8px) rotate(var(--tw-rotate, 0))" },
        },
        blinkCursor: {
          "0%, 45%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        dotBounce: {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-5px)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        spotlightDrift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-4%, 3%)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        rise: "rise 0.45s ease-out both",
        floatSlow: "floatSlow 7s ease-in-out infinite",
        blinkCursor: "blinkCursor 1.1s step-end infinite",
        dotBounce: "dotBounce 1.2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        spotlightDrift: "spotlightDrift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
