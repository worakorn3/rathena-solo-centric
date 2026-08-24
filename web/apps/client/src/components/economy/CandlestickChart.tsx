import React, { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, TickMarkType } from "lightweight-charts";
import { StockHistoryResponse } from "@rathena/shared";
import { api } from "../../lib/api";
import { Loader2, TrendingUp } from "lucide-react";

interface CandlestickChartProps {
  ticker: string;
}

type Timeframe = "1D" | "1W" | "1M" | "ALL";

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ ticker }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);

  // Initialize & configure TradingView Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { color: "#09090b" },
        textColor: "#a1a1aa",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#1c1c20" },
        horzLines: { color: "#1c1c20" },
      },
      crosshair: {
        vertLine: { color: "#fbbf24", width: 1, style: 2 },
        horzLine: { color: "#fbbf24", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#27272a",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      localization: {
        locale: "en-GB",
        dateFormat: "yyyy-MM-dd",
        timeFormatter: (time: any) => {
          let d: Date;
          if (typeof time === "number") {
            d = new Date(time * 1000);
          } else if (typeof time === "string") {
            d = new Date(time);
          } else if (typeof time === "object" && time !== null && "year" in time) {
            d = new Date(Date.UTC(time.year, time.month - 1, time.day));
          } else {
            return String(time);
          }
          return d.toLocaleString("en-GB", {
            timeZone: "Asia/Bangkok",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 14,
        minBarSpacing: 6,
        tickMarkFormatter: (time: any, tickMarkType: TickMarkType) => {
          let d: Date;
          if (typeof time === "number") {
            d = new Date(time * 1000);
          } else if (typeof time === "string") {
            d = new Date(time);
          } else if (typeof time === "object" && time !== null && "year" in time) {
            d = new Date(Date.UTC(time.year, time.month - 1, time.day));
          } else {
            return String(time);
          }

          const bkk = { timeZone: "Asia/Bangkok" };
          switch (tickMarkType) {
            case TickMarkType.Year:
              return d.toLocaleDateString("en-GB", { ...bkk, year: "numeric" });
            case TickMarkType.Month:
              return d.toLocaleDateString("en-GB", { ...bkk, month: "short" });
            case TickMarkType.DayOfMonth:
              return d.toLocaleDateString("en-GB", { ...bkk, day: "numeric", month: "short" });
            case TickMarkType.Time:
              return d.toLocaleTimeString("en-GB", { ...bkk, hour: "2-digit", minute: "2-digit", hour12: false });
            case TickMarkType.TimeWithSeconds:
              return d.toLocaleTimeString("en-GB", { ...bkk, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            default:
              return d.toLocaleTimeString("en-GB", { ...bkk, hour: "2-digit", minute: "2-digit", hour12: false });
          }
        },
      },
      height: 220,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#10B981", // Tailwind Emerald
      downColor: "#EF4444", // Tailwind Rose
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
      priceFormat: {
        type: "custom",
        minMove: 1,
        formatter: (price: number) => `${Math.round(price)} Z`,
      },
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData.get(series)) {
        setHoverInfo(null);
        return;
      }
      const data = param.seriesData.get(series) as any;
      if (data && typeof data.open === "number") {
        setHoverInfo({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        });
      } else {
        setHoverInfo(null);
      }
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Fetch candle data when ticker or timeframe changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHoverInfo(null);

    api
      .get<StockHistoryResponse>(`/api/economy/history/${ticker}?timeframe=${timeframe}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && seriesRef.current && chartRef.current) {
          const formatted: CandlestickData<Time>[] = res.candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));

          seriesRef.current.setData(formatted);
          chartRef.current.timeScale().fitContent();
        }
      })
      .catch((err) => {
        console.error("Failed to load candlestick history:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticker, timeframe]);

  const timeframes: Timeframe[] = ["1D", "1W", "1M", "ALL"];

  return (
    <div className="p-3 rounded-lg bg-surface2/40 border border-border/80 space-y-2">
      {/* Header & Timeframe Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span>Price Action (OHLC)</span>
          <span className="text-[10px] text-accent/80 font-normal px-1.5 py-0.2 rounded bg-accent/10 border border-accent/20">
            BKK UTC+7
          </span>
        </div>

        <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-border font-mono text-[10px]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                timeframe === tf
                  ? "font-bold bg-accent text-background"
                  : "text-muted hover:text-primary"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full h-[220px] rounded border border-border/50 bg-[#09090b] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#09090b]/80 backdrop-blur-xs gap-2 text-muted font-mono text-[11px]">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Loading Market Candlesticks...</span>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Dynamic Hover / Legend Strip */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted/80 pt-0.5 px-1 min-h-[18px]">
        {hoverInfo ? (
          <div className="flex items-center gap-2">
            <span>O: <span className="text-primary font-bold">{hoverInfo.open}z</span></span>
            <span>H: <span className="text-primary font-bold">{hoverInfo.high}z</span></span>
            <span>L: <span className="text-primary font-bold">{hoverInfo.low}z</span></span>
            <span>
              C:{" "}
              <span
                className={`font-bold ${
                  hoverInfo.close >= hoverInfo.open ? "text-success" : "text-danger"
                }`}
              >
                {hoverInfo.close}z
              </span>
            </span>
          </div>
        ) : (
          <span className="text-muted/60">Hover over candle to inspect OHLC values</span>
        )}
        <span className="text-accent/80 font-semibold shrink-0">TradingView Core • UTC+7</span>
      </div>
    </div>
  );
};
