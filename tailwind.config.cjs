/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        nightshift: {
          primary: "#f59e0b",
          "primary-content": "#1a1305",
          secondary: "#ec4899",
          "secondary-content": "#1f0a15",
          accent: "#a855f7",
          "accent-content": "#120722",
          neutral: "#1f1f23",
          "neutral-content": "#e4e3ed",
          "base-100": "#111114",
          "base-200": "#0c0c0f",
          "base-300": "#1b1b21",
          "base-content": "#e5e7eb",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#fbbf24",
          error: "#ef4444"
        }
      }
    ],
    darkTheme: "nightshift",
    logs: false
  }
};
