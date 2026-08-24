import React from "react";
import { NetWorthSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { Coins, TrendingUp, Landmark } from "lucide-react";

interface NetWorthCardProps {
  summary: NetWorthSummary;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary }) => {
  const {
    totalNetWorth,
    bankTotal,
    holdings = [],
  } = summary;

  // Daily bank interest projection: 1.0% per day (Bank rate)
  const dailyBankYield = Math.floor(bankTotal * 0.01);

  return (
    <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      {/* Left: North Star Hero Metric */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span>Total Global Net Worth</span>
            {dailyBankYield > 0 && (
              <span className="text-success text-[9px] sm:text-[10px] font-mono font-bold bg-success/10 px-1.5 py-0.2 rounded border border-success/20">
                +{formatZeny(dailyBankYield)} Z/day (Bank)
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-primary flex items-baseline gap-1.5 mt-0.5">
            <span>{formatZeny(totalNetWorth)}</span>
            <span className="text-accent text-xs font-sans font-bold">Zeny</span>
          </div>
        </div>
      </div>

      {/* Right: Key High-Level Macro Summary (Non-duplicated) */}
      <div className="flex items-center gap-2 sm:gap-3 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0 shrink-0 text-[10px] font-mono">
        {/* Daily Yield Pill */}
        {dailyBankYield > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
            <div>
              <div className="text-[8px] text-success/80 font-bold uppercase font-sans">
                Daily Accrual
              </div>
              <div className="font-bold text-success text-[11px]">
                +{formatZeny(dailyBankYield)} Z
              </div>
            </div>
          </div>
        )}

        {/* Positions Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface2/40 border border-border/60">
          <Landmark className="w-3.5 h-3.5 text-info shrink-0" />
          <div>
            <div className="text-[8px] text-muted font-bold uppercase font-sans">
              Portfolio
            </div>
            <div className="font-bold text-primary text-[11px]">
              {holdings.length} {holdings.length === 1 ? "Position" : "Positions"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
