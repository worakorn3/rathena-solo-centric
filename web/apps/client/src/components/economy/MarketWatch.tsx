import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Zap, TrendingUp, Landmark, LineChart, ShieldCheck } from "lucide-react";
import { StockMarketQuote, StockIndex, StockEventLog, getAssetVocabulary, isCryptoAsset } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { getTickerTheme } from "../../lib/tickerTheme";
import { TickerDetailModal } from "./TickerDetailModal";
import { ErrorBoundary } from "../common/ErrorBoundary";

export type MarketFilterTab =
  | "INDICES"
  | "ALL"
  | "EQUITY"
  | "CRYPTO"
  | "ETF"
  | "indices"
  | "all"
  | "municipal"
  | "crypto"
  | "etf";

interface MarketWatchProps {
  quotes: StockMarketQuote[];
  indices?: StockIndex[];
  marketMood?: number;
  marketDrift?: number;
  equitiesMood?: number;
  equitiesDrift?: number;
  cryptoMood?: number;
  cryptoDrift?: number;
  latestEvent?: StockEventLog | null;
  selectedTicker?: string | null;
  selectedIndexId?: string | null;
  onSelectTicker?: (ticker: string | null) => void;
  onSelectIndex?: (indexId: string | null) => void;
  onTradeSuccess?: () => void;
  filterTab?: MarketFilterTab;
  onFilterChange?: (tab: "INDICES" | "ALL" | "EQUITY" | "CRYPTO") => void;
}

const getMoodString = (mood?: number) => {
  if (mood === 1) return { text: "Bullish", color: "text-success", bg: "bg-success/10", border: "border-success/20" };
  if (mood === 2) return { text: "Bearish", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20" };
  if (mood === 3) return { text: "Chaos", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" };
  return { text: "Neutral", color: "text-muted", bg: "bg-surface2", border: "border-border" };
};

export const MarketWatch: React.FC<MarketWatchProps> = ({
  quotes = [],
  indices = [],
  marketMood,
  equitiesMood,
  cryptoMood,
  latestEvent,
  selectedTicker,
  selectedIndexId,
  onSelectTicker,
  onSelectIndex,
  onTradeSuccess,
  filterTab: controlledFilterTab,
  onFilterChange,
}) => {
  const safeQuotes = Array.isArray(quotes) ? quotes : [];
  const safeIndices = Array.isArray(indices) ? indices : [];

  // Derive effective municipal sentiment
  const muniQuotes = safeQuotes.filter((q) => !isCryptoAsset(q.ticker, q.assetType || q.sector));
  const muniUp = muniQuotes.filter((q) => q.changeAmount > 0).length;
  const muniDown = muniQuotes.filter((q) => q.changeAmount < 0).length;
  const fallbackMuniMood = muniQuotes.length > 0 ? (muniUp > muniDown ? 1 : muniDown > muniUp ? 2 : 0) : 0;
  const effectiveEquitiesMood =
    equitiesMood && equitiesMood > 0
      ? equitiesMood
      : marketMood && marketMood > 0
      ? marketMood
      : fallbackMuniMood;

  // Derive effective crypto sentiment
  const cryptoQuotes = safeQuotes.filter((q) => isCryptoAsset(q.ticker, q.assetType || q.sector));
  const cryptoUp = cryptoQuotes.filter((q) => q.changeAmount > 0).length;
  const cryptoDown = cryptoQuotes.filter((q) => q.changeAmount < 0).length;
  const fallbackCryptoMood = cryptoQuotes.length > 0 ? (cryptoUp > cryptoDown ? 1 : cryptoDown > cryptoUp ? 2 : 0) : 0;
  const effectiveCryptoMood =
    cryptoMood && cryptoMood > 0
      ? cryptoMood
      : marketMood === 3
      ? 3
      : fallbackCryptoMood;

  const equitiesMoodInfo = getMoodString(effectiveEquitiesMood);
  const cryptoMoodInfo = getMoodString(effectiveCryptoMood);

  const [internalSelectedQuote, setInternalSelectedQuote] = useState<StockMarketQuote | null>(null);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<StockIndex | null>(null);
  const [internalFilterTab, setInternalFilterTab] = useState<"INDICES" | "ALL" | "EQUITY" | "CRYPTO" | "ETF">("ALL");

  // Normalize external tab strings
  const normalizeTab = (t?: string): "INDICES" | "ALL" | "EQUITY" | "CRYPTO" | "ETF" => {
    if (!t) return "ALL";
    const upper = t.toUpperCase();
    if (upper === "INDICES") return "INDICES";
    if (upper === "ETF") return "ETF";
    if (upper === "MUNICIPAL" || upper === "EQUITY") return "EQUITY";
    if (upper === "CRYPTO") return "CRYPTO";
    return "ALL";
  };

  const activeFilterTab: "INDICES" | "ALL" | "EQUITY" | "CRYPTO" | "ETF" =
    controlledFilterTab !== undefined ? normalizeTab(controlledFilterTab) : internalFilterTab;

  const handleFilterChange = (tab: "INDICES" | "ALL" | "EQUITY" | "CRYPTO" | "ETF") => {
    if (onFilterChange) {
      onFilterChange(tab);
    } else {
      setInternalFilterTab(tab);
    }
  };

  const activeQuote = selectedTicker
    ? safeQuotes.find((q) => q.ticker === selectedTicker) || internalSelectedQuote
    : internalSelectedQuote
    ? safeQuotes.find((q) => q.ticker === internalSelectedQuote.ticker) || internalSelectedQuote
    : null;

  const activeIndex = selectedIndexId
    ? safeIndices.find((idx) => idx.indexId === selectedIndexId) || internalSelectedIndex
    : internalSelectedIndex
    ? safeIndices.find((idx) => idx.indexId === internalSelectedIndex.indexId) || internalSelectedIndex
    : null;

  const handleSelectQuote = (q: StockMarketQuote | null) => {
    if (onSelectTicker) {
      onSelectTicker(q ? q.ticker : null);
    }
    setInternalSelectedQuote(q);
    setInternalSelectedIndex(null);
  };

  const handleSelectIndex = (idx: StockIndex | null) => {
    if (onSelectIndex) {
      onSelectIndex(idx ? idx.indexId : null);
    }
    setInternalSelectedIndex(idx);
    setInternalSelectedQuote(null);
  };

  // Only show tradable stocks in the live order book (exclude NON_TRADABLE sovereign ETFs and TRACKED_ONLY unlisted stocks)
  const tradableQuotes = safeQuotes.filter(
    (q) => !q.tradeStatus || q.tradeStatus === "TRADABLE"
  );

  const etfCount = tradableQuotes.filter((q) => q.assetType === "ETF").length;
  const cryptoCount = tradableQuotes.filter((q) => q.assetType === "CRYPTO" || isCryptoAsset(q.ticker, q.sector)).length;
  const municipalCount = tradableQuotes.filter(
    (q) => q.assetType === "EQUITY" || (!q.assetType && !isCryptoAsset(q.ticker, q.sector))
  ).length;

  const filteredQuotes = tradableQuotes.filter((q) => {
    if (activeFilterTab === "ETF") return q.assetType === "ETF";
    if (activeFilterTab === "CRYPTO") return q.assetType === "CRYPTO" || isCryptoAsset(q.ticker, q.sector);
    if (activeFilterTab === "EQUITY") return q.assetType === "EQUITY" || (!q.assetType && !isCryptoAsset(q.ticker, q.sector));
    return true;
  });

  return (
    <div className="bento-card p-3 sm:p-3.5 flex flex-col min-h-0 h-full">
      {/* Terminal Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-border pb-2.5 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Midgard Stock Exchange
          </h3>
          <span className="text-[11px] text-muted hidden md:inline">
            | Live Order Book
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterTab === "ALL" ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${equitiesMoodInfo.bg} border ${equitiesMoodInfo.border} ${equitiesMoodInfo.color} text-[10px] font-bold font-mono`}
                title="Municipal Equities Sentiment"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-info" />
                Muni: {equitiesMoodInfo.text}
              </span>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cryptoMoodInfo.bg} border ${cryptoMoodInfo.border} ${cryptoMoodInfo.color} text-[10px] font-bold font-mono`}
                title="Crypto Protocols Sentiment"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Crypto: {cryptoMoodInfo.text}
              </span>
            </div>
          ) : activeFilterTab === "EQUITY" ? (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${equitiesMoodInfo.bg} border ${equitiesMoodInfo.border} ${equitiesMoodInfo.color} text-[10px] sm:text-[11px] font-bold font-mono`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
              Municipal: {equitiesMoodInfo.text}
            </span>
          ) : activeFilterTab === "CRYPTO" ? (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${cryptoMoodInfo.bg} border ${cryptoMoodInfo.border} ${cryptoMoodInfo.color} text-[10px] sm:text-[11px] font-bold font-mono`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Crypto: {cryptoMoodInfo.text}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-[11px] font-bold font-mono">
              <LineChart className="w-3 h-3 text-accent" />
              Macro Realm Benchmarks
            </span>
          )}
        </div>
      </div>

      {/* Asset Class Filter Tabs: [📊 Indices] comes BEFORE [All] */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-1 bg-surface2/70 p-0.5 rounded-lg border border-border text-[11px] font-mono">
          {safeIndices.length > 0 && (
            <button
              type="button"
              onClick={() => handleFilterChange("INDICES")}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                activeFilterTab === "INDICES"
                  ? "bg-surface text-accent font-bold shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              <LineChart className="w-3 h-3 text-accent" />
              Indices ({safeIndices.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => handleFilterChange("ALL")}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeFilterTab === "ALL"
                ? "bg-surface text-accent font-bold shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            All ({tradableQuotes.length})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("EQUITY")}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activeFilterTab === "EQUITY"
                ? "bg-surface text-accent font-bold shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            <Landmark className="w-3 h-3 text-info" />
            Municipal ({municipalCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("CRYPTO")}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activeFilterTab === "CRYPTO"
                ? "bg-surface text-accent font-bold shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            Crypto ({cryptoCount})
          </button>
          {etfCount > 0 && (
            <button
              type="button"
              onClick={() => handleFilterChange("ETF")}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                activeFilterTab === "ETF"
                  ? "bg-surface text-accent font-bold shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              ETF ({etfCount})
            </button>
          )}
        </div>
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

      {/* Main Table View: Switchable between INDICES and STOCKS */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto pr-1">
        {activeFilterTab === "INDICES" ? (
          /* ==================== 1. INDICES BENCHMARK TABLE ==================== */
          safeIndices.length === 0 ? (
            <div className="text-center py-10 text-muted text-xs font-medium">
              No macro indices available.
            </div>
          ) : (
            <table className="w-full text-xs text-left min-w-[320px] sm:min-w-full">
              <thead className="text-[10px] text-muted uppercase tracking-wider border-b border-border sticky top-0 bg-surface z-10 font-mono">
                <tr>
                  <th className="pb-2 font-bold">Index Benchmark</th>
                  <th className="pb-2 font-bold text-right">Value (Price)</th>
                  <th className="pb-2 font-bold text-right">24h Change</th>
                  <th className="pb-2 font-bold text-center">Tracked Basket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {safeIndices.map((idx) => {
                  const isUp = idx.changeAmount >= 0;
                  const basketSummary = (idx.constituents || [])
                    .map((c) => `${(c.weight * 100).toFixed(0)}% ${c.ticker}`)
                    .join(" / ");
                  return (
                    <tr
                      key={idx.indexId}
                      onClick={() => handleSelectIndex(idx)}
                      className="hover:bg-surface2/60 cursor-pointer transition-colors group"
                      title="Click to view index lore, publisher authority, and constituent breakdown"
                    >
                      <td className="py-2.5 font-sans">
                        <div className="font-bold text-primary text-xs flex items-center gap-1.5 group-hover:text-accent transition-colors">
                          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="font-mono text-accent">{idx.indexId}</span>
                          <span className="text-[10px] text-muted font-normal truncate max-w-[120px] sm:max-w-none">
                            {idx.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-primary">
                        {formatZeny(idx.price)} Z
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold flex items-center justify-end gap-1 ${
                          isUp ? "text-success" : "text-danger"
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{Math.abs(idx.changePercent).toFixed(1)}%</span>
                      </td>
                      <td className="py-2.5 text-center text-[10px] text-muted font-sans truncate max-w-[140px]">
                        {basketSummary || "Dynamic Basket"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* ==================== 2. SPOT MARKET ORDER BOOK ==================== */
          filteredQuotes.length === 0 ? (
            <div className="text-center py-10 text-muted text-xs font-medium">
              {quotes.length === 0 ? "Loading Midgard Stock Quotes..." : "No tickers matching current filter."}
            </div>
          ) : (
            <table className="w-full text-xs text-left min-w-[320px] sm:min-w-full">
              <thead className="text-[10px] text-muted uppercase tracking-wider border-b border-border sticky top-0 bg-surface z-10 font-mono">
                <tr>
                  <th className="pb-2 font-bold">Ticker & Organization</th>
                  <th className="pb-2 font-bold text-right">Price</th>
                  <th className="pb-2 font-bold text-right">24h Change</th>
                  <th className="pb-2 font-bold text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filteredQuotes.map((q) => {
                  const isUp = q.changeAmount >= 0;
                  const theme = getTickerTheme(q.ticker);
                  const isCrypto = isCryptoAsset(q.ticker, q.assetType || q.sector);
                  return (
                    <tr
                      key={q.ticker}
                      onClick={() => handleSelectQuote(q)}
                      className="hover:bg-surface2/60 cursor-pointer transition-colors group"
                      title="Click to view lore, live OHLC candles, and Black Swan intelligence"
                    >
                      <td className="py-2.5 font-sans">
                        <div className="font-bold text-primary text-xs flex items-center gap-1.5 group-hover:text-accent transition-colors">
                          <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
                          <span>{q.ticker}</span>
                          {isCrypto && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Crypto
                            </span>
                          )}
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
          )
        )}
      </div>

      {/* Rich Black Swan News, Municipal Intel & Index Intel Modal */}
      <ErrorBoundary
        fallbackTitle="Market Intel Modal Unavailable"
        fallbackMessage="An unexpected error occurred while loading this stock's details. You can close this or try again."
        onReset={() => {
          handleSelectQuote(null);
          handleSelectIndex(null);
        }}
      >
        <TickerDetailModal
          quote={activeQuote}
          indexData={activeIndex}
          onClose={() => {
            handleSelectQuote(null);
            handleSelectIndex(null);
          }}
          onTradeSuccess={onTradeSuccess}
        />
      </ErrorBoundary>
    </div>
  );
};



