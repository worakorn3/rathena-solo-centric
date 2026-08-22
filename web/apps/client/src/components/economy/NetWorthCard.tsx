import React from "react";
import { NetWorthSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { Coins } from "lucide-react";

interface NetWorthCardProps {
  summary: NetWorthSummary;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary }) => {
  const { totalNetWorth, liquidZeny, bankTotal, stockMarketValue } = summary;

  const total = Math.max(1, totalNetWorth);
  const liquidPct = ((liquidZeny / total) * 100).toFixed(1);
  const bankPct = ((bankTotal / total) * 100).toFixed(1);
  const stockPct = ((stockMarketValue / total) * 100).toFixed(1);

  // Daily bank interest projection: 0.5% per day
  const dailyBankYield = Math.floor(bankTotal * 0.005);

  return (
    <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
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

      {/* Center: 3 Asset Breakdown Metrics */}
      <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-4 md:gap-6 border-t md:border-t-0 border-border/60 pt-2.5 md:pt-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent shrink-0" />
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[9px] text-muted font-bold uppercase truncate">Liquid Cash</div>
            <div className="font-mono text-[11px] sm:text-xs font-bold text-primary truncate">
              {formatZeny(liquidZeny)} Z{" "}
              <span className="text-muted text-[9px] sm:text-[10px]">({liquidPct}%)</span>
            </div>
          </div>
        </div>

        <div className="border-l border-border pl-2 sm:pl-4 md:pl-5 flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-info shrink-0" />
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[9px] text-muted font-bold uppercase truncate">Bank</div>
            <div className="font-mono text-[11px] sm:text-xs font-bold text-primary truncate">
              {formatZeny(bankTotal)} Z{" "}
              <span className="text-muted text-[9px] sm:text-[10px]">({bankPct}%)</span>
            </div>
          </div>
        </div>

        <div className="border-l border-border pl-2 sm:pl-4 md:pl-5 flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-success shrink-0" />
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[9px] text-muted font-bold uppercase truncate">Stocks</div>
            <div className="font-mono text-[11px] sm:text-xs font-bold text-success truncate">
              +{formatZeny(stockMarketValue)} Z{" "}
              <span className="text-muted text-[9px] sm:text-[10px]">({stockPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Visual Asset Distribution Bar */}
      <div className="w-44 hidden lg:flex flex-col gap-1.5">
        <div className="flex justify-between text-[9px] text-muted font-mono font-medium">
          <span>Asset Spread</span>
          <span className="text-accent font-bold">3 Accounts</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface2">
          <div
            className="bg-accent h-full"
            style={{ width: `${Math.max(2, parseFloat(liquidPct))}%` }}
            title={`Liquid Cash: ${liquidPct}%`}
          />
          <div
            className="bg-info h-full"
            style={{ width: `${Math.max(2, parseFloat(bankPct))}%` }}
            title={`Investment Bank: ${bankPct}%`}
          />
          <div
            className="bg-success h-full"
            style={{ width: `${Math.max(2, parseFloat(stockPct))}%` }}
            title={`Stock Market: ${stockPct}%`}
          />
        </div>
      </div>
    </div>
  );
};
