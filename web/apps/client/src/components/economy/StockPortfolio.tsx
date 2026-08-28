import React, { useState, useMemo } from "react";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  PieChart as PieIcon,
  Coins,
  Newspaper,
  Landmark,
  Zap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { StockHolding, StockMarketQuote, getAssetVocabulary, isCryptoAsset, DripToggleResponse } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";
import { getTickerTheme } from "../../lib/tickerTheme";
import { TickerDetailModal } from "./TickerDetailModal";
import { DividendHarvestModal } from "./DividendHarvestModal";

export type AssetClassFilter = "ALL" | "EQUITY" | "CRYPTO";
type FilterTab = "ALL" | "GAINERS" | "LOSERS";
type SortOption = "VALUE" | "WEIGHT" | "PNL";

interface StockPortfolioProps {
  holdings: StockHolding[];
  totalNetWorth?: number;
  onSelectTicker?: (ticker: string) => void;
  assetClassTab?: AssetClassFilter;
  onAssetClassChange?: (tab: AssetClassFilter) => void;
  onRefresh?: () => void;
}

export const StockPortfolio: React.FC<StockPortfolioProps> = ({
  holdings = [],
  totalNetWorth,
  onSelectTicker,
  assetClassTab: controlledAssetClassTab,
  onAssetClassChange,
  onRefresh,
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
  const [harvestModalHolding, setHarvestModalHolding] = useState<StockHolding | null | undefined>(undefined);
  const [togglingDripTicker, setTogglingDripTicker] = useState<string | null>(null);

  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  // Total Market Value of stock portfolio
  const totalStockValue = useMemo(
    () => safeHoldings.reduce((sum, h) => sum + h.currentPrice * h.shares, 0),
    [safeHoldings]
  );

  const municipalValue = useMemo(
    () =>
      safeHoldings
        .filter((h) => !isCryptoAsset(h.ticker, h.assetType))
        .reduce((sum, h) => sum + h.currentPrice * h.shares, 0),
    [safeHoldings]
  );

  const cryptoValue = totalStockValue - municipalValue;

  // Calculate total pending dividends & cash-harvestable dividends (DRIP off)
  const totalPendingDividends = useMemo(
    () => safeHoldings.reduce((sum, h) => sum + (h.pendingDividends || 0), 0),
    [safeHoldings]
  );

  const cashHarvestableDividends = useMemo(
    () =>
      safeHoldings
        .filter((h) => !h.dripEnabled)
        .reduce((sum, h) => sum + (h.pendingDividends || 0), 0),
    [safeHoldings]
  );

  // Calculate ratios and enrich holdings
  const enrichedHoldings = useMemo(() => {
    return safeHoldings.map((h) => {
      const isCrypto = isCryptoAsset(h.ticker, h.assetType);
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
  }, [safeHoldings, totalStockValue, totalNetWorth]);

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

  const handleToggleDrip = async (ticker: string, currentEnabled: boolean) => {
    setTogglingDripTicker(ticker);
    try {
      const res = await api.post<DripToggleResponse>("/api/economy/drip/toggle", {
        ticker,
        enabled: !currentEnabled,
      });
      if (res.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to toggle DRIP:", err);
    } finally {
      setTogglingDripTicker(null);
    }
  };

  const municipalHoldingsCount = safeHoldings.filter((h) => !isCryptoAsset(h.ticker, h.assetType)).length;
  const cryptoHoldingsCount = safeHoldings.length - municipalHoldingsCount;

  return (
    <div className="bento-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header: Title + Total Portfolio Value */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-info" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary whitespace-nowrap">
              Investment Portfolio
            </h3>
            <span className="text-[10px] text-muted leading-none">Equities & Crypto Positions</span>
          </div>
        </div>

        {safeHoldings.length > 0 && (
          <div className="text-[11px] font-mono font-bold flex items-center gap-1 text-right shrink-0 whitespace-nowrap">
            <span className="text-muted text-[10px] hidden sm:inline font-sans font-normal">Total:</span>
            <span className="text-primary">{formatZeny(totalStockValue)} Z</span>
          </div>
        )}
      </div>

      {safeHoldings.length > 0 && (
        <div className="space-y-1.5 shrink-0 mb-2">
          {/* Subtotal Allocation Chips */}
          <div className="grid grid-cols-2 gap-1.5 font-mono">
            <button
              type="button"
              onClick={() => setAssetClassTab(assetClassTab === "EQUITY" ? "ALL" : "EQUITY")}
              className={`p-1.5 px-2 rounded-lg transition-all cursor-pointer border text-left flex flex-col justify-between gap-0.5 ${
                assetClassTab === "EQUITY"
                  ? "bg-info/20 border-info text-info shadow-xs ring-1 ring-info/30"
                  : "bg-info/10 border-info/20 text-info hover:bg-info/15"
              }`}
              title={
                assetClassTab === "EQUITY"
                  ? "Filter active: Municipal Equities (Click to show all)"
                  : "Filter list by Municipal Equities"
              }
            >
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span className="flex items-center gap-1 font-sans font-semibold text-[9.5px] truncate text-info">
                  <Landmark className="w-3 h-3 text-info shrink-0" />
                  <span className="truncate">Municipal</span>
                </span>
                <span
                  className={`text-[8.5px] font-mono font-bold px-1 rounded shrink-0 ${
                    assetClassTab === "EQUITY" ? "bg-info text-black" : "bg-info/20 text-info"
                  }`}
                >
                  {municipalHoldingsCount}
                </span>
              </div>
              <div className="font-bold text-[11px] font-mono text-primary truncate whitespace-nowrap">
                {formatZeny(municipalValue)} <span className="text-[9px] text-muted font-normal">Z</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAssetClassTab(assetClassTab === "CRYPTO" ? "ALL" : "CRYPTO")}
              className={`p-1.5 px-2 rounded-lg transition-all cursor-pointer border text-left flex flex-col justify-between gap-0.5 ${
                assetClassTab === "CRYPTO"
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-xs ring-1 ring-amber-500/30"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
              }`}
              title={
                assetClassTab === "CRYPTO"
                  ? "Filter active: Crypto Protocols (Click to show all)"
                  : "Filter list by Crypto Protocols"
              }
            >
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span className="flex items-center gap-1 font-sans font-semibold text-[9.5px] truncate text-amber-400">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Crypto</span>
                </span>
                <span
                  className={`text-[8.5px] font-mono font-bold px-1 rounded shrink-0 ${
                    assetClassTab === "CRYPTO" ? "bg-amber-400 text-black" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {cryptoHoldingsCount}
                </span>
              </div>
              <div className="font-bold text-[11px] font-mono text-primary truncate whitespace-nowrap">
                {formatZeny(cryptoValue)} <span className="text-[9px] text-muted font-normal">Z</span>
              </div>
            </button>
          </div>

          {/* Accrued Dividends Summary & Harvest Action Banner */}
          {totalPendingDividends > 0 && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-success/10 border border-success/30 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded bg-success/20 text-success shrink-0">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-primary flex items-center gap-1 truncate">
                    <span>Accrued Yields:</span>
                    <span className="font-mono text-success font-bold whitespace-nowrap">
                      +{formatZeny(totalPendingDividends)} Z
                    </span>
                  </div>
                  <div className="text-[10px] text-muted font-mono truncate">
                    {cashHarvestableDividends > 0 ? (
                      <span className="text-success/90">
                        {formatZeny(cashHarvestableDividends)} Z claimable (DRIP Off)
                      </span>
                    ) : (
                      <span className="text-purple-300">
                        All yields scheduled for midnight DRIP auto-reinvest
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHarvestModalHolding(null)}
                disabled={cashHarvestableDividends <= 0}
                className={`px-2.5 py-1 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  cashHarvestableDividends > 0
                    ? "bg-success text-black hover:bg-success/90 shadow-xs"
                    : "bg-surface2 text-muted border border-border cursor-not-allowed opacity-60"
                }`}
                title={
                  cashHarvestableDividends > 0
                    ? "Harvest accrued dividends into Wallet or Bank"
                    : "Toggle DRIP OFF on positions to harvest cash dividends"
                }
              >
                <Coins className="w-3 h-3" />
                <span>Harvest All</span>
              </button>
            </div>
          )}

          {/* Filters & Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 border-t border-border/50 text-[10px]">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface2/50 p-0.5 rounded border border-border">
              {(["ALL", "GAINERS", "LOSERS"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    filterTab === tab
                      ? "bg-primary text-black font-bold shadow-xs"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {tab === "ALL"
                    ? "All"
                    : tab === "GAINERS"
                    ? "Gainers"
                    : "Losers"}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 text-muted">
              <span className="text-[9px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-surface2 border border-border rounded px-1.5 py-0.5 text-[10px] text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="VALUE">Market Value</option>
                <option value="WEIGHT">Weight %</option>
                <option value="PNL">PnL %</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Holdings List (High-Density, Scrollable) */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
        {safeHoldings.length === 0 ? (
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
            const isDripLoading = togglingDripTicker === h.ticker;

            return (
              <div
                key={h.ticker}
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-surface2/60 border-border shadow-md"
                    : "bg-surface2/25 border-border/70 hover:border-border hover:bg-surface2/40"
                }`}
              >
                {/* Main Clickable Row */}
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
                  className="p-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                >
                  {/* Left: Avatar + Ticker & Ratio */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-[11px] shrink-0 border ${theme.bgClass}`}
                    >
                      {theme.avatarText}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="font-mono">{h.ticker}</span>
                        {h.isCrypto && (
                          <span className="px-1 py-0.2 rounded bg-amber-400/10 text-amber-400 text-[8.5px] font-mono border border-amber-400/20">
                            CRYPTO
                          </span>
                        )}
                        <span className="text-[10px] text-muted font-normal truncate hidden sm:inline">
                          {h.name}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 text-primary/90 font-bold bg-surface px-1 py-0.2 rounded border border-border/40">
                          <PieIcon className="w-2.5 h-2.5 text-accent inline shrink-0" />
                          <span>{h.stockRatio.toFixed(1)}%</span>
                        </span>
                        {h.dripEnabled ? (
                          <span
                            className="inline-flex items-center gap-0.5 text-purple-400 bg-purple-500/10 px-1 py-0.2 rounded border border-purple-500/20 text-[8.5px] font-bold"
                            title="DRIP (Dividend Reinvestment Plan): Auto-reinvesting dividends into shares at midnight"
                          >
                            <Sparkles className="w-2 h-2" /> DRIP
                          </span>
                        ) : (
                          <span
                            className="text-muted/60 text-[8.5px]"
                            title="DRIP OFF: Accumulating dividends as claimable cash"
                          >
                            DRIP OFF
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

                {/* Expandable Details Drawer */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-1 border-t border-border/40 bg-surface/50 text-[10px] font-mono animate-fadeIn space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[8.5px] text-muted block">
                          {vocab.unitLabel} Held
                        </span>
                        <span className="font-bold text-primary">
                          {h.shares.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[8.5px] text-muted block">
                          {h.isCrypto ? "Cost Basis" : "Avg Buy Price"}
                        </span>
                        <span className="font-bold text-primary">
                          {formatZeny(h.avgBuyPrice)} Z
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[8.5px] text-muted block">
                          Current Price
                        </span>
                        <span className="font-bold text-primary">
                          {formatZeny(h.currentPrice)} Z
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-surface2/40 border border-border/30">
                        <span className="text-[8.5px] text-muted block">
                          Accrued Dividends
                        </span>
                        <span className="font-bold text-success">
                          +{formatZeny(h.pendingDividends || 0)} Z
                        </span>
                      </div>
                    </div>

                    {/* DRIP Controls Bar - Streamlined with hover tooltip */}
                    <div className="p-1.5 px-2 rounded bg-surface2/50 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className={`w-3.5 h-3.5 shrink-0 ${h.dripEnabled ? "text-purple-400" : "text-muted/60"}`} />
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1 shrink-0">
                          <span>DRIP</span>
                        </span>

                        {/* Helper Info Tooltip */}
                        <div className="relative group/driptip flex items-center shrink-0">
                          <HelpCircle className="w-3 h-3 text-muted/70 hover:text-accent cursor-help transition-colors" />
                          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/driptip:flex flex-col w-60 p-2 rounded-lg bg-surface border border-border text-[9.5px] font-mono text-primary shadow-2xl z-30 pointer-events-none animate-fadeIn leading-relaxed">
                            <div className="font-bold text-accent mb-0.5 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                              <span>Dividend Reinvestment Plan</span>
                            </div>
                            <div className="text-muted">
                              {h.dripEnabled
                                ? "ENABLED: Dividends automatically purchase more shares at midnight without transaction fees."
                                : "DISABLED: Dividends accumulate as cash to harvest to your wallet or bank."}
                            </div>
                            <div className="text-[8.5px] text-muted/70 mt-1 pt-1 border-t border-border/40">
                              Toggle to switch between auto-compounding and cash payouts.
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                            h.dripEnabled
                              ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                              : "bg-surface2/60 text-muted/80 border-border/40"
                          }`}
                        >
                          {h.dripEnabled ? "ON" : "OFF"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDrip(h.ticker, Boolean(h.dripEnabled));
                        }}
                        disabled={isDripLoading}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] transition-all cursor-pointer border ${
                          h.dripEnabled
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30 shadow-sm"
                            : "bg-surface text-muted border-border hover:text-primary hover:bg-surface2"
                        }`}
                        title={
                          h.dripEnabled
                            ? "Click to disable DRIP (harvest dividends as cash)"
                            : "Click to enable DRIP (auto-reinvest dividends at midnight)"
                        }
                      >
                        {isDripLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-accent" />
                        ) : h.dripEnabled ? (
                          <ToggleRight className="w-4 h-4 text-purple-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted" />
                        )}
                        <span>{h.dripEnabled ? "DRIP Active" : "Enable"}</span>
                      </button>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="pt-1 border-t border-border/20 flex items-center justify-between text-[9px] text-muted">
                      <div className="flex items-center gap-2">
                        <span>
                          PnL:{" "}
                          <strong className={h.isPositive ? "text-success" : "text-danger"}>
                            {h.isPositive ? "+" : ""}
                            {formatZeny(h.unrealizedPnL)} Z
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Harvest Button */}
                        {h.pendingDividends > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!h.dripEnabled) {
                                setHarvestModalHolding(h);
                              }
                            }}
                            disabled={Boolean(h.dripEnabled)}
                            className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
                              !h.dripEnabled
                                ? "bg-success/15 hover:bg-success/25 border border-success/30 text-success cursor-pointer"
                                : "bg-surface2 text-muted border border-border cursor-not-allowed opacity-60"
                            }`}
                            title={
                              h.dripEnabled
                                ? "Cannot harvest while DRIP is active. Toggle DRIP OFF first."
                                : "Harvest dividends to wallet or bank"
                            }
                          >
                            <Coins className="w-2.5 h-2.5" />
                            <span>
                              {h.dripEnabled ? "DRIP Active" : `Harvest (+${formatZeny(h.pendingDividends)} Z)`}
                            </span>
                          </button>
                        )}

                        {/* Trade / Detail Button */}
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
                          title="View price action, lore, and trade via Web Terminal"
                        >
                          <Newspaper className="w-2.5 h-2.5" />
                          <span>Trade / Detail</span>
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

      {/* Standalone Ticker Details Modal */}
      <TickerDetailModal
        quote={selectedQuoteForModal}
        onClose={() => setSelectedQuoteForModal(null)}
        onTradeSuccess={onRefresh}
      />

      {/* Dividend Harvest Modal */}
      {harvestModalHolding !== undefined && (
        <DividendHarvestModal
          holding={harvestModalHolding}
          allHoldings={safeHoldings}
          onClose={() => setHarvestModalHolding(undefined)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
