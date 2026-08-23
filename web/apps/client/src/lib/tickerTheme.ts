export interface TickerTheme {
  avatarText: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
  hexColor: string;
  fillColorClass: string;
}

const PRESET_TICKERS: Record<string, TickerTheme> = {
  PRON: {
    avatarText: "PR",
    bgClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    dotColor: "bg-blue-400",
    hexColor: "#60a5fa",
    fillColorClass: "bg-blue-500",
  },
  PRT: {
    avatarText: "PR",
    bgClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    dotColor: "bg-blue-400",
    hexColor: "#60a5fa",
    fillColorClass: "bg-blue-500",
  },
  GEFF: {
    avatarText: "GF",
    bgClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    dotColor: "bg-purple-400",
    hexColor: "#c084fc",
    fillColorClass: "bg-purple-500",
  },
  GEF: {
    avatarText: "GF",
    bgClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    dotColor: "bg-purple-400",
    hexColor: "#c084fc",
    fillColorClass: "bg-purple-500",
  },
  MORR: {
    avatarText: "MO",
    bgClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    dotColor: "bg-amber-400",
    hexColor: "#fbbf24",
    fillColorClass: "bg-amber-500",
  },
  MOR: {
    avatarText: "MO",
    bgClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    dotColor: "bg-amber-400",
    hexColor: "#fbbf24",
    fillColorClass: "bg-amber-500",
  },
  ALDE: {
    avatarText: "AL",
    bgClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
    hexColor: "#34d399",
    fillColorClass: "bg-emerald-500",
  },
  ALD: {
    avatarText: "AL",
    bgClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
    hexColor: "#34d399",
    fillColorClass: "bg-emerald-500",
  },
  PAYN: {
    avatarText: "PY",
    bgClass: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    textClass: "text-teal-400",
    borderClass: "border-teal-500/30",
    dotColor: "bg-teal-400",
    hexColor: "#2dd4bf",
    fillColorClass: "bg-teal-500",
  },
  IZLU: {
    avatarText: "IZ",
    bgClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    dotColor: "bg-cyan-400",
    hexColor: "#22d3ee",
    fillColorClass: "bg-cyan-500",
  },
  JUPR: {
    avatarText: "JU",
    bgClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    dotColor: "bg-rose-400",
    hexColor: "#fb7185",
    fillColorClass: "bg-rose-500",
  },
  LIGH: {
    avatarText: "LI",
    bgClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/30",
    dotColor: "bg-indigo-400",
    hexColor: "#818cf8",
    fillColorClass: "bg-indigo-500",
  },
};

const DYNAMIC_PALETTES = [
  {
    bgClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    dotColor: "bg-blue-400",
    hexColor: "#60a5fa",
    fillColorClass: "bg-blue-500",
  },
  {
    bgClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    dotColor: "bg-purple-400",
    hexColor: "#c084fc",
    fillColorClass: "bg-purple-500",
  },
  {
    bgClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    dotColor: "bg-amber-400",
    hexColor: "#fbbf24",
    fillColorClass: "bg-amber-500",
  },
  {
    bgClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
    hexColor: "#34d399",
    fillColorClass: "bg-emerald-500",
  },
  {
    bgClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    dotColor: "bg-rose-400",
    hexColor: "#fb7185",
    fillColorClass: "bg-rose-500",
  },
  {
    bgClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    dotColor: "bg-cyan-400",
    hexColor: "#22d3ee",
    fillColorClass: "bg-cyan-500",
  },
  {
    bgClass: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    textClass: "text-teal-400",
    borderClass: "border-teal-500/30",
    dotColor: "bg-teal-400",
    hexColor: "#2dd4bf",
    fillColorClass: "bg-teal-500",
  },
  {
    bgClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    dotColor: "bg-orange-400",
    hexColor: "#fb923c",
    fillColorClass: "bg-orange-500",
  },
  {
    bgClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/30",
    dotColor: "bg-indigo-400",
    hexColor: "#818cf8",
    fillColorClass: "bg-indigo-500",
  },
  {
    bgClass: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
    textClass: "text-fuchsia-400",
    borderClass: "border-fuchsia-500/30",
    dotColor: "bg-fuchsia-400",
    hexColor: "#e879f9",
    fillColorClass: "bg-fuchsia-500",
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTickerTheme(ticker: string): TickerTheme {
  const clean = (ticker || "").toUpperCase().trim();
  if (PRESET_TICKERS[clean]) {
    return PRESET_TICKERS[clean];
  }

  // Derive 2-letter glyph
  const avatarText =
    clean.length >= 2
      ? clean.slice(0, 2)
      : clean.length === 1
      ? clean + "X"
      : "ST";

  const palette = DYNAMIC_PALETTES[hashString(clean) % DYNAMIC_PALETTES.length];

  return {
    avatarText,
    ...palette,
  };
}
