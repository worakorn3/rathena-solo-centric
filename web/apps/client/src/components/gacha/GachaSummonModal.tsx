import React, { useEffect } from "react";
import { Sparkles, X, CheckCircle, Recycle } from "lucide-react";
import { GachaRewardItem } from "@rathena/shared";
import { getItemIconUrl } from "../../lib/assets";

interface GachaSummonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GachaRewardItem[];
  onScrapR?: () => void;
  isScrappingR?: boolean;
}

export const GachaSummonModal: React.FC<GachaSummonModalProps> = ({
  isOpen,
  onClose,
  items,
  onScrapR,
  isScrappingR = false,
}) => {
  // Modal Ergonomics: Escape key dismiss listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  const hasSSR = items.some((i) => i.tier === "SSR");
  const hasSR = items.some((i) => i.tier === "SR");
  const rCount = items.filter((i) => i.tier === "R").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-2 border-accent/40 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Rarity Explosion Beam */}
        <div
          className={`absolute inset-0 pointer-events-none flex items-center justify-center ${
            hasSSR ? "opacity-100" : hasSR ? "opacity-70" : "opacity-0"
          }`}
        >
          <div
            className={`w-96 h-96 rounded-full blur-3xl animate-beam-burst ${
              hasSSR
                ? "bg-gradient-to-r from-amber-400/40 via-amber-300/30 to-purple-500/30"
                : "bg-gradient-to-r from-purple-500/30 via-purple-400/20 to-sky-400/20"
            }`}
          />
        </div>

        {/* Modal Header */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Summon Results</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary p-1.5 rounded hover:bg-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cards Grid Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 z-10">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {items.map((item, idx) => {
              const isSSR = item.tier === "SSR";
              const isSR = item.tier === "SR";

              const borderClass = isSSR
                ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
                : isSR
                ? "border-purple-400 bg-purple-400/10 shadow-md shadow-purple-500/10"
                : "border-border bg-surface2/60";

              const badgeClass = isSSR
                ? "bg-amber-400 text-background font-black"
                : isSR
                ? "bg-purple-400 text-background font-bold"
                : "bg-sky-400/20 text-sky-300 font-semibold";

              return (
                <div
                  key={idx}
                  style={{ animationDelay: `${idx * 75}ms` }}
                  className={`p-3 rounded-xl border ${borderClass} flex flex-col items-center justify-center text-center gap-1.5 animate-card-flip transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${badgeClass}`}>
                      {item.tier}
                    </span>
                    {item.refine > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                        +{item.refine}
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center my-1 shrink-0 border border-border/50 shadow-inner">
                    <img
                      src={getItemIconUrl(item.nameId)}
                      alt={item.itemName}
                      className="ro-icon w-8 h-8 object-contain drop-shadow"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>

                  <div className="font-bold text-xs text-primary line-clamp-2 px-1">
                    {item.itemName}
                  </div>

                  {item.amount > 1 && (
                    <div className="text-[10px] text-muted font-mono font-bold">
                      x{item.amount}
                    </div>
                  )}

                  {item.isSpotlight && (
                    <span className="text-[8px] font-mono font-extrabold uppercase px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Spotlight
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-surface2 border-t border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <div className="text-xs text-muted font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>
              All items deposited into your <strong>Web Stash</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onScrapR && rCount > 0 && (
              <button
                onClick={onScrapR}
                disabled={isScrappingR}
                className="bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Recycle className={`w-3.5 h-3.5 ${isScrappingR ? "animate-spin" : ""}`} />
                <span>{isScrappingR ? "Dismantling..." : `Dismantle R Items (${rCount})`}</span>
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isScrappingR}
              className="bg-accent hover:bg-accent/90 text-background font-bold text-xs py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Collect to Stash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
