import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Dices,
  Package,
  ShoppingBag,
  History,
  Info,
  Clock,
  FlaskConical,
  Shield,
  Crown,
  Layers,
  Coins,
  Gem,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { GachaBanner, GachaRewardItem, GachaStashItem, GachaShopItem, GachaHistoryLog } from "@rathena/shared";
import { api } from "../../lib/api";
import { formatZeny, getItemIconUrl } from "../../lib/assets";
import { EggSpinnerMachine } from "./EggSpinnerMachine";
import { GachaSummonModal } from "./GachaSummonModal";
import { GachaStashView } from "./GachaStashView";
import { GachaExchangeShop } from "./GachaExchangeShop";
import { GachaRatesModal } from "./GachaRatesModal";
import { GachaHistoryModal } from "./GachaHistoryModal";

interface GachaAltarProps {
  charId: number | null;
  charZeny: number;
  onRefreshBalances?: () => void;
}

export const GachaAltar: React.FC<GachaAltarProps> = ({
  charId,
  charZeny,
  onRefreshBalances,
}) => {
  const [activeTab, setActiveTab] = useState<"altar" | "stash" | "shop">("altar");
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string>("supplies");
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [marketMood, setMarketMood] = useState<number>(0);
  const [marketDrift, setMarketDrift] = useState<number>(0);
  const [stashItems, setStashItems] = useState<GachaStashItem[]>([]);
  const [shopItems, setShopItems] = useState<GachaShopItem[]>([]);
  const [shardBalance, setShardBalance] = useState<number>(0);
  const [historyLogs, setHistoryLogs] = useState<GachaHistoryLog[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [fastPull, setFastPull] = useState(false);

  // Modals
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedRewards, setRevealedRewards] = useState<GachaRewardItem[]>([]);
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Banners, Stash, Shop data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const bannerRes = await api.get<{
        success: boolean;
        banners: GachaBanner[];
        discountPct: number;
        marketMood?: number;
        marketDrift?: number;
      }>("/api/gacha/banners");
      setBanners(bannerRes.banners);
      setDiscountPct(bannerRes.discountPct);
      if (bannerRes.marketMood !== undefined) setMarketMood(bannerRes.marketMood);
      if (bannerRes.marketDrift !== undefined) setMarketDrift(bannerRes.marketDrift);

      const stashRes = await api.get<{ success: boolean; items: GachaStashItem[] }>("/api/gacha/stash").catch(() => ({ success: true, items: [] }));
      setStashItems(stashRes.items || []);

      const shopRes = await api.get<{ success: boolean; items: GachaShopItem[]; shardBalance: number }>("/api/gacha/shop").catch(() => ({ success: true, items: [], shardBalance: 0 }));
      setShopItems(shopRes.items || []);
      setShardBalance(shopRes.shardBalance || 0);

      const histRes = await api.get<{ success: boolean; history: GachaHistoryLog[] }>("/api/gacha/history").catch(() => ({ success: true, history: [] }));
      setHistoryLogs(histRes.history || []);
    } catch (err: any) {
      console.error("[GachaAltar] Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [charId]);

  const activeBanner = banners.find((b) => b.bannerId === selectedBannerId) || banners[0];

  // Calculate dynamic 1x and 10x prices
  const price1x = activeBanner ? activeBanner.effectivePrice : 10000;
  const price10x = Math.round(price1x * 10 * 0.9);

  // Execute Pull
  const handlePull = async (count: 1 | 10) => {
    if (!charId) {
      setFeedback({ type: "error", text: "Please select an active character in the top cockpit bar first." });
      return;
    }

    const cost = count === 10 ? price10x : price1x;
    if (charZeny < cost) {
      setFeedback({
        type: "error",
        text: `Insufficient Liquid Zeny! Required: ${formatZeny(cost)} Z, Available: ${formatZeny(charZeny)} Z.`,
      });
      return;
    }

    setFeedback(null);
    if (!fastPull) {
      setIsSpinning(true);
    }

    try {
      const res = await api.post<any>("/api/gacha/pull", {
        bannerId: activeBanner.bannerId,
        count,
        charId,
      });

      if (res.success) {
        setRevealedRewards(res.rewards);

        if (!fastPull) {
          setTimeout(() => {
            setIsSpinning(false);
            setRevealModalOpen(true);
            fetchData();
            if (onRefreshBalances) onRefreshBalances();
          }, 1100);
        } else {
          setRevealModalOpen(true);
          fetchData();
          if (onRefreshBalances) onRefreshBalances();
        }
      } else {
        setIsSpinning(false);
        throw new Error(res.error || "Gacha summon failed.");
      }
    } catch (err: any) {
      setIsSpinning(false);
      setFeedback({ type: "error", text: err.message || "Failed to summon." });
    }
  };

  // 2. Directly Dismantle Rank-R items from current pull
  const [isScrappingR, setIsScrappingR] = useState(false);
  const handleScrapJustPulledR = async () => {
    const rItems = revealedRewards.filter((r) => r.tier === "R");
    if (rItems.length === 0) return;

    // Collect stash IDs
    let idsToScrap = rItems
      .map((r) => r.stashId)
      .filter((id): id is number => typeof id === "number" && id > 0);

    // Fallback: If stashId was not attached on reward objects, find matching R items from stash
    if (idsToScrap.length === 0) {
      idsToScrap = stashItems.filter((i) => i.tier === "R").slice(0, rItems.length).map((i) => i.id);
    }

    if (idsToScrap.length === 0) {
      setFeedback({ type: "error", text: "No Rank-R items found to dismantle." });
      setRevealModalOpen(false);
      return;
    }

    setIsScrappingR(true);
    try {
      const res = await api.post<{ success: boolean; shardsGained: number; totalShards: number; error?: string }>(
        "/api/gacha/stash/scrap",
        { stashIds: idsToScrap }
      );

      if (res.success) {
        setFeedback({
          type: "success",
          text: `💎 Dismantled ${idsToScrap.length} Rank-R items for +${res.shardsGained} Gacha Shards! Total: ${res.totalShards} 💎`,
        });
        setRevealModalOpen(false);
        fetchData();
        if (onRefreshBalances) onRefreshBalances();
      } else {
        throw new Error(res.error || "Failed to dismantle items.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to dismantle items." });
    } finally {
      setIsScrappingR(false);
    }
  };

  // Helper for banner icons
  const getBannerIcon = (iconName: string) => {
    switch (iconName) {
      case "flask-conical":
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />;
      case "shield":
        return <Shield className="w-3.5 h-3.5 text-info" />;
      case "crown":
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case "layers":
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-accent" />;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Cockpit Header Bar */}
      <div className="bento-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-primary tracking-tight">Midgard Egg Spinner Altar</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-bold">
                Altar of Fortune
              </span>
            </div>
            <div className="text-[11px] text-muted flex items-center gap-1.5 font-medium">
              <span>Solo-Centric Wealth & Vanity Sink</span>
              <span>•</span>
              {marketMood === 1 || discountPct > 0 ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  📈 Bull Market Subsidy (-{discountPct}% Zeny)
                </span>
              ) : marketMood === 2 || discountPct < 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  📉 Bear Market Surcharge (+{Math.abs(discountPct)}% Zeny)
                </span>
              ) : marketMood === 3 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ⚡ Chaos Volatility ({discountPct >= 0 ? `-${discountPct}` : `+${Math.abs(discountPct)}`}% Zeny)
                </span>
              ) : (
                <span className="text-muted font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted/60" />
                  ⚖️ Market Neutral (Standard Pricing)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-surface2/60 p-1 rounded-xl border border-border gap-1 text-xs">
          <button
            onClick={() => setActiveTab("altar")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "altar" ? "bg-accent text-background shadow-sm" : "text-muted hover:text-primary font-medium"
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Gacha Altar</span>
          </button>
          <button
            onClick={() => setActiveTab("stash")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === "stash" ? "bg-accent text-background shadow-sm" : "text-muted hover:text-primary font-medium"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Web Stash</span>
            {stashItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-accent text-background font-mono font-bold">
                {stashItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "shop" ? "bg-accent text-background shadow-sm" : "text-muted hover:text-primary font-medium"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Exclusives Shop</span>
          </button>
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg font-medium text-muted hover:text-primary transition-all flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        {/* Wealth Balances */}
        <div className="flex items-center gap-2.5">
          <div className="bg-surface2 border border-border px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Character Zeny</div>
              <div className="font-mono text-xs font-bold text-accent">{formatZeny(charZeny)} Z</div>
            </div>
          </div>
          <div className="bg-surface2 border border-border px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Gem className="w-4 h-4 text-purple-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Gacha Shards</div>
              <div className="font-mono text-xs font-bold text-purple-400">{shardBalance} 💎</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* VIEW 1: 🎰 GACHA ALTAR VIEW */}
      {activeTab === "altar" && (
        <div className="space-y-3.5">
          {/* 4-Banner Selector Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {banners.map((b) => {
              const isSelected = selectedBannerId === b.bannerId;
              return (
                <div
                  key={b.bannerId}
                  onClick={() => setSelectedBannerId(b.bannerId)}
                  className={`bento-card p-3 cursor-pointer transition-all relative overflow-hidden ${
                    isSelected
                      ? "border-accent bg-surface2/60 shadow-sm shadow-accent/10"
                      : "border-border hover:border-accent/40 bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      {getBannerIcon(b.icon)}
                      {b.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-bold">
                      Pity {b.pityThreshold}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted line-clamp-1 mb-2">{b.description}</div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 font-mono">
                    <span className="text-muted text-[11px]">
                      Cost:{" "}
                      {b.discountPct > 0 ? (
                        <span className="line-through text-muted/60 mr-1">{formatZeny(b.basePrice)}z</span>
                      ) : b.discountPct < 0 ? (
                        <span className="text-rose-400/80 mr-1">+{Math.abs(b.discountPct)}%</span>
                      ) : null}
                    </span>
                    <span
                      className={`font-bold ${
                        b.discountPct > 0
                          ? "text-emerald-400"
                          : b.discountPct < 0
                          ? "text-rose-400"
                          : "text-accent"
                      }`}
                    >
                      {formatZeny(b.effectivePrice)} Z
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main 5:7 Stage */}
          {activeBanner && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Left 5 Cols: Machine & Controls */}
              <div className="lg:col-span-5 bento-card p-4 flex flex-col justify-between items-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between z-10 text-xs">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>Daily Rotation Active</span>
                  </div>
                  <button
                    onClick={() => setRatesModalOpen(true)}
                    className="text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Drop Rates & Pity</span>
                  </button>
                </div>

                <EggSpinnerMachine isSpinning={isSpinning} />

                {/* Pull Controls */}
                <div className="w-full space-y-3 z-10 pt-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-primary transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={fastPull}
                        onChange={(e) => setFastPull(e.target.checked)}
                        className="rounded bg-surface2 border-border text-accent focus:ring-0"
                      />
                      <span>⚡ Fast Pull (Skip Cutscene)</span>
                    </label>
                    <span className="text-[11px] text-muted font-mono">
                      Pity: <strong className="text-accent">{activeBanner.currentPity}</strong> / {activeBanner.pityThreshold}
                    </span>
                  </div>

                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border">
                    <div
                      className="bg-gradient-to-r from-accent to-purple-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (activeBanner.currentPity / activeBanner.pityThreshold) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handlePull(1)}
                      disabled={isSpinning}
                      className="bg-surface2 hover:bg-surface2/80 text-primary border border-border font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-accent/50 shadow-sm disabled:opacity-50"
                    >
                      <span>Summon 1x</span>
                      <span className="text-[11px] font-mono text-accent">{formatZeny(price1x)} Z</span>
                    </button>
                    <button
                      onClick={() => handlePull(10)}
                      disabled={isSpinning}
                      className="bg-accent hover:bg-accent/90 text-background font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md shadow-accent/20 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1">
                        <span>Summon 10x</span>
                        <span className="text-[9px] px-1 py-0.2 bg-background/20 rounded font-mono">-10%</span>
                      </span>
                      <span className="text-[11px] font-mono font-extrabold text-background">{formatZeny(price10x)} Z</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: Daily Spotlight & Featured Items */}
              <div className="lg:col-span-7 bento-card p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-primary">{activeBanner.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                        Daily Spotlight Active
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{activeBanner.description}</p>
                  </div>

                  {/* Daily Featured SSR Card */}
                  {activeBanner.featuredSsr && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-surface2 to-surface2 border border-amber-500/30 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-400 text-background flex items-center gap-1">
                          <Sparkles className="w-3 h-3 fill-current" />
                          DAILY FEATURED SSR (50% RATE-UP)
                        </span>
                        <span className="text-xs font-bold text-amber-400 font-mono">Tier SSR (5★)</span>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
                          <img
                            src={getItemIconUrl(activeBanner.featuredSsr.nameId)}
                            alt={activeBanner.featuredSsr.itemName}
                            className="ro-icon w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-primary">
                            {activeBanner.featuredSsr.itemName}
                            {activeBanner.featuredSsr.amount > 1 && ` x${activeBanner.featuredSsr.amount}`}
                          </div>
                          <div className="text-xs text-muted leading-relaxed mt-0.5">
                            Spotlight prize for today. High probability share within the SSR tier.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Featured SR Spotlight Grid */}
                  {activeBanner.featuredSrs && activeBanner.featuredSrs.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Daily Featured SR Spotlight (50% Rate-Up)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {activeBanner.featuredSrs.map((sr) => (
                          <div key={sr.id} className="p-2.5 rounded-lg bg-surface2/60 border border-purple-500/20 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-inner">
                              <img
                                src={getItemIconUrl(sr.nameId)}
                                alt={sr.itemName}
                                className="ro-icon w-6 h-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-primary truncate">{sr.itemName}</div>
                              <div className="text-[10px] text-muted">Amount: x{sr.amount}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-2.5 rounded-lg bg-surface2/40 border border-border text-[11px] text-muted flex items-center justify-between">
                  <span>Won items are held in your Web Stash to prevent in-game inventory clutter.</span>
                  <button onClick={() => setActiveTab("stash")} className="text-accent hover:underline font-bold">
                    View Stash ({stashItems.length}) →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 📦 DEDICATED WEB GACHA STASH */}
      {activeTab === "stash" && (
        <GachaStashView
          items={stashItems}
          charId={charId}
          onRefresh={() => {
            fetchData();
            if (onRefreshBalances) onRefreshBalances();
          }}
        />
      )}

      {/* VIEW 3: 🛍️ EXCLUSIVES EXCHANGE SHOP */}
      {activeTab === "shop" && (
        <GachaExchangeShop
          items={shopItems}
          shardBalance={shardBalance}
          charId={charId}
          onPurchaseSuccess={() => {
            fetchData();
            if (onRefreshBalances) onRefreshBalances();
          }}
        />
      )}

      {/* MODALS */}
      <GachaSummonModal
        isOpen={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        items={revealedRewards}
        onScrapR={handleScrapJustPulledR}
        isScrappingR={isScrappingR}
      />

      <GachaRatesModal
        isOpen={ratesModalOpen}
        onClose={() => setRatesModalOpen(false)}
        banner={activeBanner}
      />

      <GachaHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={historyLogs}
      />
    </div>
  );
};
