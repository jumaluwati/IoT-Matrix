import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" }
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ],
        mono: ["SF Mono", "ui-monospace", "Menlo", "monospace"]
      },
      colors: {
        cisco: {
          50: "#e6f7fd",
          100: "#bfeaf9",
          200: "#80d5f3",
          300: "#40bfed",
          400: "#1aa9e2",
          500: "#049fd9",
          600: "#0381b0",
          700: "#026487",
          800: "#01475e",
          900: "#012a38"
        },
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#bcc3d1",
          400: "#8a93a6",
          500: "#5b6478",
          600: "#3f4757",
          700: "#2b313d",
          800: "#1a1e26",
          900: "#0b0d12"
        }
      },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 30px rgba(0,0,0,0.06)",
        glow: "0 0 0 1px rgba(4,159,217,0.25), 0 20px 60px -20px rgba(4,159,217,0.45)",
        soft: "0 10px 40px -10px rgba(10,12,20,0.15)"
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(4,159,217,0.10), transparent 60%), radial-gradient(ellipse at bottom, rgba(10,12,20,0.06), transparent 60%)",
        "hero-light":
          "linear-gradient(180deg, #ffffff 0%, #f5f7fb 60%, #eef2f8 100%)",
        "hero-dark":
          "linear-gradient(180deg, #0b0d12 0%, #0e1118 60%, #0a0c11 100%)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
