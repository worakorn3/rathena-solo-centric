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
  // Phase 13: Decentralized Rune & Crypto-Asset Protocols
  EMP: {
    avatarText: "EM",
    bgClass: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    textClass: "text-amber-300",
    borderClass: "border-amber-400/40",
    dotColor: "bg-amber-400",
    hexColor: "#fbbf24",
    fillColorClass: "bg-amber-400",
  },
  YMI: {
    avatarText: "YM",
    bgClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    textClass: "text-indigo-300",
    borderClass: "border-indigo-500/40",
    dotColor: "bg-indigo-400",
    hexColor: "#818cf8",
    fillColorClass: "bg-indigo-500",
  },
  WRP: {
    avatarText: "WR",
    bgClass: "bg-cyan-400/20 text-cyan-300 border-cyan-400/40",
    textClass: "text-cyan-300",
    borderClass: "border-cyan-400/40",
    dotColor: "bg-cyan-400",
    hexColor: "#22d3ee",
    fillColorClass: "bg-cyan-400",
  },
  SHD: {
    avatarText: "SH",
    bgClass: "bg-zinc-600/25 text-zinc-300 border-zinc-500/40",
    textClass: "text-zinc-300",
    borderClass: "border-zinc-500/40",
    dotColor: "bg-zinc-400",
    hexColor: "#a1a1aa",
    fillColorClass: "bg-zinc-600",
  },
  ZEX: {
    avatarText: "ZX",
    bgClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    textClass: "text-yellow-300",
    borderClass: "border-yellow-500/40",
    dotColor: "bg-yellow-400",
    hexColor: "#eab308",
    fillColorClass: "bg-yellow-500",
  },
  ORA: {
    avatarText: "OR",
    bgClass: "bg-blue-600/20 text-blue-300 border-blue-500/40",
    textClass: "text-blue-300",
    borderClass: "border-blue-500/40",
    dotColor: "bg-blue-400",
    hexColor: "#3b82f6",
    fillColorClass: "bg-blue-600",
  },
  POR: {
    avatarText: "PO",
    bgClass: "bg-pink-500/25 text-pink-300 border-pink-400/50",
    textClass: "text-pink-300",
    borderClass: "border-pink-400/50",
    dotColor: "bg-pink-400",
    hexColor: "#f472b6",
    fillColorClass: "bg-pink-500",
  },
  NZN: {
    avatarText: "NZ",
    bgClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    textClass: "text-emerald-300",
    borderClass: "border-emerald-500/40",
    dotColor: "bg-emerald-400",
    hexColor: "#10b981",
    fillColorClass: "bg-emerald-500",
  },
  ALM: {
    avatarText: "AL",
    bgClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    textClass: "text-violet-300",
    borderClass: "border-violet-500/40",
    dotColor: "bg-violet-400",
    hexColor: "#a78bfa",
    fillColorClass: "bg-violet-500",
  },
  KFX: {
    avatarText: "KF",
    bgClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    textClass: "text-sky-300",
    borderClass: "border-sky-500/40",
    dotColor: "bg-sky-400",
    hexColor: "#38bdf8",
    fillColorClass: "bg-sky-500",
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
