/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#18181b',
        surface2: '#27272a',
        border: '#27272a',
        primary: '#f4f4f5',
        muted: '#a1a1aa',
        accent: '#fbbf24',
        danger: '#f87171',
        success: '#4ade80',
        info: '#60a5fa',
        ro: {
            str: '#f87171',
            agi: '#fbbf24',
            vit: '#4ade80',
            int: '#60a5fa',
            dex: '#c084fc',
            luk: '#fb923c'
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
