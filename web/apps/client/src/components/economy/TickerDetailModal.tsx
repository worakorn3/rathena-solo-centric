import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Cpu,
  Layers,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  StockMarketQuote,
  StockIndex,
  TickerNewsResponse,
  TradeStockResponse,
  CharacterSummary,
  NetWorthSummary,
  MUNICIPAL_LORE,
  CRYPTO_LORE,
  getAssetVocabulary,
  MAX_CHARACTER_ZENY,
} from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CandlestickChart } from "./CandlestickChart";

interface TickerDetailModalProps {
  quote?: StockMarketQuote | null;
  indexData?: StockIndex | null;
  onClose: () => void;
  onTradeSuccess?: () => void;
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
  if (cat.includes("CRYPTO") || cat.includes("PROTOCOL")) {
    return {
      label: "Crypto Protocol Event",
      color: "text-amber-400",
      bg: "bg-amber-400/15",
      border: "border-amber-400/30",
      icon: Zap,
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
  indexData,
  onClose,
  onTradeSuccess,
}) => {
  const { user } = useAuth();
  const [newsData, setNewsData] = useState<TickerNewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Expandable Trading Form State (expand when clicking Buy or Sell)
  const [isTradeExpanded, setIsTradeExpanded] = useState<boolean>(false);
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [tradeDestination, setTradeDestination] = useState<"WALLET" | "BANK">("WALLET");
  const [sharesInput, setSharesInput] = useState<string>("");
  const [zenyInput, setZenyInput] = useState<string>("");
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [tradeFeedback, setTradeFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // User character & portfolio holdings for trading verification
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const shareInputRef = useRef<HTMLInputElement | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadPlayerData = useCallback(async () => {
    if (!user) return;
    try {
      const [charsRes, nwRes] = await Promise.all([
        api.get<{ success: boolean; characters: CharacterSummary[] }>("/api/character/my-characters"),
        api.get<{ success: boolean; data: NetWorthSummary }>("/api/economy/net-worth"),
      ]);
      if (charsRes.success && charsRes.characters.length > 0) {
        setCharacters(charsRes.characters);
        setSelectedCharId((prev) =>
          prev && charsRes.characters.some((c) => c.charId === prev)
            ? prev
            : charsRes.characters[0].charId
        );
      }
      if (nwRes.success) {
        setNetWorth(nwRes.data);
      }
    } catch (err) {
      console.error("Failed to load user character data for trading:", err);
    }
  }, [user]);

  const currentTicker = quote?.ticker;

  useEffect(() => {
    if (user && currentTicker) {
      loadPlayerData();
    }
  }, [user, currentTicker, loadPlayerData]);

  // Fetch real-time active and historical triggered Black Swan news when ticker changes
  useEffect(() => {
    if (!currentTicker) {
      setNewsData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setTradeFeedback(null);
    setSharesInput("");
    setZenyInput("");

    api
      .get<TickerNewsResponse>(`/api/economy/events/ticker/${currentTicker}`)
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
  }, [currentTicker]);

  // Auto-focus share input when trade form expands
  useEffect(() => {
    if (isTradeExpanded && shareInputRef.current) {
      setTimeout(() => {
        shareInputRef.current?.focus();
      }, 50);
    }
  }, [isTradeExpanded, tradeAction]);

  if (indexData) {
    const isUp = indexData.changeAmount >= 0;
    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bento-card max-w-xl w-full p-4 sm:p-5 border-accent/40 bg-surface shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-border pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-primary">{indexData.name}</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-accent/20 text-accent border border-accent/40 font-bold uppercase">
                    COMPOSITE BENCHMARK
                  </span>
                </div>
                <p className="text-[11px] text-muted font-sans mt-0.5">
                  Published by: <strong className="text-primary">{indexData.publisher}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-primary p-1 rounded-lg hover:bg-surface2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pricing & Performance Metric Strip */}
          <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-surface2/60 border border-border">
              <span className="text-[9px] text-muted font-sans uppercase">Composite Benchmark Value</span>
              <div className="text-base font-extrabold text-primary mt-0.5">{formatZeny(indexData.price)} Z</div>
            </div>
            <div className="p-2.5 rounded-lg bg-surface2/60 border border-border">
              <span className="text-[9px] text-muted font-sans uppercase">24h Benchmark Shift</span>
              <div className={`text-base font-extrabold mt-0.5 ${isUp ? "text-success" : "text-danger"}`}>
                {isUp ? "▲ +" : "▼ "}{Math.abs(indexData.changePercent).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Lore & Heritage Box */}
          {indexData.lore && (
            <div className="p-3 rounded-lg bg-surface2/60 border border-border/80 text-xs mb-3 font-sans leading-relaxed">
              <div className="font-bold text-accent mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Index Heritage & Methodology</span>
              </div>
              <p className="text-[11px] text-muted">{indexData.lore}</p>
            </div>
          )}

          {/* Sector & Archetype Intel Tags */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
            <div className="p-2 rounded bg-surface2/40 border border-border">
              <span className="text-[9px] text-muted font-sans uppercase">Benchmark Sector</span>
              <div className="font-bold text-primary mt-0.5">{indexData.sector}</div>
            </div>
            <div className="p-2 rounded bg-surface2/40 border border-border">
              <span className="text-[9px] text-muted font-sans uppercase">Risk Archetype</span>
              <div className="font-bold text-info mt-0.5">{indexData.archetype}</div>
            </div>
          </div>

          {/* Underlying Constituents Table */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-primary mb-1.5">
              <span>Tracked Constituent Baskets ({indexData.constituents?.length || 0})</span>
              <span className="text-[10px] text-muted font-mono font-normal">Rebalanced via MariaDB Indices</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {(indexData.constituents || []).map((c) => (
                <div
                  key={c.ticker}
                  className="p-2 rounded-lg bg-surface2/50 border border-border/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 font-sans">
                    <span className="font-bold text-primary">{c.name || c.ticker}</span>
                    <span className="text-[10px] text-muted font-mono">({c.ticker})</span>
                    {c.type && (
                      <span className="text-[10px] text-muted bg-surface2 px-1.5 py-0.2 rounded border border-border">
                        {c.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-primary">{c.currentPrice ? `${formatZeny(c.currentPrice)} Z` : "—"}</span>
                    <span className="font-bold text-accent">{(c.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-surface2 hover:bg-surface2/80 text-primary font-bold text-xs transition-colors border border-border"
          >
            Close Index Intel
          </button>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  // Derived variables (REACT_SCOPE_INTEGRITY guardrail: must remain declared!)
  const profile = MUNICIPAL_LORE[quote.ticker];
  const cryptoProfile = CRYPTO_LORE[quote.ticker];
  const activeEvents = newsData?.activeEvents || [];
  const historicalEvents = newsData?.historicalEvents || [];
  const hasLiveOrHistoricalNews = activeEvents.length > 0 || historicalEvents.length > 0;
  const isCrypto =
    quote.assetType === "CRYPTO" ||
    ["EMP", "YMI", "WRP", "SHD", "ZEX", "ORA", "POR", "NZN", "ALM", "KFX"].includes(quote.ticker) ||
    (quote.sector?.toLowerCase().includes("protocol") ?? false) ||
    (quote.sector?.toLowerCase().includes("defi") ?? false);

  const vocab = getAssetVocabulary(isCrypto ? "CRYPTO" : "EQUITY");
  const isTradable = !quote.tradeStatus || quote.tradeStatus === "TRADABLE";
  const isNonTradable = quote.tradeStatus === "NON_TRADABLE";
  const isTrackedOnly = quote.tradeStatus === "TRACKED_ONLY";

  // Selected character & holdings
  const activeChar =
    characters.find((c) => c.charId === selectedCharId) || (characters.length > 0 ? characters[0] : null);
  const holding = netWorth?.holdings.find((h) => h.ticker.toUpperCase() === quote.ticker.toUpperCase());
  const sharesHeld = holding ? holding.shares : 0;
  const availableZeny = activeChar ? Number(activeChar.zeny) || 0 : 0;
  const isCharOffline = activeChar ? !activeChar.online : true;

  // Toggle or switch expandable trade drawer
  const handleToggleTrade = (targetAction: "BUY" | "SELL") => {
    setTradeFeedback(null);
    if (!isTradeExpanded) {
      setTradeAction(targetAction);
      setIsTradeExpanded(true);
    } else if (tradeAction === targetAction) {
      setIsTradeExpanded(false);
    } else {
      setTradeAction(targetAction);
    }
  };

  // Bi-directional calculations
  const handleSharesChange = (val: string) => {
    setSharesInput(val);
    setTradeFeedback(null);
    const s = parseInt(val, 10);
    if (!s || s <= 0) {
      setZenyInput("");
    } else {
      setZenyInput(String(s * quote.price));
    }
  };

  const handleZenyChange = (val: string) => {
    setZenyInput(val);
    setTradeFeedback(null);
    const z = parseInt(val, 10);
    if (!z || z <= 0 || quote.price <= 0) {
      setSharesInput("");
    } else {
      const s = Math.floor(z / quote.price);
      setSharesInput(s > 0 ? String(s) : "");
    }
  };

  const applyPercentage = (pct: number) => {
    setTradeFeedback(null);
    if (quote.price <= 0) return;

    if (tradeAction === "BUY") {
      const budget = Math.floor(availableZeny * pct);
      const s = Math.floor(budget / quote.price);
      setSharesInput(s > 0 ? String(s) : "");
      setZenyInput(s > 0 ? String(s * quote.price) : "");
    } else {
      const s = Math.floor(sharesHeld * pct);
      setSharesInput(s > 0 ? String(s) : "");
      setZenyInput(s > 0 ? String(s * quote.price) : "");
    }
  };

  // Trade Execution
  const handleExecuteTrade = async () => {
    if (!isTradable) {
      setTradeFeedback({
        type: "error",
        message: `Asset '${quote.ticker}' is not available for spot trading.`,
      });
      return;
    }

    if (!user) {
      setTradeFeedback({ type: "error", message: "Please log in to trade stocks via Web Terminal." });
      return;
    }

    if (!activeChar) {
      setTradeFeedback({ type: "error", message: "Please select an active character for this trade." });
      return;
    }

    if (activeChar.online) {
      setTradeFeedback({
        type: "error",
        message: "Character is currently online in-game. Please log out before trading via Web Terminal.",
      });
      return;
    }

    const shares = parseInt(sharesInput, 10);
    if (!shares || shares <= 0) {
      setTradeFeedback({ type: "error", message: "Please enter a valid share quantity." });
      return;
    }

    const totalCost = shares * quote.price;
    if (tradeAction === "BUY" && availableZeny < totalCost) {
      setTradeFeedback({
        type: "error",
        message: `Insufficient Zeny. Need ${formatZeny(totalCost)} Z, have ${formatZeny(availableZeny)} Z.`,
      });
      return;
    }

    if (tradeAction === "SELL" && sharesHeld < shares) {
      setTradeFeedback({
        type: "error",
        message: `Insufficient shares held. Held: ${sharesHeld.toLocaleString()}, Requested: ${shares.toLocaleString()}.`,
      });
      return;
    }

    setIsSubmittingTrade(true);
    setTradeFeedback(null);

    try {
      const res = await api.post<TradeStockResponse>("/api/economy/trade", {
        ticker: quote.ticker,
        action: tradeAction,
        shares,
        charId: activeChar.charId,
        destination: tradeAction === "SELL" ? tradeDestination : "WALLET",
      });

      if (res.success) {
        setTradeFeedback({
          type: "success",
          message: res.message || `Trade executed: ${tradeAction} ${shares} ${quote.ticker}.`,
        });
        setSharesInput("");
        setZenyInput("");
        await loadPlayerData();
        if (onTradeSuccess) onTradeSuccess();
      } else {
        setTradeFeedback({
          type: "error",
          message: res.error || "Trade failed to execute.",
        });
      }
    } catch (err: any) {
      setTradeFeedback({
        type: "error",
        message: err.message || "Failed to execute trade. Please try again.",
      });
    } finally {
      setIsSubmittingTrade(false);
    }
  };

  const parsedShares = parseInt(sharesInput, 10) || 0;
  const parsedTotalZeny = parsedShares * quote.price;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bento-card w-full max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Title Bar */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isCrypto ? "bg-accent/10 border-accent/20" : "bg-info/10 border-info/20"
              }`}
            >
              {isCrypto ? (
                <Zap className="w-4 h-4 text-accent" />
              ) : (
                <Landmark className="w-4 h-4 text-info" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-primary truncate flex items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-accent">{quote.ticker}</span>
                <span>·</span>
                <span className="truncate">{quote.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                    isCrypto
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-info/15 text-info border border-info/30"
                  }`}
                  aria-label={`Asset Class: ${vocab.badgeLabel}`}
                >
                  {isCrypto ? (
                    <Zap className="w-2.5 h-2.5" />
                  ) : (
                    <Landmark className="w-2.5 h-2.5" />
                  )}
                  <span>{vocab.badgeLabel}</span>
                </span>
              </div>
              {isCrypto && cryptoProfile ? (
                <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                  <span className="text-accent">{cryptoProfile.network}</span>
                  <span className="text-muted/60">•</span>
                  <span className="text-muted/80">{cryptoProfile.consensusModel}</span>
                </div>
              ) : profile?.cityName ? (
                <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted/80" /> {profile.cityName}{" "}
                  <span className="text-muted/60">({profile.region})</span>
                </div>
              ) : null}
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
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-surface text-xs sm:text-sm custom-scrollbar">
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
                {vocab.yieldLabel}
              </div>
              <div className="font-bold text-accent mt-0.5 text-xs sm:text-sm">
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

          {/* 👑 NON-TRADABLE SOVEREIGN CITIZEN ENDOWMENT BANNER */}
          {isNonTradable && (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-purple-300 flex items-center gap-2">
                      <span>Sovereign Citizen Endowment</span>
                      <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono uppercase bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold">
                        Soulbound Asset
                      </span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 font-mono">
                      Non-Tradable Macro Index Composite • Lifetime Compounding Dividends
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-primary/85 leading-relaxed font-sans">
                This asset is soulbound and non-tradable on the open order book. Shares are granted as civic endowments (Day 1 Citizen Grant) and monster milestone hunting rewards. All held shares generate continuous daily dividends and can be automatically compounded via DRIP.
              </p>

              {user && holding && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2 rounded bg-surface/60 border border-purple-500/20">
                    <span className="text-muted block text-[9px]">Endowed Shares Held</span>
                    <span className="font-bold text-primary text-xs">{sharesHeld.toLocaleString()} shares</span>
                  </div>
                  <div className="p-2 rounded bg-surface/60 border border-purple-500/20">
                    <span className="text-muted block text-[9px]">Total Holding Value</span>
                    <span className="font-bold text-accent text-xs">{formatZeny(sharesHeld * quote.price)} Z</span>
                  </div>
                  <div className="p-2 rounded bg-surface/60 border border-purple-500/20 col-span-2 sm:col-span-1">
                    <span className="text-muted block text-[9px]">Accrued Dividends</span>
                    <span className="font-bold text-success text-xs">+{formatZeny(holding.pendingDividends || 0)} Z</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🏛️ TRACKED ONLY UNLISTED ENTERPRISE BANNER */}
          {isTrackedOnly && (
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-border/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted shrink-0 border border-border">
                <Globe className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-primary">Unlisted Municipal Enterprise</div>
                <div className="text-[11px] text-muted leading-tight mt-0.5">
                  Tracked reference only for regional macroeconomic indices. Not listed for open spot trading.
                </div>
              </div>
            </div>
          )}

          {/* 🚀 EXPANDABLE ACTION TRIGGER BAR: BUY OR SELL BUTTONS (TRADABLE ONLY) */}
          {isTradable && user && (
            <div className="space-y-3">
              {/* Trigger Bar: Buy vs Sell Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Buy Trigger Button */}
                <button
                  type="button"
                  onClick={() => handleToggleTrade("BUY")}
                  className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isTradeExpanded && tradeAction === "BUY"
                      ? "bg-success text-black border-success font-extrabold shadow-md ring-2 ring-success/30"
                      : "bg-surface2/80 hover:bg-surface2 border-border text-primary hover:border-success/50"
                  }`}
                  title={isTradeExpanded && tradeAction === "BUY" ? "Click to collapse buy panel" : "Click to expand buy panel"}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isTradeExpanded && tradeAction === "BUY"
                          ? "bg-black/20 text-black"
                          : "bg-success/15 text-success"
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="font-bold text-xs">Buy {vocab.unitLabel}</div>
                      <div
                        className={`text-[9px] font-mono ${
                          isTradeExpanded && tradeAction === "BUY"
                            ? "text-black/80 font-semibold"
                            : "text-muted"
                        }`}
                      >
                        {formatZeny(quote.price)} Z / {vocab.unitAbbr}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono hidden sm:inline-block px-1.5 py-0.5 rounded ${
                        isTradeExpanded && tradeAction === "BUY"
                          ? "bg-black/20 text-black font-bold"
                          : "bg-surface text-accent font-semibold"
                      }`}
                    >
                      {formatZeny(availableZeny)} Z
                    </span>
                    {isTradeExpanded && tradeAction === "BUY" ? (
                      <ChevronUp className="w-4 h-4 text-black" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </button>

                {/* Sell Trigger Button */}
                <button
                  type="button"
                  onClick={() => handleToggleTrade("SELL")}
                  className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isTradeExpanded && tradeAction === "SELL"
                      ? "bg-danger text-white border-danger font-extrabold shadow-md ring-2 ring-danger/30"
                      : "bg-surface2/80 hover:bg-surface2 border-border text-primary hover:border-danger/50"
                  }`}
                  title={isTradeExpanded && tradeAction === "SELL" ? "Click to collapse sell panel" : "Click to expand sell panel"}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isTradeExpanded && tradeAction === "SELL"
                          ? "bg-black/20 text-white"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="font-bold text-xs">Sell {vocab.unitLabel}</div>
                      <div
                        className={`text-[9px] font-mono ${
                          isTradeExpanded && tradeAction === "SELL"
                            ? "text-white/80 font-semibold"
                            : "text-muted"
                        }`}
                      >
                        Held: {sharesHeld.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono hidden sm:inline-block px-1.5 py-0.5 rounded ${
                        isTradeExpanded && tradeAction === "SELL"
                          ? "bg-black/20 text-white font-bold"
                          : "bg-surface text-primary font-semibold"
                      }`}
                    >
                      {sharesHeld.toLocaleString()} {vocab.unitAbbr}
                    </span>
                    {isTradeExpanded && tradeAction === "SELL" ? (
                      <ChevronUp className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </button>
              </div>

              {/* 📂 EXPANDED TRADING DRAWER (Opens when Buy or Sell is clicked) */}
              {isTradeExpanded && (
                <div className="p-4 rounded-xl bg-surface2/60 border border-border space-y-3.5 animate-in fade-in zoom-in-95 duration-150 shadow-inner">
                  {/* Top Drawer Controls: Character Selector & Status Lock */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted font-medium">Trading Character:</span>
                      {characters.length > 1 ? (
                        <select
                          value={selectedCharId || ""}
                          onChange={(e) => setSelectedCharId(Number(e.target.value))}
                          className="bg-surface border border-border rounded px-2 py-0.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-accent"
                        >
                          {characters.map((c) => (
                            <option key={c.charId} value={c.charId}>
                              {c.name} (Lv.{c.baseLevel}) - {formatZeny(c.zeny)} Z {c.online ? "[ONLINE]" : "[OFFLINE]"}
                            </option>
                          ))}
                        </select>
                      ) : activeChar ? (
                        <span className="text-xs font-mono font-bold text-primary">
                          {activeChar.name} (Lv.{activeChar.baseLevel})
                        </span>
                      ) : null}
                    </div>

                    {/* Online Lock Status Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                          isCharOffline
                            ? "bg-success/10 border-success/20 text-success"
                            : "bg-accent/15 border-accent/30 text-accent font-bold animate-pulse"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCharOffline ? "bg-success" : "bg-accent"
                          }`}
                        />
                        <span>{isCharOffline ? "Offline: Safe to Trade" : "Online: Trade Locked"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTradeExpanded(false)}
                        className="p-1 text-muted hover:text-primary rounded hover:bg-surface transition-colors"
                        title="Collapse Trade Console"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode Indicator Strip */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          tradeAction === "BUY" ? "bg-success" : "bg-danger"
                        }`}
                      />
                      <span>Market Order:</span>
                      <span
                        className={`font-mono font-extrabold uppercase ${
                          tradeAction === "BUY" ? "text-success" : "text-danger"
                        }`}
                      >
                        {tradeAction === "BUY" ? "BUY (ACQUIRE SHARES)" : "SELL (LIQUIDATE TO ZENY)"}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      Price: <strong className="text-primary">{formatZeny(quote.price)} Z</strong>
                    </span>
                  </div>

                  {/* Bi-directional Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Input: Shares */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted">
                        <label htmlFor="modalTradeShares">{vocab.unitLabel} Amount</label>
                        <span className="font-mono">
                          Held: <strong className="text-primary font-bold">{sharesHeld.toLocaleString()}</strong>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          ref={shareInputRef}
                          id="modalTradeShares"
                          type="number"
                          min="1"
                          value={sharesInput}
                          onChange={(e) => handleSharesChange(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-accent"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[9px] font-mono text-muted uppercase">
                          {vocab.unitAbbr}
                        </span>
                      </div>
                    </div>

                    {/* Input: Total Zeny */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted">
                        <label htmlFor="modalTradeZeny">
                          {tradeAction === "BUY" ? "Total Budget (Zeny)" : "Total Proceeds (Zeny)"}
                        </label>
                        <span className="font-mono">
                          Bal: <strong className="text-accent font-bold">{formatZeny(availableZeny)} Z</strong>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id="modalTradeZeny"
                          type="number"
                          min="0"
                          value={zenyInput}
                          onChange={(e) => handleZenyChange(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-accent"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[9px] font-mono text-muted">
                          ZENY
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SELL Payout Destination Selector */}
                  {tradeAction === "SELL" && (
                    <div className="p-2.5 rounded-lg bg-surface border border-border/80 space-y-1.5">
                      <div className="text-[10px] font-medium text-muted flex items-center justify-between">
                        <span>Payout Destination:</span>
                        <span className="font-mono text-[9px] text-accent font-semibold">
                          {tradeDestination === "BANK" ? "0% Bank Fee (Vault Wire)" : "Cash in Wallet"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTradeDestination("WALLET")}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            tradeDestination === "WALLET"
                              ? "bg-accent/15 border-accent text-accent font-bold shadow-sm"
                              : "bg-surface2/60 border-border text-muted hover:text-primary"
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Liquid Wallet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTradeDestination("BANK")}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            tradeDestination === "BANK"
                              ? "bg-accent/15 border-accent text-accent font-bold shadow-sm"
                              : "bg-surface2/60 border-border text-muted hover:text-primary"
                          }`}
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          <span>Bank Vault</span>
                        </button>
                      </div>
                      <div className="text-[9px] font-mono text-muted flex justify-between pt-0.5">
                        <span>Wallet Space: {formatZeny(Math.max(0, MAX_CHARACTER_ZENY - availableZeny))} Z</span>
                        <span>
                          Bank Space:{" "}
                          {formatZeny(
                            Math.max(
                              0,
                              (netWorth?.bank?.maxPrincipalLimit ?? 1900000000) -
                                ((netWorth?.bankPrincipal || 0) +
                                  (netWorth?.bankPendingInterest || 0))
                            )
                          )}{" "}
                          Z
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Chips */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[9px] font-mono text-muted uppercase">Presets:</span>
                    <button
                      type="button"
                      onClick={() => applyPercentage(0.25)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-border border border-border text-[10px] font-mono text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentage(0.50)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-border border border-border text-[10px] font-mono text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentage(0.75)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-border border border-border text-[10px] font-mono text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentage(1.00)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-border border border-border text-[10px] font-mono text-accent font-bold transition-colors cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>

                  {/* Feedback Alert */}
                  {tradeFeedback && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        tradeFeedback.type === "success"
                          ? "bg-success/15 border-success/30 text-success font-medium"
                          : "bg-danger/15 border-danger/30 text-danger font-medium"
                      }`}
                    >
                      {tradeFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                      )}
                      <span>{tradeFeedback.message}</span>
                    </div>
                  )}

                  {/* Summary & Submit Action */}
                  <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="text-[11px] font-mono text-muted w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          {parsedShares.toLocaleString()} {vocab.unitAbbr} × {formatZeny(quote.price)} Z ={" "}
                          <strong className="text-primary font-bold">{formatZeny(parsedTotalZeny)} Z</strong>
                        </span>
                        {parsedShares > 0 && (
                          <span className="text-[10px] text-accent/90 bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                            {tradeAction === "BUY" ? "+1% Fee: " : "-1% Fee: "}
                            {formatZeny(Math.max(1, Math.round(parsedTotalZeny * 0.01)))} Z (Total:{" "}
                            {formatZeny(
                              tradeAction === "BUY"
                                ? parsedTotalZeny + Math.max(1, Math.round(parsedTotalZeny * 0.01))
                                : Math.max(0, parsedTotalZeny - Math.max(1, Math.round(parsedTotalZeny * 0.01)))
                            )}{" "}
                            Z)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExecuteTrade}
                      disabled={isSubmittingTrade || !isCharOffline || parsedShares <= 0}
                      className={`w-full sm:w-auto px-5 py-2 rounded-lg font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        tradeAction === "BUY"
                          ? "bg-success hover:bg-emerald-400 text-black"
                          : "bg-danger hover:bg-rose-400 text-white"
                      }`}
                    >
                      {isSubmittingTrade ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing Trade...</span>
                        </>
                      ) : (
                        <span>
                          {tradeAction === "BUY" ? "Execute Market Buy" : "Execute Market Sell"}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive TradingView Candlestick Chart */}
          <CandlestickChart ticker={quote.ticker} splitCount={quote.splitCount ?? (quote as any).split_count} />

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
            {cryptoProfile?.utility && (
              <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[11px] font-medium text-accent">
                {cryptoProfile.utility}
              </span>
            )}
            {quote.splitCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[11px] font-mono text-muted">
                {quote.splitCount}x {vocab.splitLabel}
              </span>
            )}
          </div>

          {/* Lore & Whitepaper Profile */}
          <div className="p-3.5 rounded-lg bg-surface2/50 border border-border/60 text-muted leading-relaxed font-sans text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              {isCrypto ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  <span className="text-accent">{vocab.profileHeader}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-info" />
                  <span className="text-primary/80">{vocab.profileHeader}</span>
                </>
              )}
            </div>
            <p className="text-primary/90">
              {isCrypto
                ? cryptoProfile?.lore ||
                  quote.lore ||
                  "Decentralized autonomous protocol executing smart contracts across the Midgard Rune Network."
                : quote.lore ||
                  profile?.lore ||
                  "Municipal enterprise operating under royal trade jurisdiction with registered securities trading on the Midgard Stock Exchange."}
            </p>

            {/* Crypto Peg & Collateralization Box */}
            {isCrypto && cryptoProfile?.pegMechanism && (
              <div className="p-2 rounded bg-surface border border-accent/20 flex flex-col gap-1 text-[10px] font-mono mt-2">
                <div className="flex items-center justify-between text-muted">
                  <span className="flex items-center gap-1 text-accent font-bold">
                    <Layers className="w-3 h-3 text-accent" /> Peg & Stability Model
                  </span>
                  {cryptoProfile.pegTarget && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/10 text-accent border border-accent/20">
                      Target: {cryptoProfile.pegTarget}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-primary/80 font-sans">
                  {cryptoProfile.pegMechanism}
                </p>
              </div>
            )}
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

          {/* Real Historical News Dispatches */}
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
            <span>{vocab.tradeGuidance}</span>
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
