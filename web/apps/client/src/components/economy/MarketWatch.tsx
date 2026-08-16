import React from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";
import { StockMarketQuote } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface MarketWatchProps {
  quotes: StockMarketQuote[];
}

export const MarketWatch: React.FC<MarketWatchProps> = ({ quotes }) => {
  return (
    <div className="ro-window flex flex-col h-full">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-amber-400" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Market Board & Ticker Watch
          </span>
        </div>
        <span className="text-[10px] text-amber-200/70 font-mono">Real-Time Quotes</span>
      </div>

      <div className="p-3 bg-[#1a2332]/90 flex-1 space-y-2 overflow-y-auto max-h-[300px]">
        {quotes.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No active municipal stock listings currently found.
          </div>
        ) : (
          quotes.map((q) => {
            const isUp = q.changeAmount >= 0;
            return (
              <div
                key={q.ticker}
                className="ro-inset p-2.5 flex items-center justify-between hover:border-amber-400/40 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-[#101722] border border-ro-borderLight/30 flex items-center justify-center font-cinzel font-bold text-xs text-slate-200">
                    {q.ticker}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{q.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Div: {q.dividend} Z / tick</span>
                      {q.splitCount > 0 && (
                        <span className="text-amber-400 font-mono">
                          • {q.splitCount}x Splits
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-100">
                    {formatZeny(q.price)} <span className="text-[10px] text-slate-400 font-sans">Z</span>
                  </div>
                  <div
                    className={`text-[10px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    <span>
                      {isUp ? "+" : ""}
                      {formatZeny(q.changeAmount)} Z ({isUp ? "+" : ""}
                      {q.changePercent.toFixed(1)}%)
                    </span>
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
