/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ro: {
          bg: "#1a2130",
          card: "#263245",
          titlebar: "#3d5470",
          titlebarDark: "#27384c",
          borderLight: "#6e8aa8",
          borderDark: "#151e2a",
          parchment: "#f4ede1",
          parchmentDark: "#e5d9c5",
          gold: "#e6b033",
          goldHover: "#ffd269",
          zeny: "#f3c642",
          hp: "#22c55e",
          sp: "#3b82f6",
          exp: "#eab308",
          redAccent: "#ef4444",
          greenAccent: "#10b981",
        },
      },
      fontFamily: {
        retro: ["VT323", "monospace"],
        cinzel: ["Cinzel", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        roWindow: "3px 4px 0px 0px rgba(0, 0, 0, 0.45)",
        roInset: "inset 2px 2px 3px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(255, 255, 255, 0.1)",
        roOutset: "inset 1px 1px 1px rgba(255, 255, 255, 0.4), inset -1px -1px 2px rgba(0, 0, 0, 0.4)",
        roButton: "1px 2px 0px 0px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
