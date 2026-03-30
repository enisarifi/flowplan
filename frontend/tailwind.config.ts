import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef0ff",
          100: "#dfe3ff",
          200: "#c5caff",
          300: "#a2a5ff",
          400: "#8181fc",
          500: "#6c5ce7",
          600: "#5a3fd6",
          700: "#4c32bc",
          800: "#3e2b98",
          900: "#362979",
          950: "#211847",
        },
        accent: {
          50: "#fffbeb",
          100: "#fff3c6",
          200: "#ffe588",
          300: "#ffd24a",
          400: "#ffbe20",
          500: "#f99b07",
          600: "#dd7302",
          700: "#b75006",
          800: "#943d0c",
          900: "#7a330d",
          950: "#461902",
        },
        surface: {
          50: "#f8f9fc",
          100: "#f1f3f9",
          200: "#e8ebf4",
          300: "#d5dae8",
          400: "#b8bfd4",
          500: "#9aa2bc",
          600: "#7f86a3",
          700: "#6b7190",
          800: "#545873",
          900: "#484c62",
          950: "#2d3040",
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        medium: "0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        heavy: "0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -4px rgb(0 0 0 / 0.06)",
        glow: "0 0 20px -4px rgb(108 92 231 / 0.4)",
        "glow-lg": "0 0 40px -8px rgb(108 92 231 / 0.35)",
        "brand-sm": "0 2px 8px -2px rgb(108 92 231 / 0.25)",
        "brand-md": "0 4px 20px -4px rgb(108 92 231 / 0.3)",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "slide-left": "slide-left 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-left": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
