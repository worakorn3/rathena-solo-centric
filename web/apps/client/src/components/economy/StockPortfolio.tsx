import React from "react";
import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { StockHolding } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface StockPortfolioProps {
  holdings: StockHolding[];
}

export const StockPortfolio: React.FC<StockPortfolioProps> = ({ holdings }) => {
  const totalValue = holdings.reduce(
    (sum, h) => sum + h.currentPrice * h.shares,
    0
  );

  return (
    <div className="bento-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-info" /> Municipal Portfolio
          </h3>
          <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
            {holdings.length} {holdings.length === 1 ? "Position" : "Positions"}
          </span>
        </div>
        {holdings.length > 0 && (
          <div className="text-[11px] font-mono font-bold flex items-center gap-1.5">
            <span className="text-muted text-[10px]">Total Value:</span>
            <span className="text-primary">{formatZeny(totalValue)} Z</span>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {holdings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted text-xs">
            <Briefcase className="w-8 h-8 mb-2 opacity-40 text-muted" />
            <span className="font-bold text-primary/80">No active stock positions</span>
            <span className="text-[11px] text-muted/80 mt-1 max-w-xs">
              Visit Midgard Stock Exchange brokers in Prontera or major cities to purchase municipal equity shares.
            </span>
          </div>
        ) : (
          holdings.map((h) => {
            const pos = h.unrealizedPnL >= 0;
            const dotColor =
              h.ticker === "PRON" || h.ticker === "PRT"
                ? "bg-info"
                : h.ticker === "GEFF" || h.ticker === "GEF"
                ? "bg-danger"
                : h.ticker === "MORR" || h.ticker === "MOR"
                ? "bg-accent"
                : "bg-success";

            return (
              <div
                key={h.ticker}
                className="p-2.5 rounded-lg bg-surface2/30 border border-border hover:border-accent/40 hover:bg-surface2/50 transition-all flex justify-between items-center group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                    <span className="font-mono">{h.ticker}</span>
                    <span className="text-[10px] text-muted font-normal truncate hidden sm:inline">
                      {h.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{h.shares.toLocaleString()} shares</span>
                    <span>•</span>
                    <span>Avg {formatZeny(h.avgBuyPrice)} Z</span>
                    <span>•</span>
                    <span className="text-primary/70">
                      Now {formatZeny(h.currentPrice)} Z
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-bold font-mono flex items-center justify-end gap-1 ${
                      pos ? "text-success" : "text-danger"
                    }`}
                  >
                    {pos ? (
                      <TrendingUp className="w-3 h-3 inline" />
                    ) : (
                      <TrendingDown className="w-3 h-3 inline" />
                    )}
                    <span>
                      {pos ? "+" : ""}
                      {h.unrealizedPnLPercent.toFixed(1)}% ({pos ? "+" : ""}
                      {formatZeny(h.unrealizedPnL)} Z)
                    </span>
                  </div>
                  <div className="text-xs font-bold font-mono text-primary mt-0.5">
                    {formatZeny(h.currentPrice * h.shares)} Z
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
