import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { NetWorthCard } from "./components/economy/NetWorthCard";
import { AssetAllocationPie } from "./components/economy/AssetAllocationPie";
import { BankWidget } from "./components/economy/BankWidget";
import { StockPortfolio } from "./components/economy/StockPortfolio";
import { MarketWatch } from "./components/economy/MarketWatch";
import { CharSelector } from "./components/character/CharSelector";
import { StatusWindow } from "./components/character/StatusWindow";
import { Paperdoll } from "./components/character/Paperdoll";
import { KillTracker } from "./components/tracking/KillTracker";
import { PublicSearch } from "./components/armory/PublicSearch";
import { BountyBoard } from "./components/economy/BountyBoard";
import { LoginModal } from "./components/auth/LoginModal";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import {
  CharacterDetail,
  CharacterSummary,
  NetWorthSummary,
  ProgressionSummary,
  StockMarketQuote,
} from "@rathena/shared";
import { Coins, Shield, Skull, Target, User } from "lucide-react";

const VALID_TABS: Record<string, NavTab> = {
  finance: "FINANCE",
  character: "CHARACTER",
  progression: "PROGRESSION",
  bounties: "BOUNTIES",
};

const getTabFromHash = (): NavTab => {
  if (typeof window === "undefined") return "FINANCE";
  const hash = window.location.hash.replace("#", "").toLowerCase();
  return VALID_TABS[hash] || "FINANCE";
};

export const App: React.FC = () => {
  const { user, openLoginModal, logout } = useAuth();
  // ponytail: url hash persistence for active tab across reload & back/forward history
  const [activeTab, setActiveTab] = useState<NavTab>(getTabFromHash);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authenticated Player Data State
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [selectedCharDetail, setSelectedCharDetail] = useState<CharacterDetail | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);

  // Public Market Data
  const [quotes, setQuotes] = useState<StockMarketQuote[]>([]);
  const [marketMood, setMarketMood] = useState(0);
  const [marketDrift, setMarketDrift] = useState(0);
  const [latestEvent, setLatestEvent] = useState<any>(null);
  const [rankings, setRankings] = useState<CharacterSummary[]>([]);

  const loadPublicData = useCallback(async () => {
    try {
      const [qRes, rRes] = await Promise.all([
        api.get<{
          success: boolean;
          quotes: StockMarketQuote[];
          marketMood?: number;
          marketDrift?: number;
          latestEvent?: any;
        }>("/api/economy/quotes"),
        api.get<{ success: boolean; rankings: CharacterSummary[] }>("/api/character/rankings"),
      ]);
      if (qRes.success) {
        setQuotes(qRes.quotes);
        if (qRes.marketMood !== undefined) setMarketMood(qRes.marketMood);
        if (qRes.marketDrift !== undefined) setMarketDrift(qRes.marketDrift);
        if (qRes.latestEvent !== undefined) setLatestEvent(qRes.latestEvent);
      }
      if (rRes.success) setRankings(rRes.rankings);
    } catch (err) {
      console.error("Failed to refresh public market data:", err);
      throw err;
    }
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [nwRes, charsRes, progRes] = await Promise.all([
        api.get<{ success: boolean; data: NetWorthSummary }>("/api/economy/net-worth"),
        api.get<{ success: boolean; characters: CharacterSummary[] }>("/api/character/my-characters"),
        api.get<{ success: boolean; progression: ProgressionSummary }>("/api/tracking/progression"),
      ]);

      if (nwRes.success) setNetWorth(nwRes.data);
      if (progRes.success) setProgression(progRes.progression);

      if (charsRes.success && charsRes.characters.length > 0) {
        setCharacters(charsRes.characters);
        if (!selectedCharId || !charsRes.characters.some((c) => c.charId === selectedCharId)) {
          setSelectedCharId(charsRes.characters[0].charId);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  }, [user, selectedCharId]);

  useEffect(() => {
    if (!selectedCharId) {
      setSelectedCharDetail(null);
      return;
    }
    api
      .get<{ success: boolean; character: CharacterDetail }>(`/api/character/${selectedCharId}`)
      .then((res) => {
        if (res.success) setSelectedCharDetail(res.character);
      })
      .catch(() => {});
  }, [selectedCharId]);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setNetWorth(null);
      setCharacters([]);
      setSelectedCharId(null);
      setSelectedCharDetail(null);
      setProgression(null);
    }
  }, [user, loadUserData]);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab.toLowerCase();
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:max-h-screen overflow-y-auto md:overflow-hidden bg-background text-primary font-sans antialiased select-none">
      {/* 1. LEFT VERTICAL COCKPIT RAIL (Desktop) & TOP/BOTTOM BARS (Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={user ? loadUserData : loadPublicData}
        isRefreshing={isRefreshing}
        onOpenSearch={() => setIsSearchOpen(true)}
        user={user}
        openLoginModal={openLoginModal}
        logout={logout}
      />

      {/* 2. MAIN STAGE (Mobile: smooth vertical scroll; Desktop: zero body scrolling cockpit) */}
      <main className="flex-1 min-w-0 h-auto md:h-screen overflow-y-auto md:overflow-hidden p-3 md:p-4 pb-20 md:pb-4 relative flex flex-col">
        {/* ==================== TAB 1: 💰 FINANCIAL HQ ==================== */}
        {activeTab === "FINANCE" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user && netWorth ? (
              <>
                {/* Hero Net Worth Bar */}
                <NetWorthCard summary={netWorth} />

                {/* 5:7 Balanced Bento Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
                  {/* Left 5 Cols: Top Sub-row (Donut + Bank) & Expanded Municipal Portfolio */}
                  <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                      <AssetAllocationPie
                        liquidZeny={netWorth.liquidZeny}
                        bankTotal={netWorth.bankTotal}
                        stockMarketValue={netWorth.stockMarketValue}
                        totalNetWorth={netWorth.totalNetWorth}
                      />
                      <BankWidget bank={netWorth.bank} />
                    </div>
                    <StockPortfolio holdings={netWorth.holdings} />
                  </div>

                  {/* Right 7 Cols: Full Stock Exchange Terminal */}
                  <div className="col-span-12 lg:col-span-7 min-h-0">
                    <MarketWatch
                      quotes={netWorth.quotes}
                      marketMood={netWorth.marketMood}
                      marketDrift={netWorth.marketDrift}
                      latestEvent={netWorth.latestEvent}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Public / Logged Out Finance Preview */
              <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="bento-card text-center space-y-3 py-8 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 mx-auto flex items-center justify-center">
                    <Coins className="text-accent w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-primary mb-1">
                      Personal Economy & Wealth Dashboard
                    </h2>
                    <p className="text-xs text-muted font-medium max-w-md mx-auto">
                      Track your combined Net Worth across characters, calculate real-time Investment Bank accrued interest, and manage your Midgard Municipal stock positions.
                    </p>
                  </div>
                  <button
                    onClick={openLoginModal}
                    className="bg-accent hover:bg-accent/90 text-background font-bold py-2 px-5 rounded-md text-xs transition-colors inline-block mt-2"
                  >
                    Log In to View Your Assets
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <MarketWatch
                    quotes={quotes}
                    marketMood={marketMood}
                    marketDrift={marketDrift}
                    latestEvent={latestEvent}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: ⚔️ HERO / CHARACTER & GEAR ==================== */}
        {activeTab === "CHARACTER" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user ? (
              <>
                {/* Top Character Selector & Location Strip */}
                <CharSelector
                  characters={characters}
                  selectedCharId={selectedCharId}
                  onSelect={setSelectedCharId}
                />

                {selectedCharDetail ? (
                  /* 6:6 Balanced Split: Left Combat Sheet & Expedition, Right 10-Slot Paperdoll & Inspector */
                  <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
                    <div className="col-span-12 lg:col-span-6 min-h-0 h-full">
                      <StatusWindow char={selectedCharDetail} />
                    </div>
                    <div className="col-span-12 lg:col-span-6 min-h-0 h-full">
                      <Paperdoll paperdoll={selectedCharDetail.paperdoll} />
                    </div>
                  </div>
                ) : (
                  <div className="bento-card flex-1 flex items-center justify-center text-xs text-muted font-medium">
                    Select a character above to inspect equipment paperdoll and combat telemetry.
                  </div>
                )}
              </>
            ) : (
              <div className="bento-card flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-14 h-14 rounded-full bg-info/10 border border-info/20 mx-auto flex items-center justify-center">
                  <Shield className="text-info w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-primary mb-1">
                    Character & Equipment Paperdoll
                  </h2>
                  <p className="text-xs font-medium text-muted max-w-md mx-auto">
                    Log in to inspect your character status, equipped gear, refinement levels, and slotted cards. Or use Armory Search to inspect public players.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={openLoginModal}
                    className="bg-primary hover:bg-primary/90 text-background font-bold py-2 px-5 rounded-md text-xs transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="bg-surface2 hover:bg-surface2/80 text-primary font-bold py-2 px-5 rounded-md border border-border text-xs transition-colors"
                  >
                    Search Public Armory
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: 📜 SOLO PROGRESSION & HUNT TRACKER ==================== */}
        {activeTab === "PROGRESSION" && (
          <div className="flex-1 min-h-0 flex flex-col">
            {user && progression ? (
              <KillTracker progression={progression} />
            ) : (
              <div className="bento-card flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/20 mx-auto flex items-center justify-center">
                  <Skull className="text-danger w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-primary mb-1">
                    Solo Persistence & Hunt Tracker
                  </h2>
                  <p className="text-xs font-medium text-muted max-w-md mx-auto">
                    Silently records your lifetime monster kills, MvP triumphs, and rare loot discoveries directly into the solo persistence log. Log in to view your hunting milestones.
                  </p>
                </div>
                <button
                  onClick={openLoginModal}
                  className="bg-danger hover:bg-danger/90 text-background font-bold py-2 px-5 rounded-md text-xs transition-colors mt-2"
                >
                  Log In to View Hunting Records
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: 🎯 DAILY BOUNTIES ==================== */}
        {activeTab === "BOUNTIES" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <BountyBoard />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <LoginModal />
      <PublicSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
