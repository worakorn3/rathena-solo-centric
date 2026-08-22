/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ro: {
          bg: "#121824",
          card: "#1e2736",
          cardDark: "#151c27",
          titlebar: "#4b6382",
          titlebarDark: "#2f4258",
          borderLight: "#6e8aa8",
          borderDark: "#151e2a",
          borderMedium: "#364960",
          parchment: "#f4ece0",
          parchmentDark: "#b8a994",
          parchmentDeep: "#a39581",
          gold: "#e5a824",
          goldHover: "#f3ba3b",
          goldDark: "#b37e0e",
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
        roWindow: "4px 6px 0px 0px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0,0,0,0.5)",
        roInset: "inset 2px 2px 4px rgba(0, 0, 0, 0.6), inset -1px -1px 3px rgba(255, 255, 255, 0.05)",
        roOutset: "inset 1px 1px 2px rgba(255, 255, 255, 0.2), inset -2px -2px 3px rgba(0, 0, 0, 0.5)",
        roButton: "0px 2px 0px 0px rgba(0, 0, 0, 0.4)",
        roDeepInset: "inset 3px 3px 6px rgba(0, 0, 0, 0.8), inset -2px -2px 4px rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};
