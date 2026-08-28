import React, { useState, useEffect, useRef } from "react";
import { NetWorthSummary, CharacterSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { Coins, TrendingUp, TrendingDown, Minus, Briefcase, Wallet, ChevronDown, ShieldCheck } from "lucide-react";

interface NetWorthCardProps {
  summary: NetWorthSummary;
  characters?: CharacterSummary[];
  onSelectTab?: (tab: "HOLDINGS" | "BANK" | "BREAKDOWN" | "HISTORY") => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary, characters = [], onSelectTab }) => {
  const {
    totalNetWorth,
    holdings = [],
    liquidZeny = 0,
  } = summary;

  const [isWalletsOpen, setIsWalletsOpen] = useState(false);
  const walletsRef = useRef<HTMLDivElement>(null);

  const safeHoldings = Array.isArray(holdings) ? holdings : [];
  const safeChars = Array.isArray(characters) ? characters : [];

  const calculatedLiquid =
    liquidZeny > 0
      ? liquidZeny
      : safeChars.reduce((sum, c) => sum + (c.zeny || 0), 0);

  const stockUnrealizedPnL =
    summary.stockUnrealizedPnL !== undefined
      ? summary.stockUnrealizedPnL
      : safeHoldings.reduce((sum, h) => sum + (h.unrealizedPnL || 0), 0);

  const stockTotalCost =
    summary.stockTotalCost !== undefined
      ? summary.stockTotalCost
      : safeHoldings.reduce((sum, h) => sum + (h.totalCost || 0), 0);

  const stockUnrealizedPnLPercent =
    summary.stockUnrealizedPnLPercent !== undefined
      ? summary.stockUnrealizedPnLPercent
      : stockTotalCost > 0
      ? Number(((stockUnrealizedPnL / stockTotalCost) * 100).toFixed(2))
      : 0;

  const isPositive = stockUnrealizedPnL > 0;
  const isNegative = stockUnrealizedPnL < 0;

  // Escape key & Click-Outside listeners for Wallets Popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isWalletsOpen) {
        setIsWalletsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (walletsRef.current && !walletsRef.current.contains(e.target as Node)) {
        setIsWalletsOpen(false);
      }
    };
    if (isWalletsOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isWalletsOpen]);

  return (
    <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative overflow-visible">
      {/* Left: North Star Hero Metric with Option B Inline Total P/L */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Total Global Net Worth
            </span>
            {safeHoldings.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all ${
                  isPositive
                    ? "bg-success/15 border-success/30 text-success"
                    : isNegative
                    ? "bg-danger/15 border-danger/30 text-danger"
                    : "bg-surface2 border-border text-muted"
                }`}
                title={`Portfolio Unrealized Return: ${isPositive ? "+" : ""}${formatZeny(stockUnrealizedPnL)} Z (${isPositive ? "+" : ""}${stockUnrealizedPnLPercent.toFixed(2)}%)`}
              >
                {isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : isNegative ? (
                  <TrendingDown className="w-2.5 h-2.5" />
                ) : (
                  <Minus className="w-2.5 h-2.5" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {stockUnrealizedPnLPercent.toFixed(1)}% P/L
                </span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5 mt-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-primary flex items-baseline gap-1">
              <span>{formatZeny(totalNetWorth)}</span>
              <span className="text-accent text-xs font-sans font-bold">Zeny</span>
            </div>
            {safeHoldings.length > 0 && (
              <div
                className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-1 ${
                  isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted"
                }`}
              >
                <span>
                  ({isPositive ? "+" : ""}
                  {formatZeny(stockUnrealizedPnL)} Z)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Key High-Level Macro Summary */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0 shrink-0 text-[10px] font-mono relative">
        
        {/* Multi-Character Liquid Wallets Popover */}
        {safeChars.length > 0 && (
          <div className="relative" ref={walletsRef}>
            <button
              type="button"
              onClick={() => setIsWalletsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2/60 hover:bg-surface2 border border-border/80 hover:border-accent/60 text-primary transition-all cursor-pointer text-left group"
              title="Inspect Liquid Zeny balance across all characters"
              aria-expanded={isWalletsOpen}
              aria-label="Toggle character wallets popover"
            >
              <div className="w-6 h-6 rounded-md bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
                <Wallet className="w-3.5 h-3.5 text-accent" />
              </div>
              <div>
                <div className="text-[8px] text-muted font-bold uppercase font-sans flex items-center gap-1">
                  <span>Wallets</span>
                  <span className="text-accent font-mono font-bold">({safeChars.length})</span>
                </div>
                <div className="font-bold text-accent text-[11px]">
                  {formatZeny(calculatedLiquid)} Z
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted group-hover:text-accent transition-transform ml-0.5 ${
                  isWalletsOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </button>

            {/* Floating Popover Container */}
            {isWalletsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bento-card bg-surface p-3 shadow-2xl border-accent/40 rounded-xl flex flex-col gap-2.5 z-50 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Wallet className="w-4 h-4 text-accent" />
                    <span>Character Liquid Wallets</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
                    {safeChars.length} {safeChars.length === 1 ? "Hero" : "Heroes"} on Account
                  </span>
                </div>

                {/* Total Liquid Header Summary */}
                <div className="p-2 rounded-lg bg-surface2/40 border border-border/60 flex items-center justify-between font-mono">
                  <span className="text-[10px] text-muted font-sans font-medium">Total Liquid Pool:</span>
                  <span className="text-xs font-bold text-accent">{formatZeny(calculatedLiquid)} Z</span>
                </div>

                {/* Characters List Container (Scrollable up to 15 heroes) */}
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {safeChars.map((char, index) => {
                    const charZeny = Number(char.zeny) || 0;
                    const pct = calculatedLiquid > 0 ? ((charZeny / calculatedLiquid) * 100).toFixed(1) : "0";
                    const isOnline = Boolean(char.online);

                    return (
                      <div
                        key={char.charId || index}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface2/30 border border-border/40 hover:bg-surface2/60 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center font-bold text-[10px] text-accent font-mono">
                              {char.charNum !== undefined ? char.charNum + 1 : index + 1}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface ${
                                isOnline ? "bg-success shadow-[0_0_4px_#4ade80]" : "bg-muted"
                              }`}
                              title={isOnline ? "Online In-Game" : "Offline"}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-primary truncate">{char.name}</div>
                            <div className="text-[9px] font-mono text-muted truncate">
                              Lv.{char.baseLevel} {char.className} {char.lastMap ? `• ${char.lastMap}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <div className="font-bold text-xs text-accent">{formatZeny(charZeny)} Z</div>
                          <div className="text-[9px] text-muted">{pct}% share</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Popover Footer */}
                <div className="pt-1.5 border-t border-border flex items-center justify-between text-[9px] text-muted font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWalletsOpen(false);
                      if (onSelectTab) onSelectTab("BANK");
                    }}
                    className="flex items-center gap-1 text-info hover:text-info/80 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Deposit to Vault (1%/d)</span>
                  </button>
                  <span className="text-accent font-semibold">ESC to close</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Positions Counter */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("HOLDINGS")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2/40 hover:bg-surface2/80 border border-border/60 hover:border-info/50 transition-all cursor-pointer text-left"
          title="View Active Positions"
        >
          <Briefcase className="w-3.5 h-3.5 text-info shrink-0" />
          <div>
            <div className="text-[8px] text-muted font-bold uppercase font-sans">
              Positions
            </div>
            <div className="font-bold text-primary text-[11px]">
              {safeHoldings.length} {safeHoldings.length === 1 ? "Asset" : "Assets"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
