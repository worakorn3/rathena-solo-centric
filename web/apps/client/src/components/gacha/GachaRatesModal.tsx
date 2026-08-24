import React, { useState, useEffect } from "react";
import { Info, X, ShieldCheck, Sparkles, ListFilter, Search } from "lucide-react";
import { GachaBanner, GachaTier } from "@rathena/shared";
import { getItemIconUrl } from "../../lib/assets";

interface GachaRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: GachaBanner | null;
}

export const GachaRatesModal: React.FC<GachaRatesModalProps> = ({
  isOpen,
  onClose,
  banner,
}) => {
  const [activeView, setActiveView] = useState<"rules" | "roster">("roster");
  const [tierFilter, setTierFilter] = useState<"ALL" | GachaTier>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !banner) return null;

  const roster = banner.roster || [];
  const filteredRoster = roster.filter((item) => {
    if (tierFilter !== "ALL" && item.tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(q) ||
        String(item.nameId).includes(q)
      );
    }
    return true;
  });

  const ssrCount = roster.filter((r) => r.tier === "SSR").length;
  const srCount = roster.filter((r) => r.tier === "SR").length;
  const rCount = roster.filter((r) => r.tier === "R").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <Info className="w-4 h-4 text-accent" />
            <span>Drop Rates & Pool Roster ({banner.name})</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary p-1 rounded hover:bg-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveView("roster")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === "roster"
                  ? "bg-accent text-background shadow-xs"
                  : "bg-surface2 text-muted hover:text-primary"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Full Drop Roster ({roster.length})</span>
            </button>
            <button
              onClick={() => setActiveView("rules")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === "rules"
                  ? "bg-accent text-background shadow-xs"
                  : "bg-surface2 text-muted hover:text-primary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pity & Rules Summary</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-muted hidden sm:block">
            SSR: <strong className="text-amber-400">{banner.ssrRate}%</strong> | SR: <strong className="text-purple-400">{banner.srRate}%</strong> | R: <strong className="text-sky-400">{banner.rRate}%</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-muted flex-1">
          {activeView === "rules" ? (
            <>
              {/* Rules Card */}
              <div className="p-3.5 rounded-xl bg-surface2/60 border border-border space-y-2">
                <div className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Pity & Guarantee Rules</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>10-Pull Guarantee:</strong> Every 10-pull guarantees at least one SR (4★) or higher item on the 10th summon.
                </p>
                <p className="leading-relaxed">
                  • <strong>Pity Threshold ({banner.pityThreshold} pulls):</strong> Guaranteed SSR (5★) drop upon reaching {banner.pityThreshold} non-SSR summons. Pity resets to 0 immediately upon rolling an SSR.
                </p>
                <p className="leading-relaxed">
                  • <strong>50% Spotlight Rate-Up:</strong> Daily featured SSR and SR items receive 50% of their respective tier's total probability share.
                </p>
              </div>

              {/* Probabilities Grid */}
              <div>
                <div className="font-bold text-primary mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Tier Probabilities ({banner.name})</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold">
                    <div className="text-[11px] uppercase tracking-wider">SSR (5★)</div>
                    <div className="text-base font-extrabold mt-1">{banner.ssrRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted mt-0.5">{ssrCount} items</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 font-bold">
                    <div className="text-[11px] uppercase tracking-wider">SR (4★)</div>
                    <div className="text-base font-extrabold mt-1">{banner.srRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted mt-0.5">{srCount} items</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-400/10 border border-sky-400/20 text-sky-400 font-bold">
                    <div className="text-[11px] uppercase tracking-wider">R (3★)</div>
                    <div className="text-base font-extrabold mt-1">{banner.rRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted mt-0.5">{rCount} items</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ROSTER & INDIVIDUAL RATE % VIEW */
            <div className="space-y-3">
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface2/40 p-2 rounded-xl border border-border">
                {/* Tier Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1">
                  {(["ALL", "SSR", "SR", "R"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        tierFilter === t
                          ? t === "SSR"
                            ? "bg-amber-400 text-background font-black"
                            : t === "SR"
                            ? "bg-purple-400 text-background font-black"
                            : t === "R"
                            ? "bg-sky-400 text-background font-black"
                            : "bg-primary text-background"
                          : "bg-surface text-muted hover:text-primary border border-border/60"
                      }`}
                    >
                      {t === "ALL" ? `All (${roster.length})` : t === "SSR" ? `SSR (${ssrCount})` : t === "SR" ? `SR (${srCount})` : `R (${rCount})`}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search item / ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg pl-8 pr-2.5 py-1 text-xs text-primary placeholder:text-muted/60 focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Roster Items Table */}
              <div className="rounded-xl border border-border overflow-hidden bg-surface">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-surface2 text-muted font-mono uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Tier</th>
                      <th className="p-2.5 text-center">Amount</th>
                      <th className="p-2.5 text-right font-bold text-accent">Drop Rate %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-xs">
                    {filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted font-sans">
                          No items match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((item) => {
                        const isSSR = item.tier === "SSR";
                        const isSR = item.tier === "SR";
                        const badgeClass = isSSR
                          ? "bg-amber-400 text-background font-black"
                          : isSR
                          ? "bg-purple-400 text-background font-black"
                          : "bg-sky-400/20 text-sky-300 font-semibold";

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-surface2/60 transition-colors ${
                              item.isSpotlight ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <td className="p-2.5 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center shrink-0 border border-border/60 shadow-inner">
                                <img
                                  src={getItemIconUrl(item.nameId)}
                                  alt={item.itemName}
                                  className="ro-icon w-6 h-6 object-contain drop-shadow"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold font-sans text-xs text-primary truncate flex items-center gap-1.5">
                                  <span>{item.itemName}</span>
                                  {item.refine > 0 && (
                                    <span className="text-[10px] text-accent font-mono font-bold">
                                      +{item.refine}
                                    </span>
                                  )}
                                  {item.isSpotlight && (
                                    <span className="text-[8px] font-mono font-extrabold uppercase px-1 py-0.2 rounded bg-amber-400 text-background flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                                      Spotlight
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted font-mono">#{item.nameId}</div>
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${badgeClass}`}>
                                {item.tier}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-muted">
                              x{item.amount}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              <span
                                className={
                                  item.isSpotlight
                                    ? "text-amber-400 font-extrabold"
                                    : isSSR
                                    ? "text-amber-300 font-bold"
                                    : isSR
                                    ? "text-purple-300 font-bold"
                                    : "text-primary"
                                }
                              >
                                {item.dropRatePct.toFixed(3)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-surface2 border-t border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted shrink-0">
          <span>Current Banner Pity: <strong className="text-accent font-mono">{banner.currentPity} / {banner.pityThreshold}</strong></span>
          <button
            onClick={onClose}
            className="bg-surface hover:bg-surface2 text-primary border border-border px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
