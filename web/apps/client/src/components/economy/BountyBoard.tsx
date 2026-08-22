import React, { useEffect, useState, useMemo } from "react";
import {
  Target,
  Skull,
  ExternalLink,
  Sparkles,
  Clock,
  Search,
  X,
  ChevronDown,
  MapPin,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Coins
} from "lucide-react";
import { DailyBounty } from "@rathena/shared";
import { formatZeny, getItemIconUrl } from "../../lib/assets";
import { api } from "../../lib/api";

type SortOption = "tier_asc" | "price_desc" | "price_asc" | "level_asc" | "level_desc";

export const BountyBoard: React.FC = () => {
  const [bounties, setBounties] = useState<DailyBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("tier_asc");
  const [selectedBounty, setSelectedBounty] = useState<DailyBounty | null>(null);
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState<string>("--:--:--");

  // 1. Fetch Bounties from backend API
  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const res = await api.get<{ success: boolean; bounties: DailyBounty[] }>(
          "/api/economy/bounties"
        );
        if (res.success && res.bounties) {
          setBounties(res.bounties);
        }
      } catch (err) {
        console.error("Failed to load bounties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBounties();
  }, []);

  // 2. Live 24-hour Reset Countdown (00:00 Server Time)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n: number) => String(n).padStart(2, "0");
      setCountdownText(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Modal Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedBounty(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Toast feedback trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Tier Theme Config
  const getTierTheme = (tier: number) => {
    if (tier === 1) {
      return {
        cardBorder: "border-emerald-500/25 hover:border-emerald-500/60",
        cardBg: "bg-emerald-950/10",
        badge: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30",
        dot: "bg-emerald-400",
        label: "Tier 1 · Novice",
        levelRange: "Lv 1-50",
        accent: "text-emerald-400",
      };
    } else if (tier === 2) {
      return {
        cardBorder: "border-sky-500/25 hover:border-sky-500/60",
        cardBg: "bg-sky-950/10",
        badge: "bg-sky-950/40 text-sky-400 border border-sky-500/30",
        dot: "bg-sky-400",
        label: "Tier 2 · Adept",
        levelRange: "Lv 51-99",
        accent: "text-sky-400",
      };
    } else if (tier === 3) {
      return {
        cardBorder: "border-amber-500/25 hover:border-amber-500/60",
        cardBg: "bg-amber-950/10",
        badge: "bg-amber-950/40 text-amber-400 border border-amber-500/30",
        dot: "bg-amber-400",
        label: "Tier 3 · Master",
        levelRange: "Lv 100+",
        accent: "text-amber-400",
      };
    } else {
      return {
        cardBorder: "border-rose-500/25 hover:border-rose-500/60",
        cardBg: "bg-rose-950/10",
        badge: "bg-rose-950/40 text-rose-400 border border-rose-500/30",
        dot: "bg-rose-400",
        label: `Tier ${tier} · Elite`,
        levelRange: "Lv 140+",
        accent: "text-rose-400",
      };
    }
  };

  // Difficulty Pill
  const getDifficultyPill = (mobLv: number) => {
    if (mobLv <= 40) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Easy
        </span>
      );
    }
    if (mobLv <= 80) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Moderate
        </span>
      );
    }
    if (mobLv <= 110) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Challenging
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
        Deadly
      </span>
    );
  };

  // Available Tiers in current bounty list
  const availableTiers = useMemo(() => {
    const set = new Set(bounties.map((b) => b.tier));
    return Array.from(set).sort((a, b) => a - b);
  }, [bounties]);

  // Filtered & Sorted Bounties
  const processedBounties = useMemo(() => {
    let list = bounties.filter((b) => {
      const matchesTier = tierFilter === "all" || b.tier === tierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.itemName.toLowerCase().includes(q) ||
        b.mobName.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortOption === "price_desc") return b.price - a.price;
      if (sortOption === "price_asc") return a.price - b.price;
      if (sortOption === "level_asc") return a.mobLevel - b.mobLevel;
      if (sortOption === "level_desc") return b.mobLevel - a.mobLevel;
      return a.tier === b.tier ? a.index - b.index : a.tier - b.tier;
    });

    return list;
  }, [bounties, tierFilter, searchQuery, sortOption]);

  // Peak Payout
  const topPayout = useMemo(() => {
    if (bounties.length === 0) return 0;
    return Math.max(...bounties.map((b) => b.price));
  }, [bounties]);

  if (loading) {
    return (
      <div className="bento-card py-20 text-center text-xs font-medium text-muted flex flex-col items-center justify-center gap-2">
        <Target className="w-6 h-6 text-accent animate-pulse" />
        <span>Loading Daily Junk Trader Bounties...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full select-none">
      {/* ==================== 1. TOP COMMAND HERO BAR ==================== */}
      <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 relative overflow-hidden">
        {/* Background Subtle Ambient Glow */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Title, Description & Prontera Location */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0 shadow-inner">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-primary tracking-tight flex items-center gap-1.5">
                Daily Junk Trader Bounties
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface2 border border-border text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-accent" /> Prontera (152, 187)
              </span>
            </div>
            <div className="text-[11px] text-muted mt-0.5 truncate sm:text-clip">
              Hunt target monsters and turn in their loot for boosted daily payouts.
            </div>
          </div>
        </div>

        {/* Right: Reset Countdown, Daily Quota & Peak Potential */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border/60 pt-2 md:pt-0">
          {/* Reset Timer */}
          <div className="bg-surface2/60 border border-border px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
            <div>
              <div className="text-[8px] uppercase font-bold text-muted tracking-wider">
                Reset Countdown
              </div>
              <div className="font-mono text-xs font-bold text-primary">
                {countdownText}
              </div>
            </div>
          </div>

          {/* Daily Turn-in Quota */}
          <div className="bg-surface2/60 border border-border px-3 py-1.5 rounded-lg flex items-center gap-2.5">
            <div>
              <div className="text-[8px] uppercase font-bold text-muted tracking-wider">
                Daily Quota
              </div>
              <div className="font-mono text-xs font-bold text-accent">
                Max 100 Items/day
              </div>
            </div>
          </div>

          {/* Peak Single Payout */}
          {topPayout > 0 && (
            <div className="hidden xl:flex bg-surface2/60 border border-border px-3 py-1.5 rounded-lg items-center gap-2">
              <div>
                <div className="text-[8px] uppercase font-bold text-muted tracking-wider">
                  Peak Daily Bounty
                </div>
                <div className="font-mono text-xs font-bold text-success">
                  +{formatZeny(topPayout * 100)} Z / max
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 2. FILTER & CONTROL STRIP ==================== */}
      <div className="bento-card p-2.5 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTierFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tierFilter === "all"
                ? "bg-accent text-background shadow-sm"
                : "bg-surface2/60 text-muted hover:text-primary hover:bg-surface2 border border-border"
            }`}
          >
            <span>All Bounties</span>
            <span className="text-[10px] font-mono bg-background/20 px-1 rounded">
              {bounties.length}
            </span>
          </button>

          {availableTiers.map((t) => {
            const theme = getTierTheme(t);
            const count = bounties.filter((b) => b.tier === t).length;
            const isActive = tierFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-accent text-background font-bold shadow-sm"
                    : "bg-surface2/60 text-muted hover:text-primary hover:bg-surface2 border border-border font-semibold"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                <span>{theme.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive
                      ? "bg-background/20 text-background"
                      : `${theme.accent} bg-surface border border-border`
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item or monster..."
              className="w-full bg-surface2 border border-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-medium focus:outline-none focus:border-accent/60 cursor-pointer appearance-none pr-7"
            >
              <option value="tier_asc">Sort: Tier & Index</option>
              <option value="price_desc">Sort: Payout (High → Low)</option>
              <option value="price_asc">Sort: Payout (Low → High)</option>
              <option value="level_asc">Sort: Mob Level (Low → High)</option>
              <option value="level_desc">Sort: Mob Level (High → Low)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ==================== 3. RESPONSIVE BOUNTY BOARD ==================== */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {processedBounties.length === 0 ? (
          <div className="bento-card text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface2 border border-border mx-auto flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-muted" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">
                No Matching Bounties Found
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                No daily junk items match your search or tier filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setTierFilter("all");
              }}
              className="bg-surface2 hover:bg-surface2/80 text-primary border border-border font-bold py-1.5 px-4 rounded-lg text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedBounties.map((bounty) => {
              const theme = getTierTheme(bounty.tier);
              const batch100 = bounty.price * 100;

              return (
                <div
                  key={`${bounty.tier}-${bounty.index}`}
                  onClick={() => {
                    setSelectedBounty(bounty);
                    setCalcQuantity(100);
                  }}
                  className={`bento-card ${theme.cardBg} ${theme.cardBorder} p-3.5 flex flex-col justify-between cursor-pointer group transition-all`}
                >
                  {/* Card Top: Badges & RO Sprite Icon */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${theme.badge}`}
                        >
                          {theme.label}
                        </span>
                        {getDifficultyPill(bounty.mobLevel)}
                      </div>

                      <h3 className="font-bold text-sm text-primary group-hover:text-accent transition-colors truncate mt-1">
                        {bounty.itemName}
                      </h3>

                      <div className="text-[11px] text-muted flex items-center gap-1 truncate">
                        <Skull className="w-3 h-3 text-danger shrink-0" />
                        <span className="truncate">
                          {bounty.mobName}{" "}
                          <strong className="text-primary/80 font-mono">
                            (Lv.{bounty.mobLevel})
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* RO Item Icon Frame */}
                    <div className="w-11 h-11 rounded-lg bg-surface2/70 border border-border group-hover:border-border/80 flex items-center justify-center shrink-0 shadow-inner">
                      <img
                        src={getItemIconUrl(bounty.itemId)}
                        alt={bounty.itemName}
                        className="ro-icon w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Middle: Quick Links */}
                  <div className="my-2.5 px-2.5 py-1.5 rounded-md bg-surface2/40 border border-border/50 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span>Item #{bounty.itemId}</span>
                    </span>
                    <a
                      href={`https://www.divine-pride.net/database/item/${bounty.itemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-info hover:text-primary font-bold transition-colors flex items-center gap-1 hover:underline shrink-0"
                      title="Inspect item drops on Divine Pride DB"
                    >
                      <span>Item DB</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Card Bottom: Single vs 100x Batch Payout */}
                  <div className="pt-2.5 border-t border-border/70 flex justify-between items-end text-xs">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted">
                        Full Batch (100x)
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        Max:{" "}
                        <span className="font-bold text-success">
                          {formatZeny(batch100)} Z
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${theme.accent}`}>
                        {formatZeny(bounty.price)}{" "}
                        <span className="text-[10px] font-sans font-semibold">
                          Z/ea
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== 4. INTERACTIVE BOUNTY DETAIL MODAL ==================== */}
      {selectedBounty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedBounty(null)}
        >
          <div
            className="bento-card w-full max-w-md p-0 overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                  <img
                    src={getItemIconUrl(selectedBounty.itemId)}
                    alt={selectedBounty.itemName}
                    className="ro-icon w-5 h-5 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-primary truncate">
                    {selectedBounty.itemName}
                  </div>
                  <div className="text-[10px] font-mono text-muted">
                    Tier {selectedBounty.tier} · Item #{selectedBounty.itemId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-surface text-xs">
              {/* Target Monster Intel */}
              <div className="p-3 rounded-lg bg-surface2/50 border border-border space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-danger">
                    <Skull className="w-3.5 h-3.5" /> Target Monster Intel
                  </span>
                  <span className="font-mono text-accent font-bold">
                    Lv. {selectedBounty.mobLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-primary">
                      {selectedBounty.mobName}
                    </div>
                    <div className="text-[11px] text-muted font-mono mt-0.5">
                      Drop Item ID: {selectedBounty.itemId}
                    </div>
                  </div>
                  <a
                    href={`https://www.divine-pride.net/database/item/${selectedBounty.itemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-info/10 hover:bg-info/20 text-info border border-info/30 font-bold text-[10px] transition-colors flex items-center gap-1"
                  >
                    <span>Divine Pride</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Turn-in Yield Calculator */}
              <div className="p-3 rounded-lg bg-surface2/30 border border-border space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                  <span>Turn-in Yield Calculator</span>
                  <span className="font-mono text-accent font-bold">
                    {calcQuantity} items
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="100"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-surface2 rounded-lg"
                />

                <div className="grid grid-cols-2 gap-2 text-center font-mono pt-1">
                  <div className="p-2 rounded bg-surface border border-border">
                    <div className="text-[9px] text-muted uppercase">
                      Unit Payout
                    </div>
                    <div className="font-bold text-primary text-xs mt-0.5">
                      {formatZeny(selectedBounty.price)} Z
                    </div>
                  </div>
                  <div className="p-2 rounded bg-surface border border-border">
                    <div className="text-[9px] text-muted uppercase">
                      Estimated Yield
                    </div>
                    <div className="font-bold text-success text-xs sm:text-sm mt-0.5">
                      {formatZeny(selectedBounty.price * calcQuantity)} Z
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn-in Directions */}
              <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
                <span>Bring items to Junk Trader in Prontera</span>
                <span className="font-mono text-[10px] text-accent font-bold">
                  (152, 187)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface border border-accent/40 text-primary px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
