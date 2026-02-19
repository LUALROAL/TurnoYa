/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        surface: {
          bg: "var(--color-bg)",
          1: "var(--color-surface-1)",
          2: "var(--color-surface-2)",
        },
        text: {
          base: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
        accent: {
          1: "var(--color-accent-1)",
          2: "var(--color-accent-2)",
        },
        status: {
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        input: "var(--radius-input)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      },
      fontFamily: {
        displayA: ["var(--font-display-a)"],
        bodyA: ["var(--font-body-a)"],
        displayB: ["var(--font-display-b)"],
        bodyB: ["var(--font-body-b)"]
      }
    },
  },
  plugins: [],
};
