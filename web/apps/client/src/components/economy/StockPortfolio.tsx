import React from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, DollarSign, Building } from "lucide-react";
import { StockHolding } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface StockPortfolioProps {
  holdings: StockHolding[];
}

export const StockPortfolio: React.FC<StockPortfolioProps> = ({ holdings }) => {
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalMarketVal = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalPnL = totalMarketVal - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isPositive = totalPnL >= 0;

  return (
    <div className="ro-window flex flex-col h-full">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Midgard Stock Exchange Portfolio
          </span>
        </div>
        <span className="text-[10px] text-emerald-300 font-mono">
          {holdings.length} Position{holdings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="p-3.5 space-y-3 bg-[#1a2332]/90 flex-1 flex flex-col">
        {/* Portfolio Summary Header */}
        <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-ro-borderLight/20">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Invested</div>
            <div className="text-sm font-bold font-mono text-slate-200">
              {formatZeny(totalCost)} <span className="text-[10px] font-sans">Z</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Valuation</div>
            <div className="text-sm font-bold font-mono text-emerald-300">
              {formatZeny(totalMarketVal)} <span className="text-[10px] font-sans">Z</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Unrealized P&L</div>
            <div
              className={`text-sm font-bold font-mono flex items-center justify-end ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {isPositive ? "+" : ""}
              {formatZeny(totalPnL)} Z ({isPositive ? "+" : ""}
              {totalPnLPct.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Holdings List / Table */}
        {holdings.length === 0 ? (
          <div className="ro-inset p-6 text-center text-slate-400 space-y-2 my-auto">
            <Building size={28} className="mx-auto text-slate-500" />
            <div className="text-xs font-semibold text-slate-300">No Active Stock Positions</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Visit the Midgard Stock Exchange brokers in major cities to invest in municipal corporate shares.
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {holdings.map((h) => {
              const pos = h.unrealizedPnL >= 0;
              return (
                <div
                  key={h.ticker}
                  className="ro-inset p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-ro-gold/40 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded bg-[#101722] border border-ro-gold/40 flex items-center justify-center font-cinzel font-black text-xs text-ro-gold">
                      {h.ticker}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        {h.name}
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          ({h.shares.toLocaleString()} shares)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Avg: {formatZeny(h.avgBuyPrice)} Z | Current: {formatZeny(h.currentPrice)} Z
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-1 sm:pt-0 border-ro-borderLight/10">
                    <div className="text-xs font-bold font-mono text-slate-100">
                      {formatZeny(h.marketValue)} <span className="text-[10px] text-slate-400 font-sans">Z</span>
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                        pos ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      <span>
                        {pos ? "+" : ""}
                        {formatZeny(h.unrealizedPnL)} Z ({pos ? "+" : ""}
                        {h.unrealizedPnLPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
