import React, { useState } from "react";
import { formatZeny } from "../../lib/assets";
import { PieChart, Filter, Landmark, Coins, Wallet, ShieldCheck, TrendingUp, Layers } from "lucide-react";

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

  const liquidCombined = liquidZeny + bankTotal;
  const liquidCombinedPct = (liquidCombined / total) * 100;
  const marketCombined = mVal + cVal;
  const marketCombinedPct = (marketCombined / total) * 100;

  const assets = [
    {
      category: "EQUITY" as const,
      label: "Municipal Equities",
      sublabel: "Dividend stocks",
      value: mVal,
      pct: muniPct,
      color: "#34d399",
      dot: "bg-emerald-400",
      barColor: "bg-emerald-400",
      textColor: "text-emerald-400",
      activeClass: "border-emerald-400/50 bg-emerald-400/10",
      icon: Landmark,
      isFilterable: true,
    },
    {
      category: "CRYPTO" as const,
      label: "Crypto Protocols",
      sublabel: "Digital assets & runes",
      value: cVal,
      pct: cryptoPct,
      color: "#c084fc",
      dot: "bg-purple-400",
      barColor: "bg-purple-400",
      textColor: "text-purple-400",
      activeClass: "border-purple-400/50 bg-purple-400/10",
      icon: Coins,
      isFilterable: true,
    },
    {
      category: null,
      label: "Bank Vault Principal",
      sublabel: "Fixed 1%/d yield vault",
      value: bankTotal,
      pct: bankPct,
      color: "#60a5fa",
      dot: "bg-blue-400",
      barColor: "bg-blue-400",
      textColor: "text-blue-400",
      activeClass: "border-blue-400/50 bg-blue-400/10",
      icon: ShieldCheck,
      isFilterable: false,
    },
    {
      category: null,
      label: "Liquid Wallet Cash",
      sublabel: "In-game character liquid zeny",
      value: liquidZeny,
      pct: liquidPct,
      color: "#fbbf24",
      dot: "bg-amber-400",
      barColor: "bg-amber-400",
      textColor: "text-amber-400",
      activeClass: "border-amber-400/50 bg-amber-400/10",
      icon: Wallet,
      isFilterable: false,
    },
  ];

  // SVG Donut Math (High precision)
  const radius = 38;
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
    <div className="bento-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col justify-between overflow-hidden border border-border/80">
      {/* 1. Header */}
      <div className="w-full flex items-center justify-between border-b border-border pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <PieChart className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary">
              Asset Allocation
            </h3>
            <span className="text-[10px] text-muted">Capital Distribution Breakdown</span>
          </div>
        </div>

        {selectedAssetCategory && selectedAssetCategory !== "ALL" ? (
          <button
            type="button"
            onClick={() => onSelectAssetCategory && onSelectAssetCategory("ALL")}
            className="text-[10px] font-mono font-bold text-accent bg-accent/15 hover:bg-accent/25 px-2 py-0.5 rounded border border-accent/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset filter to all portfolio assets"
          >
            <Filter className="w-3 h-3" />
            <span>Filtered ({selectedAssetCategory}) ✕</span>
          </button>
        ) : (
          <span className="text-[10px] font-mono text-muted bg-surface2 px-2 py-0.5 rounded border border-border">
            4 Asset Classes
          </span>
        )}
      </div>

      {/* 2. Expansive Interactive Donut Section */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="11"
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
                    strokeWidth={selectedAssetCategory === s.category ? "14" : "11"}
                    strokeDasharray={s.strokeDasharray}
                    strokeDashoffset={s.strokeDashoffset}
                    className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer"
                    onClick={() => s.isFilterable && handleCategoryClick(s.category)}
                    onMouseEnter={() => {
                      setHoveredCategory(s.label);
                      setHoveredPct(s.pct);
                    }}
                    onMouseLeave={() => {
                      setHoveredCategory(null);
                      setHoveredPct(0);
                    }}
                  >
                    <title>{`${s.label}: ${s.pct.toFixed(1)}% (${formatZeny(s.value)} Z)`}</title>
                  </circle>
                )
            )}
          </svg>

          {/* Center Info Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <span className="text-sm sm:text-base font-black font-mono text-primary leading-none">
              {hoveredCategory
                ? `${hoveredPct.toFixed(1)}%`
                : selectedAssetCategory && selectedAssetCategory !== "ALL"
                ? selectedAssetCategory === "EQUITY"
                  ? `${muniPct.toFixed(1)}%`
                  : `${cryptoPct.toFixed(1)}%`
                : "100%"}
            </span>
            <span className="text-[8px] font-sans uppercase font-bold text-muted tracking-wider leading-tight mt-0.5 truncate max-w-[80px]">
              {hoveredCategory
                ? hoveredCategory
                : selectedAssetCategory && selectedAssetCategory !== "ALL"
                ? selectedAssetCategory
                : "Total Assets"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. High-Density Asset Class Bento Cards */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {assets.map((a) => {
          const isSelected = selectedAssetCategory === a.category && a.category !== null;
          const isClickable = a.isFilterable;
          const IconComponent = a.icon;

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
                setHoveredCategory(a.label);
                setHoveredPct(a.pct);
              }}
              onMouseLeave={() => {
                setHoveredCategory(null);
                setHoveredPct(0);
              }}
              className={`p-2 rounded-xl border transition-all ${
                isSelected
                  ? `${a.activeClass} font-bold shadow-sm ring-1 ring-accent/40 cursor-pointer`
                  : isClickable
                  ? "bg-surface2/30 hover:bg-surface2/60 border-border/50 hover:border-border cursor-pointer"
                  : "bg-surface2/20 border-border/30"
              }`}
              title={
                isClickable
                  ? `Click to filter Investment Portfolio by ${a.label}`
                  : `${a.label}: ${formatZeny(a.value)} Z`
              }
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${a.dot}/20`}>
                    <IconComponent className={`w-3 h-3 ${a.textColor}`} />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-[11px] text-primary truncate leading-tight">
                      {a.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono">
                  <span className={`font-bold text-xs ${a.textColor}`}>
                    {formatZeny(a.value)} Z
                  </span>
                  <span className="text-[9px] font-bold text-muted bg-surface px-1.5 py-0.5 rounded border border-border/50">
                    {a.pct < 0.1 && a.pct > 0 ? "<0.1%" : `${a.pct.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Progress Distribution Bar */}
              <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${a.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, a.pct))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Macro Exposure & Risk Distribution Bar */}
      <div className="pt-2 mt-1.5 border-t border-border/60 shrink-0 space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-info" /> Liquid & Safe: <strong className="text-primary">{liquidCombinedPct.toFixed(0)}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-accent" /> Market Exposure: <strong className="text-primary">{marketCombinedPct.toFixed(0)}%</strong>
          </span>
        </div>
        <div className="w-full bg-surface2 rounded-full h-1.5 flex overflow-hidden">
          <div
            className="bg-info h-1.5 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, liquidCombinedPct))}%` }}
            title={`Liquid Assets: ${formatZeny(liquidCombined)} Z (${liquidCombinedPct.toFixed(1)}%)`}
          />
          <div
            className="bg-accent h-1.5 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, marketCombinedPct))}%` }}
            title={`Market Investments: ${formatZeny(marketCombined)} Z (${marketCombinedPct.toFixed(1)}%)`}
          />
        </div>
      </div>
    </div>
  );
};
