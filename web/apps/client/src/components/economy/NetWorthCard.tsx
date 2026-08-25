import React from "react";
import { NetWorthSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { Coins } from "lucide-react";

interface NetWorthCardProps {
  summary: NetWorthSummary;
  onSelectTab?: (tab: "HOLDINGS" | "BANK" | "BREAKDOWN") => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary, onSelectTab }) => {
  const {
    totalNetWorth,
    holdings = [],
  } = summary;

  return (
    <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      {/* Left: North Star Hero Metric */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Total Global Net Worth
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-primary flex items-baseline gap-1.5 mt-0.5">
            <span>{formatZeny(totalNetWorth)}</span>
            <span className="text-accent text-xs font-sans font-bold">Zeny</span>
          </div>
        </div>
      </div>

      {/* Right: Key High-Level Macro Summary */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0 shrink-0 text-[10px] font-mono">
        {/* Positions Counter */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("HOLDINGS")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2/40 hover:bg-surface2/80 border border-border/60 hover:border-info/50 transition-all cursor-pointer text-left"
          title="View Active Positions"
        >
          <Coins className="w-3.5 h-3.5 text-info shrink-0" />
          <div>
            <div className="text-[8px] text-muted font-bold uppercase font-sans">
              Positions
            </div>
            <div className="font-bold text-primary text-[11px]">
              {holdings.length} {holdings.length === 1 ? "Asset" : "Assets"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
