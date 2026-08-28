import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  Coins,
  RefreshCw,
  Landmark,
  Wallet,
  Zap,
  Filter,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { StockTransaction, StockTransactionAction, isCryptoAsset } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";

interface StockTransactionHistoryProps {
  tickerFilter?: string;
  className?: string;
}

export const StockTransactionHistory: React.FC<StockTransactionHistoryProps> = ({
  tickerFilter,
  className = "",
}) => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [selectedAssetClass, setSelectedAssetClass] = useState<"ALL" | "EQUITY" | "CRYPTO">("ALL");
  const [selectedAction, setSelectedAction] = useState<"ALL" | StockTransactionAction>("ALL");

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/economy/transactions?limit=50";
      if (tickerFilter) {
        url += `&ticker=${encodeURIComponent(tickerFilter)}`;
      }
      if (selectedAssetClass !== "ALL") {
        url += `&assetType=${selectedAssetClass}`;
      }
      if (selectedAction !== "ALL") {
        url += `&action=${selectedAction}`;
      }

      const res = await api.get<{ success: boolean; transactions: StockTransaction[] }>(url);
      if (res.success && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transaction logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tickerFilter, selectedAssetClass, selectedAction]);

  const handleRefreshClick = async () => {
    setSpinning(true);
    try {
      await fetchTransactions();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getActionBadge = (action: StockTransactionAction) => {
    switch (action) {
      case "BUY":
        return {
          label: "BUY",
          icon: ArrowUpRight,
          bg: "bg-success/15",
          text: "text-success",
          border: "border-success/30",
        };
      case "SELL":
        return {
          label: "SELL",
          icon: ArrowDownRight,
          bg: "bg-danger/15",
          text: "text-danger",
          border: "border-danger/30",
        };
      case "DIVIDEND":
        return {
          label: "DIV",
          icon: Coins,
          bg: "bg-info/15",
          text: "text-info",
          border: "border-info/30",
        };
      case "DRIP_BUY":
        return {
          label: "DRIP",
          icon: Sparkles,
          bg: "bg-purple-500/15",
          text: "text-purple-400",
          border: "border-purple-500/30",
        };
      default:
        return {
          label: action,
          icon: History,
          bg: "bg-surface2",
          text: "text-muted",
          border: "border-border",
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const isFilterActive = selectedAssetClass !== "ALL" || selectedAction !== "ALL";

  return (
    <div className={`bento-card p-3 sm:p-3.5 flex flex-col ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent shrink-0" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary truncate">
            {tickerFilter ? `${tickerFilter} Ledger` : "Order Ledger"}
          </h3>
          <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
            {transactions.length} Records
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isLoading || spinning}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface2/60 hover:bg-surface2 text-muted hover:text-primary text-[10px] font-medium border border-border transition-all cursor-pointer disabled:opacity-50"
            title="Refresh transaction logs"
          >
            <RefreshCw className={`w-3 h-3 text-accent transition-transform ${isLoading || spinning ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Dual Compact Bento Dropdowns */}
      {!tickerFilter && (
        <div className="flex items-center gap-2 mb-2.5 text-xs">
          <div className="flex items-center gap-1 text-muted shrink-0" title="Filter ledger transactions">
            <Filter className="w-3.5 h-3.5 text-muted/70" />
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
            {/* Asset Class Select */}
            <div className="relative">
              <select
                value={selectedAssetClass}
                onChange={(e) => setSelectedAssetClass(e.target.value as any)}
                className="w-full bg-surface2/70 hover:bg-surface2 border border-border focus:border-accent rounded-lg px-2.5 py-1 text-[11px] text-primary outline-none transition-colors cursor-pointer appearance-none pr-6 font-medium"
              >
                <option value="ALL">All Assets</option>
                <option value="EQUITY">Municipal Equities</option>
                <option value="CRYPTO">Crypto Protocols</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Action Type Select */}
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="w-full bg-surface2/70 hover:bg-surface2 border border-border focus:border-accent rounded-lg px-2.5 py-1 text-[11px] text-primary outline-none transition-colors cursor-pointer appearance-none pr-6 font-medium"
              >
                <option value="ALL">All Actions</option>
                <option value="BUY">Buy Orders</option>
                <option value="SELL">Sell Orders</option>
                <option value="DIVIDEND">Dividends</option>
                <option value="DRIP_BUY">DRIP Reinvestment</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSelectedAssetClass("ALL");
                setSelectedAction("ALL");
              }}
              className="px-2 py-1 rounded-lg bg-surface2 hover:bg-surface text-[10px] font-mono text-accent hover:text-accent/80 border border-border transition-colors cursor-pointer shrink-0"
              title="Reset Filters to Default"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Transactions List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
        {isLoading && transactions.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-accent" />
            <span>Loading transaction ledger...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs border border-dashed border-border rounded-lg bg-surface2/20">
            <History className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="font-medium text-primary">No transactions recorded yet</p>
            <p className="text-[11px] text-muted mt-0.5">
              {isFilterActive
                ? "No records match the selected filters. Try resetting the filters above."
                : "Orders placed on the Web Terminal or In-Game Broker will appear here automatically."}
            </p>
          </div>
        ) : (
          transactions.map((tx) => {
            const badge = getActionBadge(tx.action);
            const Icon = badge.icon;
            const isCrypto = tx.assetType === "CRYPTO";

            return (
              <div
                key={tx.id}
                className="p-2.5 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-border/80 hover:border-accent/30 transition-all flex flex-col gap-1.5"
              >
                {/* Top Row: Action Badge + Ticker + Crypto Tag + Stock Name (Left) & Total Amount Zeny (Right) */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div
                      className={`w-12 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text} shrink-0 text-[9.5px] font-bold text-center flex items-center justify-center gap-0.5`}
                    >
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span>{badge.label}</span>
                    </div>

                    <span className="font-bold font-mono text-primary text-xs shrink-0">{tx.ticker}</span>

                    {isCrypto && (
                      <span className="px-1 py-0.2 rounded bg-amber-400/10 text-amber-400 text-[8.5px] font-mono font-bold border border-amber-400/20 shrink-0">
                        CRYPTO
                      </span>
                    )}

                    <span className="text-[11px] text-muted truncate">
                      {tx.stockName}
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold font-mono text-xs ${
                        tx.action === "SELL" || tx.action === "DIVIDEND"
                          ? "text-success"
                          : tx.action === "DRIP_BUY"
                          ? "text-purple-400"
                          : "text-primary"
                      }`}
                    >
                      {tx.action === "SELL" || tx.action === "DIVIDEND" ? "+" : "-"}
                      {formatZeny(tx.totalAmount)} Z
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Metadata (Timestamp, Char, Destination) & (Units @ Price, Fee) */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-muted font-mono pt-1 border-t border-border/30">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{formatDate(tx.createdAt)}</span>
                    {tx.charName && (
                      <>
                        <span className="text-muted/40">•</span>
                        <span className="text-muted/90 truncate">{tx.charName}</span>
                      </>
                    )}
                    {tx.destination && (
                      <>
                        <span className="text-muted/40">•</span>
                        <span className="flex items-center gap-0.5 text-muted shrink-0">
                          {tx.destination === "BANK" ? (
                            <>
                              <Landmark className="w-2.5 h-2.5 text-info" /> Bank
                            </>
                          ) : (
                            <>
                              <Wallet className="w-2.5 h-2.5 text-accent" /> Wallet
                            </>
                          )}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-1">
                    {tx.shares > 0 && (
                      <span>
                        {tx.shares.toLocaleString()} {tx.shares === 1 ? "unit" : "units"} @ {formatZeny(tx.price)} Z
                      </span>
                    )}
                    {tx.fee > 0 && (
                      <span className="text-danger/80 text-[9px]">
                        (Fee: {formatZeny(tx.fee)} Z)
                      </span>
                    )}
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
