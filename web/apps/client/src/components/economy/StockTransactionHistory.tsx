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
          label: "DIVIDEND",
          icon: Coins,
          bg: "bg-info/15",
          text: "text-info",
          border: "border-info/30",
        };
      case "DRIP_BUY":
        return {
          label: "DRIP REINVEST",
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

  return (
    <div className={`bento-card p-3 sm:p-3.5 flex flex-col ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent shrink-0" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary truncate">
            {tickerFilter ? `${tickerFilter} Transaction History` : "Stock & Crypto Order Ledger"}
          </h3>
          <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded border border-border">
            {transactions.length} Records
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded bg-surface2 hover:bg-surface2/80 text-muted hover:text-primary text-[10px] font-medium border border-border transition-colors cursor-pointer"
            title="Refresh transaction logs"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-accent" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      {!tickerFilter && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[10px]">
          {/* Asset Class Filter */}
          <div className="flex items-center bg-surface2/60 p-0.5 rounded-lg border border-border">
            {(["ALL", "EQUITY", "CRYPTO"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedAssetClass(tab)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  selectedAssetClass === tab
                    ? "bg-accent text-black font-bold shadow-xs"
                    : "text-muted hover:text-primary"
                }`}
              >
                {tab === "ALL" ? "All Assets" : tab === "EQUITY" ? "Stocks" : "Crypto"}
              </button>
            ))}
          </div>

          {/* Action Filter */}
          <div className="flex items-center bg-surface2/60 p-0.5 rounded-lg border border-border">
            {(["ALL", "BUY", "SELL", "DIVIDEND", "DRIP_BUY"] as const).map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => setSelectedAction(act)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  selectedAction === act
                    ? "bg-primary text-black font-bold shadow-xs"
                    : "text-muted hover:text-primary"
                }`}
              >
                {act === "ALL"
                  ? "All Actions"
                  : act === "DRIP_BUY"
                  ? "DRIP"
                  : act}
              </button>
            ))}
          </div>
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
              Orders placed on the Web Terminal or In-Game Broker will appear here automatically.
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
                className="flex items-center justify-between p-2 rounded-lg bg-surface2/60 border border-border/80 hover:border-border transition-colors text-xs"
              >
                {/* Left: Action Badge + Ticker Info */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text} shrink-0 text-[10px] font-bold`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-primary">{tx.ticker}</span>
                      {isCrypto && (
                        <span className="px-1 py-0.2 rounded bg-amber-400/10 text-amber-400 text-[9px] font-mono border border-amber-400/20">
                          CRYPTO
                        </span>
                      )}
                      <span className="text-[11px] text-muted truncate hidden sm:inline">
                        {tx.stockName}
                      </span>
                    </div>

                    <div className="text-[10px] text-muted flex items-center gap-2 font-mono mt-0.5">
                      <span>{formatDate(tx.createdAt)}</span>
                      {tx.charName && (
                        <>
                          <span>•</span>
                          <span className="text-muted/80">{tx.charName}</span>
                        </>
                      )}
                      {tx.destination && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-muted">
                            {tx.destination === "BANK" ? (
                              <>
                                <Landmark className="w-2.5 h-2.5 text-info" /> Bank
                              </>
                            ) : (
                              <>
                                <Wallet className="w-2.5 h-2.5" /> Wallet
                              </>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity, Price & Total Amount */}
                <div className="text-right shrink-0 pl-2">
                  <div className="font-bold font-mono text-primary text-xs">
                    {tx.action === "SELL" || tx.action === "DIVIDEND" ? "+" : "-"}
                    {formatZeny(tx.totalAmount)} Z
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    {tx.shares > 0 && (
                      <span>
                        {tx.shares.toLocaleString()} {tx.shares === 1 ? "unit" : "units"} @ {formatZeny(tx.price)} Z
                      </span>
                    )}
                    {tx.fee > 0 && (
                      <span className="text-danger/80 ml-1.5">
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
