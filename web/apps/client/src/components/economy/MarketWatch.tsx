import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Zap, TrendingUp } from "lucide-react";
import { StockMarketQuote, StockEventLog } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { TickerDetailModal } from "./TickerDetailModal";

interface MarketWatchProps {
  quotes: StockMarketQuote[];
  marketMood?: number;
  marketDrift?: number;
  latestEvent?: StockEventLog | null;
  selectedTicker?: string | null;
  onSelectTicker?: (ticker: string | null) => void;
}

const getMoodString = (mood?: number) => {
  if (mood === 1) return { text: "Bullish", color: "text-success", bg: "bg-success/10", border: "border-success/20" };
  if (mood === 2) return { text: "Bearish", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20" };
  if (mood === 3) return { text: "Chaos", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" };
  return { text: "Neutral", color: "text-muted", bg: "bg-surface2", border: "border-border" };
};

export const MarketWatch: React.FC<MarketWatchProps> = ({
  quotes,
  marketMood,
  latestEvent,
  selectedTicker,
  onSelectTicker,
}) => {
  const moodInfo = getMoodString(marketMood);
  const [internalSelectedQuote, setInternalSelectedQuote] = useState<StockMarketQuote | null>(null);

  const activeQuote = selectedTicker
    ? quotes.find((q) => q.ticker === selectedTicker) || internalSelectedQuote
    : internalSelectedQuote;

  const handleSelectQuote = (q: StockMarketQuote | null) => {
    if (onSelectTicker) {
      onSelectTicker(q ? q.ticker : null);
    }
    setInternalSelectedQuote(q);
  };

  return (
    <div className="bento-card p-3 sm:p-3.5 flex flex-col min-h-0 h-full">
      {/* Terminal Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Midgard Stock Exchange
          </h3>
          <span className="text-[11px] text-muted hidden md:inline">
            | Live Municipal Order Book
          </span>
        </div>

        <span
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${moodInfo.bg} border ${moodInfo.border} ${moodInfo.color} text-[10px] sm:text-[11px] font-bold font-mono`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              moodInfo.text === "Bullish"
                ? "bg-success"
                : moodInfo.text === "Bearish"
                ? "bg-danger"
                : "bg-accent"
            } animate-pulse`}
          />
          Sentiment: {moodInfo.text}
        </span>
      </div>

      {/* Live Market Event Banner (if active) */}
      {latestEvent && (
        <div className="mb-2.5 p-2.5 rounded-lg bg-info/10 border border-info/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
            <div>
              <span className="text-xs font-bold text-info mr-1.5">
                [{latestEvent.eventName}]
              </span>
              <span className="text-[11px] text-primary/80 font-medium">
                {latestEvent.headline}
              </span>
            </div>
          </div>
          <span className="text-[9px] text-muted font-mono shrink-0">Active</span>
        </div>
      )}

      {/* Stock Exchange Full Table (Scrollable within container) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto pr-1">
        {quotes.length === 0 ? (
          <div className="text-center py-10 text-muted text-xs font-medium">
            Loading Midgard Stock Quotes...
          </div>
        ) : (
          <table className="w-full text-xs text-left min-w-[320px] sm:min-w-full">
            <thead className="text-[10px] text-muted uppercase tracking-wider border-b border-border sticky top-0 bg-surface z-10">
              <tr>
                <th className="pb-2 font-bold">Ticker & Company</th>
                <th className="pb-2 font-bold text-right">Price</th>
                <th className="pb-2 font-bold text-right">24h Change</th>
                <th className="pb-2 font-bold text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {quotes.map((q) => {
                const isUp = q.changeAmount >= 0;
                return (
                  <tr
                    key={q.ticker}
                    onClick={() => handleSelectQuote(q)}
                    className="hover:bg-surface2/60 cursor-pointer transition-colors group"
                    title="Click to view municipal lore, Black Swan news and threat intelligence"
                  >
                    <td className="py-2.5 font-sans">
                      <div className="font-bold text-primary text-xs flex items-center gap-1.5 group-hover:text-accent transition-colors">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            q.ticker === "PRT" || q.ticker === "PRON"
                              ? "bg-info"
                              : q.ticker === "GEF" || q.ticker === "GEFF"
                              ? "bg-danger"
                              : q.ticker === "MOR" || q.ticker === "MORR"
                              ? "bg-accent"
                              : q.ticker === "LHZ"
                              ? "bg-purple-400"
                              : q.ticker === "EIN"
                              ? "bg-amber-500"
                              : "bg-success"
                          }`}
                        />
                        <span>{q.ticker}</span>
                        <span className="text-[10px] text-muted font-normal truncate max-w-[90px] sm:max-w-none">
                          {q.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold text-primary">
                      {formatZeny(q.price)} Z
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold flex items-center justify-end gap-1 ${
                        isUp ? "text-success" : "text-danger"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{Math.abs(q.changePercent).toFixed(1)}%</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isUp
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {isUp ? "▲ Bullish" : "▼ Bearish"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Rich Black Swan News & Municipal Intel Modal */}
      <TickerDetailModal
        quote={activeQuote}
        onClose={() => handleSelectQuote(null)}
      />
    </div>
  );
};


