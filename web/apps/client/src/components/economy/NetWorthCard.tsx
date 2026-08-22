import React from "react";
import { Coins, Landmark, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NetWorthSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";

interface NetWorthCardProps {
  summary: NetWorthSummary;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary }) => {
  const {
    totalNetWorth,
    liquidZeny,
    bankTotal,
    bankPrincipal,
    bankPendingInterest,
    stockMarketValue,
    stockUnrealizedPnL,
    stockUnrealizedPnLPercent,
    characterZenyBreakdown,
  } = summary;

  const liquidPct = totalNetWorth > 0 ? (liquidZeny / totalNetWorth) * 100 : 0;
  const bankPct = totalNetWorth > 0 ? (bankTotal / totalNetWorth) * 100 : 0;
  const stockPct = totalNetWorth > 0 ? (stockMarketValue / totalNetWorth) * 100 : 0;

  const isStockPositive = stockUnrealizedPnL >= 0;

  return (
    <div className="ro-window p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-ro-borderLight/30 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-ro-gold flex items-center justify-center">
            <Coins className="text-ro-gold" size={18} />
          </div>
          <div>
            <h2 className="font-cinzel font-bold text-sm tracking-wider text-slate-100 uppercase">
              Financial Command Center
            </h2>
            <p className="text-[11px] text-slate-400">
              Account-Wide Consolidated Net Worth & Asset Distribution
            </p>
          </div>
        </div>

        {/* Big Total Counter */}
        <div className="text-left sm:text-right">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Total Net Worth
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-ro-zeny tracking-tight flex items-baseline sm:justify-end gap-1">
            <span>{formatZeny(totalNetWorth)}</span>
            <span className="text-xs text-amber-300 font-sans">ZENY</span>
          </div>
        </div>
      </div>

      {/* Asset Distribution Gauges */}
      <div className="my-3.5 space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-300 font-medium">
          <span>Asset Allocation</span>
          <span className="font-mono text-slate-400">
            Liquid: {liquidPct.toFixed(1)}% | Bank: {bankPct.toFixed(1)}% | Stocks: {stockPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full bg-[#121824] rounded-sm overflow-hidden flex border border-[#364960] p-0.5 gap-0.5">
          <div
            style={{ width: `${liquidPct}%` }}
            className="bg-amber-400 hover:opacity-90 rounded-sm transition-all"
            title={`Liquid Zeny: ${formatZeny(liquidZeny)} Z`}
          />
          <div
            style={{ width: `${bankPct}%` }}
            className="bg-sky-400 hover:opacity-90 rounded-sm transition-all"
            title={`Bank Balance: ${formatZeny(bankTotal)} Z`}
          />
          <div
            style={{ width: `${stockPct}%` }}
            className="bg-emerald-400 hover:opacity-90 rounded-sm transition-all"
            title={`Stock Portfolio: ${formatZeny(stockMarketValue)} Z`}
          />
        </div>
      </div>

      {/* 3 Pillar Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
        {/* Pillar 1: Liquid Zeny */}
        <div className="ro-inset p-3.5 border-t-4 border-amber-400 relative overflow-hidden group hover:bg-[#1a2433] transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 relative z-10">
            <span className="flex items-center gap-1.5 font-bold font-sans text-slate-200">
              <Wallet size={15} className="text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]" />
              Liquid Cash (Chars)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900/60 px-1 rounded shadow-inner">
              {characterZenyBreakdown.length} Chars
            </span>
          </div>
          <div className="text-xl font-black font-mono text-amber-300 drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)] relative z-10">
            {formatZeny(liquidZeny)} <span className="text-xs text-slate-400 font-sans font-bold">Z</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 relative z-10">
            Available on hand across your characters
          </div>
        </div>

        {/* Pillar 2: Investment Bank */}
        <div className="ro-inset p-3.5 border-t-4 border-sky-400 relative overflow-hidden group hover:bg-[#1a2433] transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 relative z-10">
            <span className="flex items-center gap-1.5 font-bold font-sans text-slate-200">
              <Landmark size={15} className="text-sky-400 drop-shadow-[0_0_2px_rgba(56,189,248,0.8)]" />
              Investment Banker
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/40 px-1 rounded border border-sky-500/20">
              1% / Day
            </span>
          </div>
          <div className="text-xl font-black font-mono text-sky-300 drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)] relative z-10">
            {formatZeny(bankTotal)} <span className="text-xs text-slate-400 font-sans font-bold">Z</span>
          </div>
          <div className="text-[10.5px] text-emerald-400 font-mono font-semibold mt-1.5 flex items-center gap-1 relative z-10">
            <span>+{formatZeny(bankPendingInterest)} Z interest</span>
            <span className="text-slate-500 text-[9px]">({formatZeny(bankPrincipal)} principal)</span>
          </div>
        </div>

        {/* Pillar 3: Stock Exchange */}
        <div className="ro-inset p-3.5 border-t-4 border-emerald-400 relative overflow-hidden group bg-gradient-to-br from-[#101925] to-[#0d131c] shadow-[inset_0_2px_15px_rgba(16,185,129,0.05)]">
          {/* Subtle background glow based on performance */}
          <div className={`absolute -right-10 -bottom-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${isStockPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 relative z-10">
            <span className="flex items-center gap-1.5 font-bold font-sans text-slate-100">
              <TrendingUp size={15} className="text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.8)]" />
              Stock Portfolio
            </span>
            <span
              className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded flex items-center shadow-inner ${
                isStockPositive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              {isStockPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
              {isStockPositive ? "+" : ""}
              {stockUnrealizedPnLPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_1px_rgba(0,0,0,1)] relative z-10">
            {formatZeny(stockMarketValue)} <span className="text-xs text-emerald-600/70 font-sans font-bold">Z</span>
          </div>
          <div
            className={`text-[11px] font-mono font-bold mt-1.5 relative z-10 ${
              isStockPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            Unrealized P&L: {isStockPositive ? "+" : ""}
            {formatZeny(stockUnrealizedPnL)} Z
          </div>
        </div>
      </div>
    </div>
  );
};
