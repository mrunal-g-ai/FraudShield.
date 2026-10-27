/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: "#F5F7FA",
          surface: "#FFFFFF",
          text: "#172033",
          muted: "#667085",
          accent: "#2457C5",
          "accent-hover": "#1D45A0",
          border: "#E2E7EF",
          danger: "#C83E4D",
          "danger-light": "#FDF2F3",
          success: "#23845B",
          "success-light": "#EDF7F2",
          warning: "#D97706",
          "warning-light": "#FFFBEB",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
