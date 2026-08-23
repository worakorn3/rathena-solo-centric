import React from "react";
import { formatZeny } from "../../lib/assets";
import { PieChart } from "lucide-react";

interface AssetAllocationPieProps {
  liquidZeny: number;
  bankTotal: number;
  stockMarketValue: number;
  totalNetWorth: number;
}

export const AssetAllocationPie: React.FC<AssetAllocationPieProps> = ({
  liquidZeny,
  bankTotal,
  stockMarketValue,
  totalNetWorth,
}) => {
  const total = Math.max(1, totalNetWorth);
  const liquidPct = (liquidZeny / total) * 100;
  const bankPct = (bankTotal / total) * 100;
  const stockPct = (stockMarketValue / total) * 100;

  const assets = [
    {
      label: "Stocks",
      value: stockMarketValue,
      pct: stockPct,
      color: "bg-emerald-400",
      dot: "bg-emerald-400",
      textColor: "text-emerald-400",
    },
    {
      label: "Cash",
      value: liquidZeny,
      pct: liquidPct,
      color: "bg-amber-400",
      dot: "bg-amber-400",
      textColor: "text-primary",
    },
    {
      label: "Bank",
      value: bankTotal,
      pct: bankPct,
      color: "bg-blue-400",
      dot: "bg-blue-400",
      textColor: "text-primary",
    },
  ];

  return (
    <div className="bento-card p-3 flex flex-col justify-between shrink-0">
      {/* Header with Total Net Worth */}
      <div className="w-full flex items-center justify-between border-b border-border pb-1.5 mb-1.5 shrink-0">
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-primary flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-accent" /> Asset Allocation
        </h3>
        <div className="text-right">
          <span className="text-[9px] text-muted uppercase font-sans mr-1">Total:</span>
          <span className="text-[11px] font-mono font-bold text-primary">
            {formatZeny(totalNetWorth)}
          </span>
        </div>
      </div>

      {/* Segmented Proportion Bar */}
      <div className="w-full my-1">
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface2 border border-border/40 gap-[1px]">
          {assets.map(
            (a) =>
              a.pct > 0 && (
                <div
                  key={a.label}
                  style={{ width: `${a.pct}%` }}
                  className={`h-full ${a.color} transition-all duration-300 hover:brightness-110`}
                  title={`${a.label}: ${a.pct.toFixed(1)}% (${formatZeny(a.value)})`}
                />
              )
          )}
        </div>
      </div>

      {/* 3-Way Asset Breakdown List */}
      <div className="space-y-1 font-mono text-[10px]">
        {assets.map((a) => (
          <div
            key={a.label}
            className="flex items-center justify-between px-2 py-0.5 rounded bg-surface2/30 hover:bg-surface2/60 border border-border/40 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-muted font-sans font-medium text-[9px]">
              <span className={`w-1.5 h-1.5 rounded-full ${a.dot} shrink-0`} />
              {a.label}{" "}
              <span className="text-muted/60">
                ({a.pct.toFixed(0)}%)
              </span>
            </span>
            <span className={`font-bold ${a.textColor} truncate`}>
              {formatZeny(a.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
