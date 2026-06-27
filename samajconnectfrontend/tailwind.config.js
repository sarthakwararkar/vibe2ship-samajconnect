/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          root:      "#E9D5FF",
          primary:   "rgba(255, 255, 255, 0.35)",
          secondary: "rgba(255, 255, 255, 0.50)",
          tertiary:  "rgba(255, 255, 255, 0.65)",
        },
        purple: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
        },
        module: {
          teal:    "#0D9488",
          blue:    "#2563EB",
          pink:    "#DB2777",
          amber:   "#D97706",
          emerald: "#059669",
          yellow:  "#EAB308",
        }
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["Space Grotesk", "sans-serif"],
        data:    ["Space Mono", "monospace"],
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "16px",
        lg: "24px",
        xl: "32px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.35s ease both",
        "fade-in":    "fadeIn 0.25s ease both",
        "glow-pulse": "glowPulse 1.5s ease-in-out infinite",
        "shimmer":    "shimmer 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp:  { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 16px rgba(99,102,241,0.15)" }, "50%": { boxShadow: "0 0 36px rgba(99,102,241,0.3)" } },
        shimmer:   { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      borderRadius: { "2xl": "16px", "3xl": "20px", "4xl": "24px" },
      boxShadow: {
        glass:       "0 8px 32px rgba(31,38,135,0.06), 0 1px 0 rgba(255,255,255,0.4) inset",
        "purple-glow": "0 0 24px rgba(99,102,241,0.15)",
        "purple-glow-lg": "0 0 48px rgba(99,102,241,0.3)",
      }
    }
  },
  plugins: [],
}
