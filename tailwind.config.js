/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--primary-rgb) / <alpha-value>)",
        "primary-low": "rgb(var(--primary-low-rgb) / <alpha-value>)",
        "primary-hover": "rgb(var(--primary-hover-rgb) / <alpha-value>)",
        orange: {
          DEFAULT: "rgb(var(--orange-rgb) / <alpha-value>)",
          100: "#ffedd5",
          700: "#c2410c",
        },
        grey: "rgb(var(--grey-rgb) / <alpha-value>)",
        "grey-low": "rgb(var(--grey-low-rgb) / <alpha-value>)",
        "text-high": "rgb(var(--text-high-rgb) / <alpha-value>)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out",
        "shift-gradient": "shiftGradient 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shiftGradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 15px rgba(0, 0, 0, 0.06)",
        "primary-soft": "0 8px 25px rgba(0, 135, 154, 0.1)",
      },
    },
  },
  plugins: [],
};
