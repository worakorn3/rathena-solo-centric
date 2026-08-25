import React, { useState, useMemo } from "react";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  PieChart as PieIcon,
  Coins,
  Newspaper,
  Landmark,
  Zap,
} from "lucide-react";
import { StockHolding, StockMarketQuote, getAssetVocabulary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { getTickerTheme } from "../../lib/tickerTheme";
import { TickerDetailModal } from "./TickerDetailModal";

export type AssetClassFilter = "ALL" | "EQUITY" | "CRYPTO";
type FilterTab = "ALL" | "GAINERS" | "LOSERS";
type SortOption = "VALUE" | "WEIGHT" | "PNL";

interface StockPortfolioProps {
  holdings: StockHolding[];
  totalNetWorth?: number;
  onSelectTicker?: (ticker: string) => void;
  assetClassTab?: AssetClassFilter;
  onAssetClassChange?: (tab: AssetClassFilter) => void;
}

const CRYPTO_TICKERS = new Set(["EMP", "YMI", "WRP", "SHD", "ZEX", "ORA", "POR", "NZN", "ALM", "KFX"]);

export const StockPortfolio: React.FC<StockPortfolioProps> = ({
  holdings,
  totalNetWorth,
  onSelectTicker,
  assetClassTab: controlledAssetClassTab,
  onAssetClassChange,
}) => {
  const [internalAssetClassTab, setInternalAssetClassTab] = useState<AssetClassFilter>("ALL");
  const assetClassTab = controlledAssetClassTab !== undefined ? controlledAssetClassTab : internalAssetClassTab;
  const setAssetClassTab = (tab: AssetClassFilter) => {
    if (onAssetClassChange) {
      onAssetClassChange(tab);
    } else {
      setInternalAssetClassTab(tab);
    }
  };

  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("VALUE");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<StockMarketQuote | null>(null);

  // Total Market Value of stock portfolio
  const totalStockValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.currentPrice * h.shares, 0),
    [holdings]
  );

  const municipalValue = useMemo(
    () =>
      holdings
        .filter((h) => !CRYPTO_TICKERS.has(h.ticker) && h.assetType !== "CRYPTO")
        .reduce((sum, h) => sum + h.currentPrice * h.shares, 0),
    [holdings]
  );

  const cryptoValue = totalStockValue - municipalValue;

  // Calculate ratios and enrich holdings
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const isCrypto = CRYPTO_TICKERS.has(h.ticker) || h.assetType === "CRYPTO";
      const marketVal = h.currentPrice * h.shares;
      const stockRatio =
        totalStockValue > 0 ? (marketVal / totalStockValue) * 100 : 0;
      const netWorthRatio =
        totalNetWorth && totalNetWorth > 0
          ? (marketVal / totalNetWorth) * 100
          : null;

      return {
        ...h,
        isCrypto,
        marketVal,
        stockRatio,
        netWorthRatio,
        isPositive: h.unrealizedPnL >= 0,
      };
    });
  }, [holdings, totalStockValue, totalNetWorth]);

  // Filter holdings by Asset Class and PnL
  const filteredHoldings = useMemo(() => {
    return enrichedHoldings.filter((h) => {
      if (assetClassTab === "EQUITY" && h.isCrypto) return false;
      if (assetClassTab === "CRYPTO" && !h.isCrypto) return false;

      if (filterTab === "GAINERS") return h.unrealizedPnL > 0;
      if (filterTab === "LOSERS") return h.unrealizedPnL < 0;
      return true;
    });
  }, [enrichedHoldings, assetClassTab, filterTab]);

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      if (sortBy === "VALUE") return b.marketVal - a.marketVal;
      if (sortBy === "WEIGHT") return b.stockRatio - a.stockRatio;
      if (sortBy === "PNL") return b.unrealizedPnLPercent - a.unrealizedPnLPercent;
      return 0;
    });
  }, [filteredHoldings, sortBy]);

  const toggleExpand = (ticker: string) => {
    setExpandedTicker((prev) => (prev === ticker ? null : ticker));
  };

  const municipalHoldingsCount = holdings.filter((h) => !CRYPTO_TICKERS.has(h.ticker) && h.assetType !== "CRYPTO").length;
  const cryptoHoldingsCount = holdings.length - municipalHoldingsCount;

  return (
    <div className="bento-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col">
      {/* Header: Title + Total Portfolio Value & Sub-totals */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-info" /> Investment Portfolio
          </h3>
          <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
            {holdings.length} {holdings.length === 1 ? "Position" : "Positions"}
          </span>
        </div>

        {holdings.length > 0 && (
          <div className="text-[11px] font-mono font-bold flex items-center gap-2">
            <span className="text-muted text-[10px] hidden sm:inline">Total Value:</span>
            <span className="text-primary">{formatZeny(totalStockValue)} Z</span>
          </div>
        )}
      </div>

      {holdings.length > 0 && (
        <>
          {/* Subtotal Allocation Chips */}
          <div className="grid grid-cols-2 gap-2 mb-2 shrink-0 text-[10px] font-mono">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-info/10 border border-info/20 text-info">
              <span className="flex items-center gap-1 font-sans font-medium text-[9px]">
                <Landmark className="w-3 h-3 text-info shrink-0" />
                <span>Municipal Equities</span>
              </span>
              <span className="font-bold">{formatZeny(municipalValue)} Z</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-accent/10 border border-accent/20 text-accent">
              <span className="flex items-center gap-1 font-sans font-medium text-[9px]">
                <Zap className="w-3 h-3 text-accent shrink-0" />
                <span>Crypto Protocols</span>
              </span>
              <span className="font-bold">{formatZeny(cryptoValue)} Z</span>
            </div>
          </div>

          {/* Top Proportion Distribution Bar */}
          <div className="mb-2 shrink-0">
            <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden flex">
              {enrichedHoldings.map((h) => {
                const theme = getTickerTheme(h.ticker);
                return (
                  <div
                    key={`bar-${h.ticker}`}
                    className={`h-full ${theme.fillColorClass} transition-all duration-300`}
                    style={{ width: `${Math.max(1.5, h.stockRatio)}%` }}
                    title={`${h.ticker}: ${h.stockRatio.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Asset Class Tabs & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-border/40 shrink-0 text-[10px]">
            {/* Primary Asset Class Selector */}
            <div className="flex items-center gap-1 bg-surface2/80 p-0.5 rounded-lg border border-border text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setAssetClassTab("ALL")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  assetClassTab === "ALL"
                    ? "bg-surface text-primary font-bold shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                All ({holdings.length})
              </button>
              <button
                type="button"
                onClick={() => setAssetClassTab("EQUITY")}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  assetClassTab === "EQUITY"
                    ? "bg-surface text-info font-bold shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                <Landmark className="w-3 h-3 text-info" />
                <span>Equities ({municipalHoldingsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetClassTab("CRYPTO")}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  assetClassTab === "CRYPTO"
                    ? "bg-surface text-accent font-bold shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                <Zap className="w-3 h-3 text-accent" />
                <span>Crypto ({cryptoHoldingsCount})</span>
              </button>
            </div>

            {/* PnL Filter + Sort */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-0.5 bg-surface2/60 p-0.5 rounded border border-border/60">
                <button
                  type="button"
                  onClick={() => setFilterTab("ALL")}
                  className={`px-1.5 py-0.5 rounded text-[9px] ${
                    filterTab === "ALL" ? "bg-surface font-bold text-primary" : "text-muted hover:text-primary"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("GAINERS")}
                  className={`px-1.5 py-0.5 rounded text-[9px] ${
                    filterTab === "GAINERS" ? "bg-success/20 text-success font-bold" : "text-muted hover:text-success"
                  }`}
                >
                  Gainers
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("LOSERS")}
                  className={`px-1.5 py-0.5 rounded text-[9px] ${
                    filterTab === "LOSERS" ? "bg-danger/20 text-danger font-bold" : "text-muted hover:text-danger"
                  }`}
                >
                  Losers
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort portfolio assets by"
                className="bg-surface2 border border-border text-primary text-[10px] font-mono rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-accent"
              >
                <option value="VALUE">Value ▾</option>
                <option value="WEIGHT">Weight % ▾</option>
                <option value="PNL">PnL % ▾</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Holdings List (Dime!-style Asset Rows) */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {holdings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted text-xs">
            <Briefcase className="w-8 h-8 mb-2 opacity-40 text-muted" />
            <span className="font-bold text-primary/80">
              No active investment positions
            </span>
            <span className="text-[11px] text-muted/80 mt-1 max-w-xs">
              Visit Midgard Stock Exchange brokers in Prontera and municipal halls to
              acquire municipal equity shares and crypto protocol tokens.
            </span>
          </div>
        ) : sortedHoldings.length === 0 ? (
          <div className="text-center py-6 text-muted text-xs">
            No assets match the selected filter.
          </div>
        ) : (
          sortedHoldings.map((h) => {
            const theme = getTickerTheme(h.ticker);
            const isExpanded = expandedTicker === h.ticker;
            const vocab = getAssetVocabulary(h.isCrypto ? "CRYPTO" : "EQUITY");

            return (
              <div
                key={h.ticker}
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-surface2/60 border-border shadow-md"
                    : "bg-surface2/25 border-border/70 hover:border-border hover:bg-surface2/40"
                }`}
              >
                {/* Main Clickable Row (Dime! layout) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(h.ticker)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(h.ticker);
                    }
                  }}
                  className="p-2 sm:p-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                >
                  {/* Left: 2-Letter Glyph Avatar + Ticker & Dime!-style Ratio */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Dime!-style Circular Avatar */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 border ${theme.bgClass}`}
                    >
                      {theme.avatarText}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Ticker Symbol & Full Name */}
                      <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="font-mono">{h.ticker}</span>
                        <span className="text-[10px] text-muted font-normal truncate hidden sm:inline">
                          {h.name}
                        </span>
                      </div>

                      {/* Dime!-style Pie Ratio Display: ◔ {ratio}% */}
                      <div className="text-[10px] font-mono text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 text-primary/90 font-bold bg-surface px-1 py-0.2 rounded border border-border/40">
                          <PieIcon className="w-2.5 h-2.5 text-accent inline shrink-0" />
                          <span>{h.stockRatio.toFixed(1)}%</span>
                        </span>
                        {h.netWorthRatio !== null && (
                          <span className="text-muted/70 text-[9px] hidden sm:inline">
                            • {h.netWorthRatio.toFixed(1)}% NW
                          </span>
                        )}
                        <span className="text-muted/60 hidden md:inline">
                          • {h.shares.toLocaleString()} {vocab.unitAbbr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Holding Market Value + Unrealized PnL */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-primary">
                      {formatZeny(h.marketVal)} Z
                    </div>
                    <div
                      className={`text-[10px] font-bold font-mono flex items-center justify-end gap-0.5 mt-0.5 ${
                        h.isPositive ? "text-success" : "text-danger"
                      }`}
                    >
                      {h.isPositive ? (
                        <TrendingUp className="w-2.5 h-2.5 inline shrink-0" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5 inline shrink-0" />
                      )}
                      <span>
                        {h.isPositive ? "+" : ""}
                        {h.unrealizedPnLPercent.toFixed(1)}%
                      </span>
                      <span className="text-[9px] opacity-80 hidden sm:inline">
                        ({h.isPositive ? "+" : ""}
                        {formatZeny(h.unrealizedPnL)})
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-muted ml-0.5 inline" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted ml-0.5 inline opacity-60" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Dime!-style Expandable Details Micro-Drawer */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-1 border-t border-border/40 bg-surface/50 text-[10px] font-mono animate-fadeIn">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[9px] text-muted block">
                          {vocab.unitLabel} Held
                        </span>
                        <span className="font-bold text-primary">
                          {h.shares.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[9px] text-muted block">
                          {h.isCrypto ? "Cost Basis" : "Avg Buy Price"}
                        </span>
                        <span className="font-bold text-primary">
                          {formatZeny(h.avgBuyPrice)} Z
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[9px] text-muted block">
                          Current Price
                        </span>
                        <span className="font-bold text-primary">
                          {formatZeny(h.currentPrice)} Z
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[9px] text-muted block">
                          Total Invested
                        </span>
                        <span className="font-bold text-primary">
                          {formatZeny(h.avgBuyPrice * h.shares)} Z
                        </span>
                      </div>
                    </div>

                    {/* Secondary Metrics Bar */}
                    <div className="mt-1.5 pt-1.5 border-t border-border/20 flex items-center justify-between text-[9px] text-muted">
                      <div className="flex items-center gap-2">
                        <span>
                          PnL Amount:{" "}
                          <strong
                            className={
                              h.isPositive ? "text-success" : "text-danger"
                            }
                          >
                            {h.isPositive ? "+" : ""}
                            {formatZeny(h.unrealizedPnL)} Z
                          </strong>
                        </span>
                        {h.pendingDividends > 0 && (
                          <span className="text-accent font-medium flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5 inline" />
                            {h.isCrypto ? "Rewards" : "Div"}: {formatZeny(h.pendingDividends)} Z
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted/80">
                          Weight: {h.stockRatio.toFixed(2)}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTicker) {
                              onSelectTicker(h.ticker);
                            } else {
                              setSelectedQuoteForModal({
                                ticker: h.ticker,
                                name: h.name,
                                sector: h.sector,
                                archetype: h.archetype,
                                price: h.currentPrice,
                                priceOld: h.priceOld,
                                changeAmount: h.changeAmount,
                                changePercent: h.changePercent,
                                dividend: h.dividendRate,
                                divAcc: 0,
                                splitCount: 0,
                              });
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="View related Black Swan news, events and catalysts"
                        >
                          <Newspaper className="w-2.5 h-2.5" />
                          <span>News & Intel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Standalone Ticker Details Modal if not controlled */}
      <TickerDetailModal
        quote={selectedQuoteForModal}
        onClose={() => setSelectedQuoteForModal(null)}
      />
    </div>
  );
};
