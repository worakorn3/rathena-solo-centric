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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* Pillar 1: Liquid Zeny */}
        <div className="ro-inset p-3 border-l-4 border-amber-400">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Wallet size={14} className="text-amber-400" />
              Liquid Cash (Chars)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {characterZenyBreakdown.length} Chars
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-amber-300">
            {formatZeny(liquidZeny)} <span className="text-xs text-slate-400 font-sans">Z</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Available on hand across your characters
          </div>
        </div>

        {/* Pillar 2: Investment Bank */}
        <div className="ro-inset p-3 border-l-4 border-sky-400">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Landmark size={14} className="text-sky-400" />
              Investment Banker
            </span>
            <span className="text-[10px] font-mono text-sky-400/90 font-semibold">1% / Day</span>
          </div>
          <div className="text-lg font-bold font-mono text-sky-300">
            {formatZeny(bankTotal)} <span className="text-xs text-slate-400 font-sans">Z</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <span>+{formatZeny(bankPendingInterest)} Z interest</span>
            <span className="text-slate-500">({formatZeny(bankPrincipal)} principal)</span>
          </div>
        </div>

        {/* Pillar 3: Stock Exchange */}
        <div className="ro-inset p-3 border-l-4 border-emerald-400">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <TrendingUp size={14} className="text-emerald-400" />
              Stock Portfolio
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1 py-0.2 rounded flex items-center ${
                isStockPositive
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-950/80 text-rose-300 border border-rose-500/30"
              }`}
            >
              {isStockPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {isStockPositive ? "+" : ""}
              {stockUnrealizedPnLPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300">
            {formatZeny(stockMarketValue)} <span className="text-xs text-slate-400 font-sans">Z</span>
          </div>
          <div
            className={`text-[10px] font-mono mt-1 ${
              isStockPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            P&L: {isStockPositive ? "+" : ""}
            {formatZeny(stockUnrealizedPnL)} Z
          </div>
        </div>
      </div>
    </div>
  );
};
