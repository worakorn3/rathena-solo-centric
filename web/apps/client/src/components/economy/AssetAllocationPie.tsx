import React, { useState } from "react";
import { formatZeny } from "../../lib/assets";
import { PieChart, Filter } from "lucide-react";

export type AssetCategory = "ALL" | "EQUITY" | "CRYPTO";

interface AssetAllocationPieProps {
  liquidZeny: number;
  bankTotal: number;
  stockMarketValue: number;
  municipalMarketValue?: number;
  cryptoMarketValue?: number;
  totalNetWorth: number;
  selectedAssetCategory?: AssetCategory;
  onSelectAssetCategory?: (category: AssetCategory) => void;
}

export const AssetAllocationPie: React.FC<AssetAllocationPieProps> = ({
  liquidZeny,
  bankTotal,
  stockMarketValue,
  municipalMarketValue,
  cryptoMarketValue,
  totalNetWorth,
  selectedAssetCategory = "ALL",
  onSelectAssetCategory,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredPct, setHoveredPct] = useState<number>(0);

  const total = Math.max(1, totalNetWorth);
  const mVal = municipalMarketValue !== undefined ? municipalMarketValue : stockMarketValue;
  const cVal = cryptoMarketValue !== undefined ? cryptoMarketValue : 0;

  const liquidPct = (liquidZeny / total) * 100;
  const bankPct = (bankTotal / total) * 100;
  const muniPct = (mVal / total) * 100;
  const cryptoPct = (cVal / total) * 100;

  const assets = [
    {
      category: "EQUITY" as const,
      label: "Municipal Equities",
      value: mVal,
      pct: muniPct,
      color: "#34d399",
      dot: "bg-emerald-400",
      textColor: "text-emerald-400",
      activeClass: "border-emerald-400/50 bg-emerald-400/10",
    },
    {
      category: "CRYPTO" as const,
      label: "Crypto Protocols",
      value: cVal,
      pct: cryptoPct,
      color: "#c084fc",
      dot: "bg-purple-400",
      textColor: "text-purple-400",
      activeClass: "border-purple-400/50 bg-purple-400/10",
    },
    {
      category: null,
      label: "Bank Principal",
      value: bankTotal,
      pct: bankPct,
      color: "#60a5fa",
      dot: "bg-blue-400",
      textColor: "text-primary",
      activeClass: "border-blue-400/50 bg-blue-400/10",
    },
    {
      category: null,
      label: "Liquid Zeny",
      value: liquidZeny,
      pct: liquidPct,
      color: "#fbbf24",
      dot: "bg-amber-400",
      textColor: "text-primary",
      activeClass: "border-amber-400/50 bg-amber-400/10",
    },
  ];

  // SVG Donut Math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;
  const slices = assets.map((a) => {
    const strokeLength = (a.pct / 100) * circumference;
    const strokeSpace = Math.max(0, circumference - strokeLength);
    const strokeDashoffset = -accumulatedOffset;
    if (a.pct > 0) {
      accumulatedOffset += strokeLength;
    }
    return {
      ...a,
      strokeDasharray: `${strokeLength} ${strokeSpace}`,
      strokeDashoffset,
    };
  });

  const handleCategoryClick = (cat: AssetCategory | null) => {
    if (!onSelectAssetCategory || !cat) return;
    if (selectedAssetCategory === cat) {
      onSelectAssetCategory("ALL");
    } else {
      onSelectAssetCategory(cat);
    }
  };

  return (
    <div className="bento-card p-3 flex flex-col justify-between shrink-0">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-border pb-1.5 mb-1 shrink-0">
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-primary flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-accent" /> Asset Breakdown
        </h3>
        {selectedAssetCategory && selectedAssetCategory !== "ALL" ? (
          <button
            type="button"
            onClick={() => onSelectAssetCategory && onSelectAssetCategory("ALL")}
            className="text-[9px] font-mono font-bold text-accent bg-accent/15 hover:bg-accent/25 px-1.5 py-0.5 rounded border border-accent/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset filter to all portfolio assets"
          >
            <Filter className="w-2.5 h-2.5" />
            <span>Filtered ({selectedAssetCategory}) ✕</span>
          </button>
        ) : (
          <span className="text-[9px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
            4 Classes
          </span>
        )}
      </div>

      {/* SVG Donut Chart */}
      <div className="flex items-center justify-center my-1 shrink-0">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-surface2/60"
            />
            {/* Slices */}
            {slices.map(
              (s) =>
                s.pct > 0 && (
                  <circle
                    key={s.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={selectedAssetCategory === s.category ? "12" : "10"}
                    strokeDasharray={s.strokeDasharray}
                    strokeDashoffset={s.strokeDashoffset}
                    className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer"
                    onClick={() => handleCategoryClick(s.category)}
                  >
                    <title>{`${s.label}: ${s.pct.toFixed(1)}% (${formatZeny(s.value)} Z)`}</title>
                  </circle>
                )
            )}
          </svg>

          {/* Center Info Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] sm:text-[10px] font-bold font-mono text-primary leading-tight">
              {hoveredCategory
                ? `${hoveredPct.toFixed(0)}%`
                : selectedAssetCategory && selectedAssetCategory !== "ALL"
                ? selectedAssetCategory === "EQUITY"
                  ? `${muniPct.toFixed(0)}%`
                  : `${cryptoPct.toFixed(0)}%`
                : "4"}
            </span>
            <span className="text-[7px] sm:text-[7.5px] font-sans uppercase text-muted tracking-tight leading-tight">
              {hoveredCategory
                ? hoveredCategory
                : selectedAssetCategory && selectedAssetCategory !== "ALL"
                ? selectedAssetCategory
                : "Classes"}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Asset Breakdown List */}
      <div className="space-y-1 font-mono text-[10px]">
        {assets.map((a) => {
          const isSelected = selectedAssetCategory === a.category && a.category !== null;
          const isClickable = !!a.category;

          return (
            <div
              key={a.label}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => isClickable && handleCategoryClick(a.category)}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleCategoryClick(a.category);
                }
              }}
              onMouseEnter={() => {
                if (a.category) {
                  setHoveredCategory(a.category);
                  setHoveredPct(a.pct);
                }
              }}
              onMouseLeave={() => {
                setHoveredCategory(null);
                setHoveredPct(0);
              }}
              className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded border transition-all ${
                isSelected
                  ? `${a.activeClass} font-bold shadow-sm cursor-pointer`
                  : isClickable
                  ? "bg-surface2/30 hover:bg-surface2/70 border-border/40 hover:border-border/80 cursor-pointer"
                  : "bg-surface2/20 border-border/30"
              }`}
              title={
                isClickable
                  ? `Click to filter Investment Portfolio by ${a.label}`
                  : `${a.label}: ${formatZeny(a.value)} Z`
              }
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot} ${
                    isSelected ? "ring-2 ring-accent/50 scale-110" : ""
                  }`}
                />
                <span
                  className={`font-sans font-medium text-[9px] truncate ${
                    isSelected ? "text-primary font-bold" : "text-muted"
                  }`}
                >
                  {a.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-right">
                <span className={`font-bold ${a.textColor}`}>
                  {formatZeny(a.value)}
                </span>
                <span
                  className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border ${
                    isSelected
                      ? "bg-surface text-primary border-primary/40 font-bold"
                      : "text-muted bg-surface/80 border-border/30"
                  }`}
                >
                  {a.pct < 0.1 && a.pct > 0 ? "<0.1%" : `${a.pct.toFixed(a.pct >= 10 ? 0 : 1)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
