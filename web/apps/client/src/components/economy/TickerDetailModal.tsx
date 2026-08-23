import React, { useState, useEffect } from "react";
import {
  X,
  Landmark,
  MapPin,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Swords,
  Globe,
  Newspaper,
  Clock,
  Coins,
  Loader2,
} from "lucide-react";
import {
  StockMarketQuote,
  TickerNewsResponse,
  MUNICIPAL_LORE,
} from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";
import { CandlestickChart } from "./CandlestickChart";

interface TickerDetailModalProps {
  quote: StockMarketQuote | null;
  onClose: () => void;
}

const getCategoryBadge = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes("BOOM")) {
    return {
      label: "Municipal Boom",
      color: "text-success",
      bg: "bg-success/15",
      border: "border-success/30",
      icon: TrendingUp,
    };
  }
  if (cat.includes("CRISIS")) {
    return {
      label: "Municipal Crisis",
      color: "text-danger",
      bg: "bg-danger/15",
      border: "border-danger/30",
      icon: TrendingDown,
    };
  }
  if (cat.includes("TRADE_WAR") || cat.includes("WAR")) {
    return {
      label: "Trade War",
      color: "text-accent",
      bg: "bg-accent/15",
      border: "border-accent/30",
      icon: Swords,
    };
  }
  return {
    label: cat.replace(/_/g, " "),
    color: "text-info",
    bg: "bg-info/15",
    border: "border-info/30",
    icon: Globe,
  };
};

export const TickerDetailModal: React.FC<TickerDetailModalProps> = ({
  quote,
  onClose,
}) => {
  const [newsData, setNewsData] = useState<TickerNewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch real-time active and historical triggered Black Swan news when quote changes
  useEffect(() => {
    if (!quote) {
      setNewsData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api
      .get<TickerNewsResponse>(`/api/economy/events/ticker/${quote.ticker}`)
      .then((res) => {
        if (isMounted && res.success) {
          setNewsData(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load ticker news:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [quote]);

  if (!quote) return null;

  const profile = MUNICIPAL_LORE[quote.ticker];
  const activeEvents = newsData?.activeEvents || [];
  const historicalEvents = newsData?.historicalEvents || [];
  const hasLiveOrHistoricalNews = activeEvents.length > 0 || historicalEvents.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Title Bar */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-primary truncate flex items-center gap-2">
                <span className="font-mono text-accent">{quote.ticker}</span>
                <span>·</span>
                <span className="truncate">{quote.name}</span>
              </div>
              {profile?.cityName && (
                <div className="text-[11px] text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted/80" /> {profile.cityName}{" "}
                  <span className="text-muted/60">({profile.region})</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface shrink-0 cursor-pointer"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-surface text-xs sm:text-sm">
          {/* Fundamentals Metric Strip */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-surface2/60 border border-border/70">
              <div className="text-[10px] text-muted uppercase tracking-wider">
                Price
              </div>
              <div className="font-bold text-primary mt-0.5 text-xs sm:text-sm">
                {formatZeny(quote.price)} Z
              </div>
            </div>
            <div className="p-2 rounded bg-surface2/60 border border-border/70">
              <div className="text-[10px] text-muted uppercase tracking-wider">
                Dividend
              </div>
              <div className="font-bold text-success mt-0.5 text-xs sm:text-sm">
                {quote.dividend > 0 ? `${quote.dividend} Z` : "0 Z"}
              </div>
            </div>
            <div className="p-2 rounded bg-surface2/60 border border-border/70">
              <div className="text-[10px] text-muted uppercase tracking-wider">
                24h Change
              </div>
              <div
                className={`font-bold mt-0.5 text-xs sm:text-sm ${
                  quote.changeAmount >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {quote.changeAmount >= 0 ? "+" : ""}
                {quote.changePercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Interactive TradingView Candlestick Chart */}
          <CandlestickChart ticker={quote.ticker} />

          {/* Sector & Classification Badges */}
          <div className="flex flex-wrap gap-1.5">
            {quote.sector && (
              <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[11px] font-semibold text-primary/90">
                {quote.sector}
              </span>
            )}
            {quote.archetype && (
              <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[11px] font-semibold text-accent">
                {quote.archetype}
              </span>
            )}
            {profile?.specialty && (
              <span className="px-2 py-0.5 rounded bg-info/10 border border-info/20 text-[11px] font-medium text-info">
                {profile.specialty}
              </span>
            )}
            {quote.splitCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[11px] font-mono text-muted">
                {quote.splitCount}x Split
              </span>
            )}
          </div>

          {/* Municipal Background & Lore */}
          <div className="p-3.5 rounded-lg bg-surface2/50 border border-border/60 text-muted leading-relaxed font-sans text-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Municipal Profile & Heritage
            </div>
            <p className="text-primary/90">
              {quote.lore ||
                profile?.lore ||
                "Municipal enterprise operating under royal trade jurisdiction with registered securities trading on the Midgard Stock Exchange."}
            </p>
          </div>

          {/* Real-time Active Market Disruptions (Live Event Ongoing) */}
          {activeEvents.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-pulse" /> Active Real-Time Market Disruption
              </div>
              {activeEvents.map((ev) => {
                const badge = getCategoryBadge(ev.eventId);
                const IconComponent = badge.icon;
                return (
                  <div
                    key={`active-${ev.id}`}
                    className="p-3 rounded-lg bg-accent/10 border border-accent/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-xs font-bold text-accent">
                        <IconComponent className="w-3.5 h-3.5" />
                        {ev.eventId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent/20 text-accent font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        {ev.remainingShifts} shifts remaining
                      </span>
                    </div>
                    <div className="font-semibold text-primary text-xs leading-snug">
                      {ev.headline}
                    </div>
                    {ev.taxRateOverride >= 0 && (
                      <div className="text-[10px] font-mono text-muted">
                        Tax Rate Override: {ev.taxRateOverride}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Real Historical News Dispatches (Events that Actually Happened) */}
          {historicalEvents.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-accent" />
                  Midgard Gazette Dispatches
                </span>
                <span className="text-[10px] font-normal">
                  {historicalEvents.length} recorded
                </span>
              </div>

              <div className="space-y-2">
                {historicalEvents.map((log) => {
                  const badge = getCategoryBadge(log.category);
                  const IconComponent = badge.icon;
                  const dateStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Archived Dispatch";

                  return (
                    <div
                      key={`log-${log.logId}`}
                      className="p-3 rounded-lg bg-surface2/50 border border-border/70 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 ${badge.bg} ${badge.color} ${badge.border}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {log.eventName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted">
                          {dateStr}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-primary leading-snug">
                        {log.headline}
                      </div>

                      {log.details && (
                        <p className="text-[11px] text-muted leading-relaxed font-sans pt-0.5">
                          {log.details}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-muted/70 pt-1 border-t border-border/40">
                        <span>Target: {log.tickerTarget}</span>
                        <span>Source: {log.triggeredBy}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading Indicator for news */}
          {isLoading && (
            <div className="flex items-center justify-center py-2 gap-2 text-muted font-mono text-[11px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
              <span>Checking live Gazette dispatches...</span>
            </div>
          )}

          {/* Trade Guidance Notice */}
          <div className="p-3 rounded-lg bg-surface2/30 border border-border/40 text-[11px] text-muted font-sans flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent shrink-0" />
            <span>
              Physical shares trading is available via registered Stock Brokers in Prontera and municipal halls.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-surface2 border-t border-border px-4 py-2.5 flex items-center justify-between text-[11px] text-muted font-mono shrink-0">
          <span>MSE Regulatory Bureau • Midgard Gazette</span>
          <span className="text-primary/70">Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
