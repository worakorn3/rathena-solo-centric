import React, { useState } from "react";
import { Sparkles, Gem, CheckCircle, AlertTriangle, ShoppingCart, RefreshCw } from "lucide-react";
import { GachaShopItem } from "@rathena/shared";
import { api } from "../../lib/api";
import { getItemIconUrl } from "../../lib/assets";

interface GachaExchangeShopProps {
  items: GachaShopItem[];
  shardBalance: number;
  charId: number | null;
  onPurchaseSuccess: () => void;
}

export const GachaExchangeShop: React.FC<GachaExchangeShopProps> = ({
  items,
  shardBalance,
  charId,
  onPurchaseSuccess,
}) => {
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleBuy = async (item: GachaShopItem) => {
    if (!charId) {
      setFeedback({ type: "error", text: "Please select an active character in the top cockpit bar first." });
      return;
    }
    if (shardBalance < item.shardPrice) {
      setFeedback({
        type: "error",
        text: `Insufficient Gacha Shards! Needed: ${item.shardPrice} 💎, Available: ${shardBalance} 💎. Dismantle duplicate items from your Web Stash.`,
      });
      return;
    }

    setIsPurchasing(item.id);
    setFeedback(null);
    try {
      const res = await api.post<{ success: boolean; itemName: string; remainingShards: number; error?: string }>(
        "/api/gacha/shop/buy",
        {
          charId,
          shopItemId: item.id,
        }
      );

      if (res.success) {
        setFeedback({
          type: "success",
          text: `🎉 Successfully exchanged for ${res.itemName}! Dispatched directly to your character's in-game RO Mail.`,
        });
        onPurchaseSuccess();
      } else {
        throw new Error(res.error || "Purchase failed.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to complete exchange." });
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="bento-card p-4 flex flex-col flex-1 space-y-4">
      {/* Header & Balance */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="font-bold text-base text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Exclusives-Only Exchange Shop</span>
          </h2>
          <p className="text-xs text-muted">
            Spend Gacha Shards on prestigious vanity and high-tier progression items that cannot be rolled in regular gacha pools.
          </p>
        </div>

        <div className="bg-surface2 border border-purple-500/30 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
          <Gem className="w-4 h-4 text-purple-400" />
          <span>Balance: <span className="text-purple-300">{shardBalance}</span> 💎</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[60vh] pr-1">
        {items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted">
            No exclusive items currently available in the shop.
          </div>
        ) : (
          items.map((item) => {
            const canAfford = shardBalance >= item.shardPrice;
            const isBuyingThis = isPurchasing === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-surface2/50 border border-purple-500/20 hover:border-purple-500/50 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-400">
                      {item.shardPrice} 💎
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-purple-500/30 shadow-inner">
                      <img
                        src={getItemIconUrl(item.nameId)}
                        alt={item.itemName}
                        className="ro-icon w-7 h-7 object-contain drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-primary leading-tight line-clamp-2">
                        {item.itemName}
                        {item.refine > 0 && ` +${item.refine}`}
                      </div>
                      {item.amount > 1 && (
                        <div className="text-[10px] text-muted font-mono font-bold mt-0.5">
                          Amount: x{item.amount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || isBuyingThis}
                  className={`w-full font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    canAfford
                      ? "bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40"
                      : "bg-surface2 text-muted border border-border"
                  }`}
                >
                  {isBuyingThis ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Exchanging...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{canAfford ? "Exchange" : "Need More Shards"}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
