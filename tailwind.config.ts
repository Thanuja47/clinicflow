import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "var(--bg-grouped)",
          surface: "var(--bg-surface)",
          secondary: "var(--bg-surface-secondary)",
          border: "var(--border-subtle)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          blue: "var(--accent-blue)",
          green: "var(--accent-green)",
          orange: "var(--accent-orange)",
          red: "var(--accent-red)",
          purple: "var(--accent-purple)",
        },
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '10px',
        'apple-lg': '12px',
        'apple-xl': '16px',
        'apple-pill': '20px',
      },
    },
  },
  plugins: [],
};
export default config;
