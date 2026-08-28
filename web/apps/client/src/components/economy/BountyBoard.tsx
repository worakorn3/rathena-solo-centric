import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Coins,
  Backpack,
  Archive,
  Lock,
  ShieldCheck,
  ArrowUpRight,
  Loader2,
  User,
  AlertCircle
} from "lucide-react";
import {
  DailyBounty,
  BountyPlayerHolding,
  BountyQuotaSummary,
  PlayerBountyInventoryResponse,
  SellBountyResponse,
  CharacterSummary,
  CharacterDetail
} from "@rathena/shared";
import { formatZeny, getItemIconUrl } from "../../lib/assets";
import { api } from "../../lib/api";

type SortOption = "recommend" | "tier_asc" | "price_desc" | "price_asc" | "level_asc" | "level_desc";

interface BountyBoardProps {
  characters?: CharacterSummary[];
  selectedCharId?: number | null;
  selectedCharDetail?: CharacterDetail | null;
  onSelectChar?: (charId: number) => void;
  onRefreshUserData?: () => void;
  user?: any;
  onOpenLoginModal?: () => void;
}

export const BountyBoard: React.FC<BountyBoardProps> = ({
  characters = [],
  selectedCharId,
  selectedCharDetail,
  onSelectChar,
  onRefreshUserData,
  user,
  onOpenLoginModal,
}) => {
  const [bounties, setBounties] = useState<BountyPlayerHolding[]>([]);
  const [quota, setQuota] = useState<BountyQuotaSummary | null>(null);
  const [activeCharSummary, setActiveCharSummary] = useState<CharacterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<number | "all" | "onhand">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>(user ? "recommend" : "tier_asc");
  const [selectedBounty, setSelectedBounty] = useState<BountyPlayerHolding | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [sellSource, setSellSource] = useState<"INVENTORY" | "STORAGE">("INVENTORY");
  const [isSelling, setIsSelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState<string>("--:--:--");

  // Active Character Resolution
  const activeChar = useMemo(() => {
    if (selectedCharDetail && selectedCharDetail.charId === selectedCharId) {
      return selectedCharDetail;
    }
    if (selectedCharId && characters.length > 0) {
      return characters.find((c) => c.charId === selectedCharId) || null;
    }
    return activeCharSummary || (characters.length > 0 ? characters[0] : null);
  }, [selectedCharDetail, selectedCharId, characters, activeCharSummary]);

  // 1. Fetch Bounties & Player Inventory Data
  const loadBounties = useCallback(async () => {
    setLoading(true);
    try {
      if (user && selectedCharId) {
        const res = await api.get<PlayerBountyInventoryResponse>(
          `/api/economy/bounties/inventory/${selectedCharId}`
        );
        if (res.success && res.allBounties) {
          setBounties(res.allBounties);
          if (res.quota) setQuota(res.quota);
          if (res.character) setActiveCharSummary(res.character as any);
          return;
        }
      }

      // Public / Logged-out fallback
      const publicRes = await api.get<{ success: boolean; bounties: DailyBounty[] }>(
        "/api/economy/bounties"
      );
      if (publicRes.success && publicRes.bounties) {
        const mapped: BountyPlayerHolding[] = publicRes.bounties.map((b) => ({
          ...b,
          inInventory: 0,
          inStorage: 0,
          totalAvailable: 0,
          potentialZeny: 0,
          isRecommended: false,
        }));
        setBounties(mapped);
      }
    } catch (err) {
      console.error("Failed to load bounties:", err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCharId]);

  useEffect(() => {
    loadBounties();
  }, [loadBounties]);

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
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tier Theme Config matching the application's design system
  const getTierTheme = (tier: number) => {
    if (tier === 1) {
      return {
        cardBorder: "border-emerald-500/20 hover:border-emerald-500/50",
        cardBg: "bg-emerald-950/10",
        badge: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30",
        dot: "bg-emerald-400",
        label: "Tier 1 · Novice",
        levelRange: "Lv 1-30",
        accent: "text-emerald-400",
      };
    } else if (tier === 2) {
      return {
        cardBorder: "border-sky-500/20 hover:border-sky-500/50",
        cardBg: "bg-sky-950/10",
        badge: "bg-sky-950/40 text-sky-400 border border-sky-500/30",
        dot: "bg-sky-400",
        label: "Tier 2 · Adept",
        levelRange: "Lv 31-70",
        accent: "text-sky-400",
      };
    } else if (tier === 3) {
      return {
        cardBorder: "border-amber-500/20 hover:border-amber-500/50",
        cardBg: "bg-amber-950/10",
        badge: "bg-amber-950/40 text-amber-400 border border-amber-500/30",
        dot: "bg-amber-400",
        label: "Tier 3 · Master",
        levelRange: "Lv 71-110",
        accent: "text-amber-400",
      };
    } else if (tier === 4) {
      return {
        cardBorder: "border-purple-500/20 hover:border-purple-500/50",
        cardBg: "bg-purple-950/10",
        badge: "bg-purple-950/40 text-purple-400 border border-purple-500/30",
        dot: "bg-purple-400",
        label: "Tier 4 · Trans",
        levelRange: "Lv 111-150",
        accent: "text-purple-400",
      };
    } else if (tier === 5) {
      return {
        cardBorder: "border-indigo-500/20 hover:border-indigo-500/50",
        cardBg: "bg-indigo-950/10",
        badge: "bg-indigo-950/40 text-indigo-400 border border-indigo-500/30",
        dot: "bg-indigo-400",
        label: "Tier 5 · 3rd Class",
        levelRange: "Lv 151-190",
        accent: "text-indigo-400",
      };
    } else {
      return {
        cardBorder: "border-rose-500/20 hover:border-rose-500/50",
        cardBg: "bg-rose-950/10",
        badge: "bg-rose-950/40 text-rose-400 border border-rose-500/30",
        dot: "bg-rose-400",
        label: `Tier ${tier} · 4th Class`,
        levelRange: "Lv 191-250",
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

  // On-hand matching items in character backpack
  const onHandBounties = useMemo(() => {
    return bounties.filter((b) => b.inInventory > 0);
  }, [bounties]);

  const totalOnHandPotentialZeny = useMemo(() => {
    return onHandBounties.reduce((sum, b) => sum + b.inInventory * b.price, 0);
  }, [onHandBounties]);

  const totalOnHandCount = useMemo(() => {
    return onHandBounties.reduce((sum, b) => sum + b.inInventory, 0);
  }, [onHandBounties]);

  // Filtered & Sorted Bounties
  const processedBounties = useMemo(() => {
    let list = bounties.filter((b) => {
      if (tierFilter === "onhand") {
        return b.inInventory > 0;
      }
      const matchesTier = tierFilter === "all" || b.tier === tierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.itemName.toLowerCase().includes(q) ||
        b.mobName.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortOption === "recommend") {
        if ((a.inInventory > 0) !== (b.inInventory > 0)) {
          return a.inInventory > 0 ? -1 : 1;
        }
        if ((a.totalAvailable > 0) !== (b.totalAvailable > 0)) {
          return a.totalAvailable > 0 ? -1 : 1;
        }
        return b.price - a.price;
      }
      if (sortOption === "price_desc") return b.price - a.price;
      if (sortOption === "price_asc") return a.price - b.price;
      if (sortOption === "level_asc") return a.mobLevel - b.mobLevel;
      if (sortOption === "level_desc") return b.mobLevel - a.mobLevel;
      return a.tier === b.tier ? a.index - b.index : a.tier - b.tier;
    });

    return list;
  }, [bounties, tierFilter, searchQuery, sortOption]);

  // Open modal with smart initial quantity
  const handleOpenSellModal = (bounty: BountyPlayerHolding) => {
    setSelectedBounty(bounty);
    const initialSource = bounty.inInventory > 0 ? "INVENTORY" : "STORAGE";
    setSellSource(initialSource);

    const available = initialSource === "INVENTORY" ? bounty.inInventory : bounty.inStorage;
    const remainingQuota = quota ? quota.remainingQuota : 100;
    const maxPossible = Math.min(available, remainingQuota);
    setSellQuantity(Math.max(1, maxPossible));
  };

  // Execute Web Sale
  const handleExecuteSell = async () => {
    if (!selectedBounty || !activeChar) return;
    if (activeChar.online) {
      showToast("Character is online in-game. Please log out first!");
      return;
    }

    setIsSelling(true);
    try {
      const payload = {
        charId: activeChar.charId,
        itemId: selectedBounty.itemId,
        amount: sellQuantity,
        source: sellSource,
      };

      const res = await api.post<SellBountyResponse>("/api/economy/bounties/sell", payload);

      if (res.success) {
        showToast(
          res.message ||
            `Successfully sold ${sellQuantity}x ${selectedBounty.itemName} for +${formatZeny(
              res.payoutZeny || 0
            )} Z!`
        );
        setSelectedBounty(null);

        // Refresh bounties and user net worth data
        await loadBounties();
        if (onRefreshUserData) onRefreshUserData();
      } else {
        showToast(res.error || "Failed to complete transaction.");
      }
    } catch (err: any) {
      console.error("Sell transaction error:", err);
      showToast(err.message || "Failed to complete sell transaction.");
    } finally {
      setIsSelling(false);
    }
  };

  // Quick Batch Turn-in All On-Hand Items
  const handleBatchTurnInAll = async () => {
    if (!activeChar) return;
    if (activeChar.online) {
      showToast("Character is online in-game. Please log out first!");
      return;
    }
    if (onHandBounties.length === 0) {
      showToast("No bounty items found in character backpack.");
      return;
    }

    setIsSelling(true);
    try {
      let remainingQuota = quota ? quota.remainingQuota : 100;
      let totalSold = 0;
      let totalPayout = 0;

      for (const b of onHandBounties) {
        if (remainingQuota <= 0) break;
        const sellAmt = Math.min(b.inInventory, remainingQuota);
        if (sellAmt > 0) {
          const res = await api.post<SellBountyResponse>("/api/economy/bounties/sell", {
            charId: activeChar.charId,
            itemId: b.itemId,
            amount: sellAmt,
            source: "INVENTORY",
          });
          if (res.success) {
            totalSold += sellAmt;
            totalPayout += res.payoutZeny || 0;
            remainingQuota -= sellAmt;
          }
        }
      }

      if (totalSold > 0) {
        showToast(
          `Batch turned in ${totalSold} bounty items for +${formatZeny(totalPayout)} Zeny!`
        );
        await loadBounties();
        if (onRefreshUserData) onRefreshUserData();
      } else {
        showToast("Turn-in quota exhausted for today.");
      }
    } catch (err: any) {
      console.error("Batch turn-in error:", err);
      showToast(err.message || "Failed to batch turn in items.");
    } finally {
      setIsSelling(false);
    }
  };

  if (loading && bounties.length === 0) {
    return (
      <div className="bento-card py-20 text-center text-xs font-medium text-muted flex flex-col items-center justify-center gap-2">
        <Target className="w-6 h-6 text-accent animate-pulse" />
        <span>Loading Daily Junk Trader Bounties...</span>
      </div>
    );
  }

  const isCharOnline = Boolean(activeChar && activeChar.online);
  const remainingQuotaCount = quota ? quota.remainingQuota : 100;
  const quotaSold = quota ? quota.dailySold : 0;
  const quotaProgressPct = Math.min(100, Math.round((quotaSold / 100) * 100));

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full select-none">
      {/* ==================== 1. TOP COMMAND HERO BAR ==================== */}
      <div className="bento-card p-3 sm:p-4 shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Title, Location, Character Selector & Online Status */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0 shadow-inner">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-primary tracking-tight flex items-center gap-1.5">
                Daily Junk Trader Bounties
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface2 border border-border text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-accent" /> Prontera (143, 172)
              </span>

              {user && activeChar ? (
                isCharOnline ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    Online In-Game · Web Selling Locked
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Offline · Web Trade Ready
                  </span>
                )
              ) : null}
            </div>

            {/* Subtitle / Description */}
            <div className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
              <span>Hunt designated monsters and turn in loot to the Prontera Junk Trader for boosted daily payouts.</span>
            </div>
          </div>
        </div>

        {/* Right: Quota Gauge, Reset Timer & Lifetime Stats */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-border/60 pt-2.5 lg:pt-0">
          {/* Reset Timer */}
          <div className="bg-surface2/50 border border-border px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
            <div>
              <div className="text-[8px] uppercase font-bold text-muted tracking-wider">
                Reset In
              </div>
              <div className="font-mono text-xs font-bold text-primary">
                {countdownText}
              </div>
            </div>
          </div>

          {/* Daily Turn-in Quota */}
          <div className="bg-surface2/50 border border-border px-3 py-1.5 rounded-xl flex flex-col justify-center min-w-[140px]">
            <div className="flex justify-between items-center text-[8px] uppercase font-bold text-muted mb-0.5">
              <span>Daily Quota</span>
              <span className="font-mono text-accent text-[10px]">
                {quotaSold} / 100 Items
              </span>
            </div>
            <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${quotaProgressPct}%` }}
              />
            </div>
          </div>

          {/* Lifetime Earnings */}
          {quota && quota.lifetimeZeny > 0 && (
            <div className="hidden xl:flex bg-surface2/50 border border-border px-3 py-1.5 rounded-xl items-center gap-2">
              <div>
                <div className="text-[8px] uppercase font-bold text-muted tracking-wider">
                  Lifetime Earnings
                </div>
                <div className="font-mono text-xs font-bold text-success">
                  {formatZeny(quota.lifetimeZeny)} Z
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 2. 🔥 ON-HANDS RECOMMENDATIONS HERO SECTION ==================== */}
      {user && onHandBounties.length > 0 && (
        <div className="bento-card p-3.5 sm:p-4 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-surface shrink-0 relative overflow-hidden animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2 flex-wrap">
                  <span>Recommended Items On Hand</span>
                  <span className="bg-amber-400 text-zinc-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {onHandBounties.length} Items ({totalOnHandCount} in Backpack)
                  </span>
                </h3>
                <p className="text-[11px] text-muted truncate">
                  Your backpack contains active bounty monster loot. Turn them in directly from the web for high daily payouts!
                </p>
              </div>
            </div>

            {/* Quick Batch Turn-in All Button */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleBatchTurnInAll}
                disabled={isSelling || isCharOnline || remainingQuotaCount <= 0}
                className={`w-full md:w-auto px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                  isCharOnline || remainingQuotaCount <= 0
                    ? "bg-surface2 text-muted border border-border cursor-not-allowed"
                    : "bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:shadow-amber-500/10 cursor-pointer"
                }`}
              >
                {isSelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                <span>
                  Batch Turn-in All (+{formatZeny(totalOnHandPotentialZeny)} Z)
                </span>
              </button>
            </div>
          </div>

          {/* On-Hand Cards Horizontal Strip / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {onHandBounties.slice(0, 3).map((b) => {
              const potential = b.inInventory * b.price;
              return (
                <div
                  key={`onhand-${b.tier}-${b.itemId}`}
                  className="bento-card bg-surface2/50 border-amber-500/30 p-3 flex flex-col justify-between hover:border-amber-400 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                        <img
                          src={getItemIconUrl(b.itemId)}
                          alt={b.itemName}
                          className="ro-icon w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-primary group-hover:text-amber-400 transition-colors truncate">
                          {b.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-muted flex items-center gap-1">
                          <span className="text-amber-400 font-bold">
                            {b.inInventory}x in Bag
                          </span>
                          <span>·</span>
                          <span>Tier {b.tier}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                      {formatZeny(b.price)} z/ea
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-success font-bold text-xs">
                      +{formatZeny(potential)} Z
                    </span>
                    <button
                      onClick={() => handleOpenSellModal(b)}
                      className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] flex items-center gap-1 transition-colors shadow"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Sell Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 3. FILTER & CONTROL STRIP ==================== */}
      <div className="bento-card p-2.5 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTierFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tierFilter === "all"
                ? "bg-accent text-zinc-950 shadow-sm"
                : "bg-surface2/60 text-muted hover:text-primary hover:bg-surface2 border border-border"
            }`}
          >
            <span>All Bounties</span>
            <span className="text-[10px] font-mono bg-zinc-950/20 px-1 rounded">
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
                    ? "bg-accent text-zinc-950 font-bold shadow-sm"
                    : "bg-surface2/60 text-muted hover:text-primary hover:bg-surface2 border border-border font-semibold"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                <span>{theme.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive
                      ? "bg-zinc-950/20 text-zinc-950"
                      : `${theme.accent} bg-surface border border-border`
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {user && onHandBounties.length > 0 && (
            <button
              onClick={() => setTierFilter("onhand")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                tierFilter === "onhand"
                  ? "bg-amber-400 text-zinc-950 font-bold shadow-sm"
                  : "bg-surface2/60 text-amber-400 hover:bg-surface2 border border-amber-500/30 font-semibold"
              }`}
            >
              <Backpack className="w-3.5 h-3.5" />
              <span>Only On Hand</span>
              <span className="text-[10px] font-mono px-1 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold">
                {onHandBounties.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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

          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-medium focus:outline-none focus:border-accent/60 cursor-pointer appearance-none pr-7"
            >
              <option value="recommend">Sort: Recommended First</option>
              <option value="price_desc">Sort: Payout (High → Low)</option>
              <option value="price_asc">Sort: Payout (Low → High)</option>
              <option value="tier_asc">Sort: Tier & Index</option>
              <option value="level_asc">Sort: Mob Level (Low → High)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ==================== 4. RESPONSIVE BOUNTY BOARD ==================== */}
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
              const hasOnHand = bounty.inInventory > 0;
              const hasStorage = bounty.inStorage > 0;
              const totalOwned = bounty.inInventory + bounty.inStorage;

              return (
                <div
                  key={`${bounty.tier}-${bounty.index}`}
                  className={`bento-card p-3.5 flex flex-col justify-between transition-all ${
                    hasOnHand
                      ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-400"
                      : `${theme.cardBg} ${theme.cardBorder}`
                  }`}
                >
                  {/* Card Top: Badges & RO Sprite Icon */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${theme.badge}`}
                          >
                            {theme.label}
                          </span>
                          {getDifficultyPill(bounty.mobLevel)}
                          {hasOnHand && (
                            <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center gap-0.5">
                              <Backpack className="w-2.5 h-2.5" /> In Bag ({bounty.inInventory})
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-primary transition-colors truncate mt-1">
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
                      <div className="w-11 h-11 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0 shadow-inner">
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

                    {/* Card Middle: Stock / Inventory Intel */}
                    <div className="my-2.5 px-2.5 py-1.5 rounded-md bg-surface2/60 border border-border/80 flex items-center justify-between text-[10px] font-mono">
                      {user ? (
                        <span className="text-muted">
                          Bag:{" "}
                          <strong
                            className={
                              hasOnHand ? "text-amber-400 font-bold" : "text-primary"
                            }
                          >
                            {bounty.inInventory}
                          </strong>{" "}
                          | Storage:{" "}
                          <strong
                            className={
                              hasStorage ? "text-sky-400 font-bold" : "text-primary"
                            }
                          >
                            {bounty.inStorage}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-muted flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span>Item #{bounty.itemId}</span>
                        </span>
                      )}

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
                  </div>

                  {/* Card Bottom: Payout Rate & Action Button */}
                  <div className="pt-2.5 border-t border-border/80 flex justify-between items-end text-xs">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted">
                        Unit Bounty Payout
                      </div>
                      <div className={`font-mono font-bold text-sm ${theme.accent}`}>
                        {formatZeny(bounty.price)}{" "}
                        <span className="text-[10px] font-sans font-semibold">
                          Z/ea
                        </span>
                      </div>
                    </div>

                    <div>
                      {user ? (
                        totalOwned > 0 ? (
                          <button
                            onClick={() => handleOpenSellModal(bounty)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Sell from Web</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-2.5 py-1 rounded bg-surface2 text-muted/50 border border-border/50 text-[10px] font-medium cursor-not-allowed"
                          >
                            None Owned
                          </button>
                        )
                      ) : (
                        <button
                          onClick={onOpenLoginModal}
                          className="px-2.5 py-1 rounded bg-surface2 hover:bg-surface2/80 text-accent border border-border text-[10px] font-bold transition-colors"
                        >
                          Log in to Sell
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== 5. INTERACTIVE DIRECT SELL MODAL ==================== */}
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
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface2/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 shadow-inner">
                  <img
                    src={getItemIconUrl(selectedBounty.itemId)}
                    alt={selectedBounty.itemName}
                    className="ro-icon w-6 h-6 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-primary truncate">
                    {selectedBounty.itemName}
                  </div>
                  <div className="text-[10px] font-mono text-muted">
                    Tier {selectedBounty.tier} · ID #{selectedBounty.itemId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-surface text-xs">
              {/* Target Monster & Payout Intel */}
              <div className="p-3 rounded-lg bg-surface2/50 border border-border flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted flex items-center gap-1 text-danger">
                    <Skull className="w-3 h-3" /> Target Monster
                  </div>
                  <div className="font-bold text-primary text-xs mt-0.5">
                    {selectedBounty.mobName}{" "}
                    <span className="font-mono text-muted">(Lv. {selectedBounty.mobLevel})</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[9px] uppercase font-bold text-muted">Bounty Price</div>
                  <div className="font-bold text-accent text-sm">
                    {formatZeny(selectedBounty.price)} Z / ea
                  </div>
                </div>
              </div>

              {/* Source Selector (Backpack vs. Storage) */}
              <div className="p-3 rounded-lg bg-surface2/30 border border-border space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                  <span>Available Stock</span>
                  <span className="font-mono text-primary font-bold">
                    {selectedBounty.inInventory + selectedBounty.inStorage} items total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <label
                    className={`p-2.5 rounded-lg bg-surface border flex items-center gap-2 cursor-pointer transition-colors ${
                      sellSource === "INVENTORY"
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border hover:border-amber-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sell_source"
                      value="INVENTORY"
                      checked={sellSource === "INVENTORY"}
                      onChange={() => {
                        setSellSource("INVENTORY");
                        setSellQuantity(
                          Math.max(1, Math.min(selectedBounty.inInventory, remainingQuotaCount))
                        );
                      }}
                      className="text-accent focus:ring-accent accent-amber-400"
                    />
                    <div className="text-[11px] min-w-0">
                      <div className="font-bold text-primary flex items-center gap-1">
                        <Backpack className="w-3 h-3 text-amber-400" /> Backpack
                      </div>
                      <div className="text-[10px] text-muted">
                        {selectedBounty.inInventory} on hand
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg bg-surface border flex items-center gap-2 cursor-pointer transition-colors ${
                      sellSource === "STORAGE"
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border hover:border-amber-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sell_source"
                      value="STORAGE"
                      checked={sellSource === "STORAGE"}
                      onChange={() => {
                        setSellSource("STORAGE");
                        setSellQuantity(
                          Math.max(1, Math.min(selectedBounty.inStorage, remainingQuotaCount))
                        );
                      }}
                      className="text-accent focus:ring-accent accent-amber-400"
                    />
                    <div className="text-[11px] min-w-0">
                      <div className="font-bold text-primary flex items-center gap-1">
                        <Archive className="w-3 h-3 text-sky-400" /> Storage
                      </div>
                      <div className="text-[10px] text-muted">
                        {selectedBounty.inStorage} in storage
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quantity Slider & Presets */}
              {(() => {
                const currentAvail =
                  sellSource === "INVENTORY"
                    ? selectedBounty.inInventory
                    : selectedBounty.inStorage;
                const maxSellable = Math.min(currentAvail, remainingQuotaCount);
                const payoutTotal = sellQuantity * selectedBounty.price;

                return (
                  <div className="p-3 rounded-lg bg-surface2/30 border border-border space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase">
                      <span>Sell Quantity</span>
                      <span className="font-mono text-accent font-bold text-sm">
                        {sellQuantity} items
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max={Math.max(1, currentAvail)}
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(Number(e.target.value))}
                      disabled={currentAvail <= 0}
                      className="w-full accent-amber-400 cursor-pointer h-2 bg-surface2 rounded-lg"
                    />

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <button
                        onClick={() => setSellQuantity(Math.min(1, currentAvail))}
                        className="flex-1 py-1.5 rounded bg-surface hover:bg-surface2 border border-border text-muted hover:text-primary font-bold transition-colors"
                      >
                        1x
                      </button>
                      <button
                        onClick={() => setSellQuantity(Math.min(10, currentAvail))}
                        className="flex-1 py-1.5 rounded bg-surface hover:bg-surface2 border border-border text-muted hover:text-primary font-bold transition-colors"
                      >
                        10x
                      </button>
                      <button
                        onClick={() => setSellQuantity(Math.min(25, currentAvail))}
                        className="flex-1 py-1.5 rounded bg-surface hover:bg-surface2 border border-border text-muted hover:text-primary font-bold transition-colors"
                      >
                        25x
                      </button>
                      <button
                        onClick={() => setSellQuantity(maxSellable)}
                        className="flex-1 py-1.5 rounded bg-surface hover:bg-surface2 border border-border text-accent font-bold transition-colors"
                      >
                        Max Quota
                      </button>
                      <button
                        onClick={() => setSellQuantity(currentAvail)}
                        className="flex-1 py-1.5 rounded bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-400 font-bold transition-colors"
                      >
                        All ({currentAvail})
                      </button>
                    </div>

                    {/* Payout & Quota Gauge */}
                    <div className="grid grid-cols-2 gap-2 text-center font-mono pt-1">
                      <div className="p-2.5 rounded-lg bg-surface border border-border">
                        <div className="text-[9px] text-muted uppercase">
                          Quota Consumed
                        </div>
                        <div className="font-bold text-primary text-xs mt-0.5">
                          {sellQuantity} / {remainingQuotaCount} remaining
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-amber-500/30 bg-amber-500/5">
                        <div className="text-[9px] text-muted uppercase">Zeny Payout</div>
                        <div className="font-bold text-success text-sm mt-0.5">
                          +{formatZeny(payoutTotal)} Z
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Block & Offline Safety */}
              <div className="space-y-2 pt-1">
                {isCharOnline ? (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs font-semibold">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      Character is currently logged in-game. Please log out to trade via web.
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleExecuteSell}
                    disabled={
                      isSelling ||
                      (sellSource === "INVENTORY"
                        ? selectedBounty.inInventory <= 0
                        : selectedBounty.inStorage <= 0) ||
                      sellQuantity > remainingQuotaCount
                    }
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                      isSelling ||
                      (sellSource === "INVENTORY"
                        ? selectedBounty.inInventory <= 0
                        : selectedBounty.inStorage <= 0) ||
                      sellQuantity > remainingQuotaCount
                        ? "bg-surface2 text-muted border border-border cursor-not-allowed"
                        : "bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-500/10 cursor-pointer"
                    }`}
                  >
                    {isSelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Database Transaction...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Confirm Web Turn-in (+
                          {formatZeny(sellQuantity * selectedBounty.price)} Z)
                        </span>
                      </>
                    )}
                  </button>
                )}

                <div className="text-[10px] text-muted text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct database atomic transfer · Safe offline execution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface border border-amber-400/40 text-primary px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
