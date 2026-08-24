import React, { useState } from "react";
import { Package, Mail, Recycle, CheckSquare, Square, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { GachaStashItem, GachaTier } from "@rathena/shared";
import { api } from "../../lib/api";
import { getItemIconUrl } from "../../lib/assets";

interface GachaStashViewProps {
  items: GachaStashItem[];
  charId: number | null;
  onRefresh: () => void;
}

export const GachaStashView: React.FC<GachaStashViewProps> = ({
  items,
  charId,
  onRefresh,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [tierFilter, setTierFilter] = useState<"ALL" | GachaTier>("ALL");
  const [isMailing, setIsMailing] = useState(false);
  const [isScrapping, setIsScrapping] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredItems = items.filter((item) => {
    if (tierFilter === "ALL") return true;
    return item.tier === tierFilter;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectAllR = () => {
    const rIds = items.filter((i) => i.tier === "R").map((i) => i.id);
    setSelectedIds(new Set(rIds));
  };

  // 1. Send Selected Items to In-Game RO Mailbox
  const handleSendToMail = async () => {
    if (!charId) {
      setFeedback({ type: "error", text: "Please select an active character in the top cockpit bar first." });
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setFeedback({ type: "error", text: "Please select at least one item to dispatch." });
      return;
    }

    setIsMailing(true);
    setFeedback(null);
    try {
      const res = await api.post<{ success: boolean; mailedCount: number; error?: string }>(
        "/api/gacha/stash/claim",
        {
          charId,
          stashIds: ids,
        }
      );
      if (res.success) {
        setFeedback({
          type: "success",
          text: `📬 Dispatched ${res.mailedCount} items directly to your character's in-game RO Mailbox!`,
        });
        setSelectedIds(new Set());
        onRefresh();
      } else {
        throw new Error(res.error || "Failed to dispatch mail.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to dispatch mail." });
    } finally {
      setIsMailing(false);
    }
  };

  // 2. Dismantle Selected Items into Gacha Shards
  const handleScrapItems = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setFeedback({ type: "error", text: "Please select items to dismantle." });
      return;
    }

    setIsScrapping(true);
    setFeedback(null);
    try {
      const res = await api.post<{ success: boolean; shardsGained: number; totalShards: number; error?: string }>(
        "/api/gacha/stash/scrap",
        { stashIds: ids }
      );
      if (res.success) {
        setFeedback({
          type: "success",
          text: `💎 Dismantled ${ids.length} items for +${res.shardsGained} Gacha Shards! Total: ${res.totalShards} 💎`,
        });
        setSelectedIds(new Set());
        onRefresh();
      } else {
        throw new Error(res.error || "Failed to dismantle items.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to dismantle items." });
    } finally {
      setIsScrapping(false);
    }
  };

  return (
    <div className="bento-card p-4 flex flex-col flex-1 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="font-bold text-base text-primary flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            <span>My Web Gacha Stash ({items.length})</span>
          </h2>
          <p className="text-xs text-muted">
            Won items sit safely in your Web Stash. Dispatch to in-game RO Mail or dismantle for Gacha Shards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAllR}
            className="bg-surface2 hover:bg-surface2/80 text-primary border border-border px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Select All R (3★)
          </button>
          <button
            onClick={handleScrapItems}
            disabled={selectedIds.size === 0 || isScrapping}
            className="bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Recycle className={`w-3.5 h-3.5 ${isScrapping ? "animate-spin" : ""}`} />
            <span>Dismantle Selected ({selectedIds.size})</span>
          </button>
          <button
            onClick={handleSendToMail}
            disabled={selectedIds.size === 0 || isMailing}
            className="bg-success/20 hover:bg-success/30 text-success border border-success/30 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Mail className={`w-3.5 h-3.5 ${isMailing ? "animate-spin" : ""}`} />
            <span>Send to In-Game Mail ({selectedIds.size})</span>
          </button>
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

      {/* Filters & Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 bg-surface2/60 p-1 rounded-lg border border-border">
          {(["ALL", "SSR", "SR", "R"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                tierFilter === t
                  ? "bg-accent text-background"
                  : "text-muted hover:text-primary"
              }`}
            >
              {t} {t !== "ALL" && `(${items.filter((i) => i.tier === t).length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllFiltered}
            className="text-xs text-accent hover:underline font-semibold"
          >
            Select All Filtered ({filteredItems.length})
          </button>
          <span className="text-muted">•</span>
          <button
            onClick={clearSelection}
            className="text-xs text-muted hover:text-primary"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Stash Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-y-auto max-h-[55vh] pr-1">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted">
            No items in your Web Stash matching the selected filter. Pull on the Gacha Altar to collect items!
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isSSR = item.tier === "SSR";
            const isSR = item.tier === "SR";

            const badgeClass = isSSR
              ? "bg-amber-400 text-background font-black"
              : isSR
              ? "bg-purple-400 text-background font-bold"
              : "bg-sky-400/20 text-sky-300 font-semibold";

            const borderClass = isSelected
              ? "border-accent bg-accent/10 shadow-sm shadow-accent/10"
              : "border-border bg-surface2/60 hover:border-border/80";

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3 rounded-xl border ${borderClass} flex items-center justify-between gap-2.5 cursor-pointer transition-all`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-accent">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-muted/60" />
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border/50 shadow-inner">
                    <img
                      src={getItemIconUrl(item.nameId)}
                      alt={item.itemName}
                      className="ro-icon w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-primary truncate">
                      {item.itemName}
                      {item.refine > 0 && ` +${item.refine}`}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${badgeClass}`}>
                        {item.tier}
                      </span>
                      {item.amount > 1 && (
                        <span className="text-[10px] text-muted font-mono font-bold">
                          x{item.amount}
                        </span>
                      )}
                    </div>
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
