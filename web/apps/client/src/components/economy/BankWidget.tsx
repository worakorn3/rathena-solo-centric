import React from "react";
import { Landmark, Clock } from "lucide-react";
import { BankData } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface BankWidgetProps {
  bank: BankData;
}

export const BankWidget: React.FC<BankWidgetProps> = ({ bank }) => {
  const { principal, pendingInterest, daysAccrued, maxDays, totalPayout } =
    bank;

  const progressPct = maxDays > 0 ? (daysAccrued / maxDays) * 100 : 0;
  const isCapped = daysAccrued >= maxDays;

  return (
    <div className="bento-card p-3 flex flex-col justify-between shrink-0">
      <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5 shrink-0">
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-accent" /> Investment Bank
        </h3>
        <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
          +1%/day
        </span>
      </div>

      <div className="space-y-1.5 my-auto">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-1.5 rounded bg-surface2/30 border border-border/50">
            <div className="text-[8px] text-muted font-bold uppercase">
              Principal
            </div>
            <div className="text-xs font-bold font-mono text-primary truncate">
              {formatZeny(principal)} Z
            </div>
          </div>
          <div className="p-1.5 rounded bg-surface2/30 border border-border/50 text-right">
            <div className="text-[8px] text-muted font-bold uppercase">
              Interest
            </div>
            <div className="text-xs font-bold font-mono text-accent truncate">
              +{formatZeny(pendingInterest)} Z
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="p-1.5 rounded bg-surface2/20 border border-border/40 space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-info" /> Accrual
            </span>
            <span
              className={`font-bold ${isCapped ? "text-accent" : "text-primary"}`}
            >
              {daysAccrued}/{maxDays} Days
            </span>
          </div>
          <div className="w-full bg-surface2 rounded-full h-1 overflow-hidden">
            <div
              className={`h-1 rounded-full ${isCapped ? "bg-accent" : "bg-info"}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono pt-1.5 text-muted border-t border-border/50 shrink-0">
        <span className="text-[9px]">Total Payout:</span>
        <span className="font-bold text-primary">{formatZeny(totalPayout)} Z</span>
      </div>
    </div>
  );
};
