import React, { useState } from "react";
import { formatZeny } from "../../lib/assets";
import { PieChart } from "lucide-react";

interface AssetAllocationPieProps {
  liquidZeny: number;
  bankTotal: number;
  stockMarketValue: number;
  totalNetWorth: number;
}

export const AssetAllocationPie: React.FC<AssetAllocationPieProps> = ({
  liquidZeny,
  bankTotal,
  stockMarketValue,
  totalNetWorth,
}) => {
  const total = Math.max(1, totalNetWorth);
  const liquidPct = (liquidZeny / total) * 100;
  const bankPct = (bankTotal / total) * 100;
  const stockPct = (stockMarketValue / total) * 100;

  const [hoveredSlice, setHoveredSlice] = useState<{
    name: string;
    value: number;
    pct: number;
    color: string;
  } | null>(null);

  // SVG Donut Math: Radius = 38, Circumference = 2 * PI * 38 ≈ 238.761
  const circumference = 238.761;
  const cashStroke = (liquidPct / 100) * circumference;
  const bankStroke = (bankPct / 100) * circumference;
  const stockStroke = (stockPct / 100) * circumference;

  const cashOffset = 0;
  const bankOffset = -cashStroke;
  const stockOffset = -(cashStroke + bankStroke);

  return (
    <div className="bento-card p-3 flex flex-col justify-between shrink-0">
      <div className="w-full flex items-center justify-between border-b border-border pb-1.5 mb-1.5 shrink-0">
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-primary flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-accent" /> Asset Allocation
        </h3>
        <span className="text-[9px] font-mono text-muted bg-surface2 px-1 py-0.5 rounded border border-border">
          Donut
        </span>
      </div>

      {/* Main Graphic & Legend Row */}
      <div className="w-full flex items-center gap-2.5 my-auto">
        {/* SVG Donut Graphic */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Base Circle */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#27272a"
              strokeWidth="14"
            />

            {/* Slice 1: Liquid Cash (Amber) */}
            {cashStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="14"
                strokeDasharray={`${cashStroke} ${circumference}`}
                strokeDashoffset={cashOffset}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() =>
                  setHoveredSlice({
                    name: "Cash",
                    value: liquidZeny,
                    pct: liquidPct,
                    color: "#fbbf24",
                  })
                }
                onMouseLeave={() => setHoveredSlice(null)}
              />
            )}

            {/* Slice 2: Bank Vault (Blue) */}
            {bankStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="14"
                strokeDasharray={`${bankStroke} ${circumference}`}
                strokeDashoffset={bankOffset}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() =>
                  setHoveredSlice({
                    name: "Bank",
                    value: bankTotal,
                    pct: bankPct,
                    color: "#60a5fa",
                  })
                }
                onMouseLeave={() => setHoveredSlice(null)}
              />
            )}

            {/* Slice 3: Stocks (Green) */}
            {stockStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#4ade80"
                strokeWidth="14"
                strokeDasharray={`${stockStroke} ${circumference}`}
                strokeDashoffset={stockOffset}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() =>
                  setHoveredSlice({
                    name: "Stocks",
                    value: stockMarketValue,
                    pct: stockPct,
                    color: "#4ade80",
                  })
                }
                onMouseLeave={() => setHoveredSlice(null)}
              />
            )}
          </svg>

          {/* Center Cutout Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <span
              className="text-[8px] uppercase font-bold tracking-wider truncate max-w-[55px]"
              style={{ color: hoveredSlice ? hoveredSlice.color : "#a1a1aa" }}
            >
              {hoveredSlice ? hoveredSlice.name : "Total"}
            </span>
            <span className="text-[10px] font-black font-mono text-primary leading-tight">
              {hoveredSlice
                ? `${hoveredSlice.pct.toFixed(0)}%`
                : formatZeny(totalNetWorth)}
            </span>
          </div>
        </div>

        {/* Compact Vertical 3-Way Asset Breakdown */}
        <div className="flex-1 min-w-0 space-y-1 font-mono text-[10px]">
          <div
            onMouseEnter={() =>
              setHoveredSlice({
                name: "Cash",
                value: liquidZeny,
                pct: liquidPct,
                color: "#fbbf24",
              })
            }
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between p-1 rounded bg-surface2/30 hover:bg-surface2/70 border border-border/50 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1 text-[9px] text-muted font-sans font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" /> Cash
            </span>
            <span className="font-bold text-primary truncate">
              {formatZeny(liquidZeny)}
            </span>
          </div>

          <div
            onMouseEnter={() =>
              setHoveredSlice({
                name: "Bank",
                value: bankTotal,
                pct: bankPct,
                color: "#60a5fa",
              })
            }
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between p-1 rounded bg-surface2/30 hover:bg-surface2/70 border border-border/50 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1 text-[9px] text-muted font-sans font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" /> Bank
            </span>
            <span className="font-bold text-primary truncate">
              {formatZeny(bankTotal)}
            </span>
          </div>

          <div
            onMouseEnter={() =>
              setHoveredSlice({
                name: "Stocks",
                value: stockMarketValue,
                pct: stockPct,
                color: "#4ade80",
              })
            }
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between p-1 rounded bg-surface2/30 hover:bg-surface2/70 border border-border/50 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1 text-[9px] text-muted font-sans font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" /> Stocks
            </span>
            <span className="font-bold text-success truncate">
              {formatZeny(stockMarketValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
