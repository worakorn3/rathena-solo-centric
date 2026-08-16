import React from "react";
import { Landmark, Clock, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { BankData } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface BankWidgetProps {
  bank: BankData;
}

export const BankWidget: React.FC<BankWidgetProps> = ({ bank }) => {
  const {
    principal,
    pendingInterest,
    daysAccrued,
    maxDays,
    totalPayout,
    lastDepositDate,
  } = bank;

  const progressPct = maxDays > 0 ? (daysAccrued / maxDays) * 100 : 0;
  const isCapped = daysAccrued >= maxDays;

  return (
    <div className="ro-window flex flex-col h-full">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <Landmark size={14} className="text-sky-300" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Solo Investment Bank
          </span>
        </div>
        <span className="text-[10px] text-sky-200/70 font-mono flex items-center gap-1">
          <MapPin size={10} />
          Prontera (165, 180)
        </span>
      </div>

      <div className="p-3.5 space-y-3.5 bg-[#1a2332]/90 flex-1 flex flex-col justify-between">
        {/* Top: Balance Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Deposited Principal</span>
            <span className="text-base font-bold font-mono text-slate-100">
              {formatZeny(principal)} <span className="text-xs text-slate-400 font-sans">Z</span>
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Sparkles size={12} />
              Accrued Interest ({daysAccrued}%)
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              +{formatZeny(pendingInterest)} <span className="text-xs text-emerald-500 font-sans">Z</span>
            </span>
          </div>

          <div className="pt-2 border-t border-ro-borderLight/20 flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              Total Available
            </span>
            <span className="text-lg font-black font-mono text-ro-zeny">
              {formatZeny(totalPayout)} <span className="text-xs text-amber-300 font-sans">Z</span>
            </span>
          </div>
        </div>

        {/* Middle: 10-Day Interest Accumulator Progress */}
        <div className="ro-inset p-2.5 space-y-1.5 bg-[#121824]/90 border border-sky-900/40">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 flex items-center gap-1">
              <Clock size={12} className="text-sky-400" />
              Interest Cycle Progress
            </span>
            <span
              className={`font-mono text-[10px] font-bold ${
                isCapped ? "text-amber-400" : "text-sky-300"
              }`}
            >
              {daysAccrued} / {maxDays} Days ({daysAccrued}% {isCapped ? "• MAX CAP" : ""})
            </span>
          </div>

          <div className="h-2 w-full bg-[#0d121c] rounded-full overflow-hidden border border-[#2b3a4f]">
            <div
              style={{ width: `${progressPct}%` }}
              className={`h-full rounded-full transition-all ${
                isCapped ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-sky-600 to-cyan-400"
              }`}
            />
          </div>

          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>Rate: 1% / day (2% deposit fee)</span>
            <span>Max: 10% accumulation</span>
          </div>
        </div>

        {/* Footer: Deposit Timestamp */}
        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-ro-borderLight/10">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-slate-400" />
            Account-Protected Vault
          </span>
          <span>Last Deposit: {lastDepositDate}</span>
        </div>
      </div>
    </div>
  );
};
