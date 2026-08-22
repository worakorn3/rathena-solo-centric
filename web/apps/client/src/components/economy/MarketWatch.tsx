import React, { useState, useEffect } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Zap, TrendingUp, Info, X, Landmark, Coins, ShieldCheck, MapPin } from "lucide-react";
import { StockMarketQuote, StockEventLog, MUNICIPAL_LORE } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface MarketWatchProps {
  quotes: StockMarketQuote[];
  marketMood?: number;
  marketDrift?: number;
  latestEvent?: StockEventLog | null;
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
}) => {
  const moodInfo = getMoodString(marketMood);
  // ponytail: Lightweight inspection state replaces heavy third-party popover/floating UI libraries
  const [selectedQuote, setSelectedQuote] = useState<StockMarketQuote | null>(null);

  // ponytail: Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedQuote(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedProfile = selectedQuote ? MUNICIPAL_LORE[selectedQuote.ticker] : null;

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
                    onClick={() => setSelectedQuote(q)}
                    className="hover:bg-surface2/60 cursor-pointer transition-colors group"
                    title="Click to view municipal lore and enterprise details"
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

      {/* ponytail: Zero-bloat Municipal Lore & Detail Modal */}
      {selectedQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedQuote(null)}
        >
          <div
            className="bento-card w-full max-w-md p-0 overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title Bar */}
            <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Landmark className="w-4 h-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-primary truncate">
                    {selectedQuote.ticker} · {selectedQuote.name}
                  </div>
                  {selectedProfile?.cityName && (
                    <div className="text-[10px] text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedProfile.cityName} ({selectedProfile.region})
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-surface text-xs sm:text-sm">
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {selectedQuote.sector && (
                  <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[11px] font-semibold text-primary/90">
                    {selectedQuote.sector}
                  </span>
                )}
                {selectedQuote.archetype && (
                  <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[11px] font-semibold text-accent">
                    {selectedQuote.archetype}
                  </span>
                )}
                {selectedProfile?.specialty && (
                  <span className="px-2 py-0.5 rounded bg-info/10 border border-info/20 text-[11px] font-medium text-info">
                    {selectedProfile.specialty}
                  </span>
                )}
              </div>

              {/* Lore & Storytelling Section */}
              <div className="p-3.5 rounded-lg bg-surface2/50 border border-border/60 text-muted leading-relaxed font-sans text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Municipal Background & Lore
                </div>
                <p className="text-primary/90">
                  {selectedQuote.lore || selectedProfile?.lore || "Municipal enterprise operating under royal trade jurisdiction."}
                </p>
              </div>

              {/* Financial Fundamentals Summary Grid */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 rounded bg-surface2 border border-border">
                  <div className="text-[10px] text-muted uppercase">Share Price</div>
                  <div className="font-bold text-primary mt-0.5 text-xs sm:text-sm">
                    {formatZeny(selectedQuote.price)} Z
                  </div>
                </div>
                <div className="p-2.5 rounded bg-surface2 border border-border">
                  <div className="text-[10px] text-muted uppercase">Dividend</div>
                  <div className="font-bold text-success mt-0.5 text-xs sm:text-sm">
                    {selectedQuote.dividend > 0 ? `${selectedQuote.dividend} Z` : "0 Z"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-surface2 border border-border">
                  <div className="text-[10px] text-muted uppercase">Splits</div>
                  <div className="font-bold text-primary mt-0.5 text-xs sm:text-sm">
                    {selectedQuote.splitCount > 0 ? `${selectedQuote.splitCount}x` : "None"}
                  </div>
                </div>
              </div>

              {/* Trade Guidance Footer */}
              <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/50">
                <span>Brokers active in Prontera & major cities</span>
                <span className="font-mono text-[10px] text-primary/70">MSE Term v24.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

