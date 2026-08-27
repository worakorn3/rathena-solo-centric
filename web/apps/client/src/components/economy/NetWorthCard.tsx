import React from "react";
import { NetWorthSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { Coins, TrendingUp, TrendingDown, Minus, Briefcase } from "lucide-react";

interface NetWorthCardProps {
  summary: NetWorthSummary;
  onSelectTab?: (tab: "HOLDINGS" | "BANK" | "BREAKDOWN" | "HISTORY") => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary, onSelectTab }) => {
  const {
    totalNetWorth,
    holdings = [],
  } = summary;

  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  const stockUnrealizedPnL =
    summary.stockUnrealizedPnL !== undefined
      ? summary.stockUnrealizedPnL
      : safeHoldings.reduce((sum, h) => sum + (h.unrealizedPnL || 0), 0);

  const stockTotalCost =
    summary.stockTotalCost !== undefined
      ? summary.stockTotalCost
      : safeHoldings.reduce((sum, h) => sum + (h.totalCost || 0), 0);

  const stockUnrealizedPnLPercent =
    summary.stockUnrealizedPnLPercent !== undefined
      ? summary.stockUnrealizedPnLPercent
      : stockTotalCost > 0
      ? Number(((stockUnrealizedPnL / stockTotalCost) * 100).toFixed(2))
      : 0;

  const isPositive = stockUnrealizedPnL > 0;
  const isNegative = stockUnrealizedPnL < 0;

  return (
    <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden">
      {/* Left: North Star Hero Metric with Option B Inline Total P/L */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Total Global Net Worth
            </span>
            {safeHoldings.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all ${
                  isPositive
                    ? "bg-success/15 border-success/30 text-success"
                    : isNegative
                    ? "bg-danger/15 border-danger/30 text-danger"
                    : "bg-surface2 border-border text-muted"
                }`}
                title={`Portfolio Unrealized Return: ${isPositive ? "+" : ""}${formatZeny(stockUnrealizedPnL)} Z (${isPositive ? "+" : ""}${stockUnrealizedPnLPercent.toFixed(2)}%)`}
              >
                {isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : isNegative ? (
                  <TrendingDown className="w-2.5 h-2.5" />
                ) : (
                  <Minus className="w-2.5 h-2.5" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {stockUnrealizedPnLPercent.toFixed(1)}% P/L
                </span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5 mt-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-primary flex items-baseline gap-1">
              <span>{formatZeny(totalNetWorth)}</span>
              <span className="text-accent text-xs font-sans font-bold">Zeny</span>
            </div>
            {safeHoldings.length > 0 && (
              <div
                className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-1 ${
                  isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted"
                }`}
              >
                <span>
                  ({isPositive ? "+" : ""}
                  {formatZeny(stockUnrealizedPnL)} Z)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Key High-Level Macro Summary */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0 shrink-0 text-[10px] font-mono">
        {/* Positions Counter */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("HOLDINGS")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2/40 hover:bg-surface2/80 border border-border/60 hover:border-info/50 transition-all cursor-pointer text-left"
          title="View Active Positions"
        >
          <Briefcase className="w-3.5 h-3.5 text-info shrink-0" />
          <div>
            <div className="text-[8px] text-muted font-bold uppercase font-sans">
              Positions
            </div>
            <div className="font-bold text-primary text-[11px]">
              {safeHoldings.length} {safeHoldings.length === 1 ? "Asset" : "Assets"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
