import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { NetWorthCard } from "./components/economy/NetWorthCard";
import { AssetAllocationPie } from "./components/economy/AssetAllocationPie";
import { BankWidget } from "./components/economy/BankWidget";
import { StockPortfolio } from "./components/economy/StockPortfolio";
import { StockTransactionHistory } from "./components/economy/StockTransactionHistory";
import { MarketWatch } from "./components/economy/MarketWatch";
import { CharSelector } from "./components/character/CharSelector";
import { StatusWindow } from "./components/character/StatusWindow";
import { Paperdoll } from "./components/character/Paperdoll";
import { KillTracker } from "./components/tracking/KillTracker";
import { PublicSearch } from "./components/armory/PublicSearch";
import { BountyBoard } from "./components/economy/BountyBoard";
import { GachaAltar } from "./components/gacha/GachaAltar";
import { LeisureView } from "./components/leisure/LeisureView";
import { GlobalAudioDock } from "./components/leisure/GlobalAudioDock";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { KeyboardShortcutsModal } from "./components/common/KeyboardShortcutsModal";
import { LoginModal } from "./components/auth/LoginModal";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { AdminVaultWindow } from "./components/admin/AdminVaultWindow";
import { PullToRefresh } from "./components/common/PullToRefresh";
import { useAuth } from "./context/AuthContext";
import { AudioProvider, useAudio } from "./context/AudioContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { api } from "./lib/api";
import {
  CharacterDetail,
  CharacterSummary,
  NetWorthSummary,
  ProgressionSummary,
  StockMarketQuote,
} from "@rathena/shared";
import { Coins, Shield, Skull, Target, User, Sparkles, Briefcase, Landmark, PieChart, History } from "lucide-react";

const VALID_TABS: Record<string, NavTab> = {
  character: "CHARACTER",
  finance: "FINANCE",
  leisure: "LEISURE",
  progression: "PROGRESSION",
  bounties: "BOUNTIES",
  gacha: "GACHA",
  login: "LOGIN",
  register: "REGISTER",
};

const getTabFromHash = (): NavTab => {
  if (typeof window === "undefined") return "CHARACTER";
  const hash = window.location.hash.replace("#", "").toLowerCase();
  return VALID_TABS[hash] || "CHARACTER";
};

export const AppContent: React.FC = () => {
  const { user, openLoginModal, logout } = useAuth();
  // ponytail: url hash persistence for active tab across reload & back/forward history
  const [activeTab, setActiveTab] = useState<NavTab>(getTabFromHash);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminVaultOpen, setIsAdminVaultOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authenticated Player Data State
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [selectedCharDetail, setSelectedCharDetail] = useState<CharacterDetail | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [portfolioAssetFilter, setPortfolioAssetFilter] = useState<"INDICES" | "ALL" | "EQUITY" | "CRYPTO" | "ETF">("ALL");
  const [portfolioTab, setPortfolioTab] = useState<"HOLDINGS" | "BANK" | "BREAKDOWN" | "HISTORY">("HOLDINGS");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);

  // Public Market Data
  const [quotes, setQuotes] = useState<StockMarketQuote[]>([]);
  const [marketMood, setMarketMood] = useState(0);
  const [marketDrift, setMarketDrift] = useState(0);
  const [equitiesMood, setEquitiesMood] = useState(0);
  const [equitiesDrift, setEquitiesDrift] = useState(0);
  const [cryptoMood, setCryptoMood] = useState(0);
  const [cryptoDrift, setCryptoDrift] = useState(0);
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
          equitiesMood?: number;
          equitiesDrift?: number;
          cryptoMood?: number;
          cryptoDrift?: number;
          latestEvent?: any;
        }>("/api/economy/quotes"),
        api.get<{ success: boolean; rankings: CharacterSummary[] }>("/api/character/rankings"),
      ]);
      if (qRes.success) {
        setQuotes(qRes.quotes);
        if (qRes.marketMood !== undefined) setMarketMood(qRes.marketMood);
        if (qRes.marketDrift !== undefined) setMarketDrift(qRes.marketDrift);
        if (qRes.equitiesMood !== undefined) setEquitiesMood(qRes.equitiesMood);
        if (qRes.equitiesDrift !== undefined) setEquitiesDrift(qRes.equitiesDrift);
        if (qRes.cryptoMood !== undefined) setCryptoMood(qRes.cryptoMood);
        if (qRes.cryptoDrift !== undefined) setCryptoDrift(qRes.cryptoDrift);
        if (qRes.latestEvent !== undefined) setLatestEvent(qRes.latestEvent);
      }
      if (rRes.success) setRankings(rRes.rankings);
    } catch (err) {
      console.error("Failed to refresh public market data:", err);
      throw err;
    }
  }, []);

  const loadUserData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsRefreshing(true);
    try {
      const fetchDetailPromise = selectedCharId
        ? api.get<{ success: boolean; character: CharacterDetail }>(`/api/character/${selectedCharId}`).catch(() => null)
        : Promise.resolve(null);

      const [nwRes, charsRes, progRes, detailRes] = await Promise.all([
        api.get<{ success: boolean; data: NetWorthSummary }>("/api/economy/net-worth"),
        api.get<{ success: boolean; characters: CharacterSummary[] }>("/api/character/my-characters"),
        api.get<{ success: boolean; progression: ProgressionSummary }>("/api/tracking/progression"),
        fetchDetailPromise,
      ]);

      if (nwRes.success) setNetWorth(nwRes.data);
      if (progRes.success) setProgression(progRes.progression);
      if (detailRes && detailRes.success && detailRes.character) {
        setSelectedCharDetail(detailRes.character);
      }

      if (charsRes.success && charsRes.characters.length > 0) {
        setCharacters(charsRes.characters);
        if (!selectedCharId || !charsRes.characters.some((c) => c.charId === selectedCharId)) {
          setSelectedCharId(charsRes.characters[0].charId);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
      if (!silent) throw err;
    } finally {
      if (!silent) setIsRefreshing(false);
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

  // Periodic background polling for market ticks on desktop only (30s)
  useEffect(() => {
    // Disable interval on mobile devices: rely exclusively on action triggers & user focus
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    if (isMobile) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (user) {
        loadUserData(true);
      } else {
        loadPublicData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, loadUserData, loadPublicData]);

  // Immediate refresh when browser tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (user) {
          loadUserData(true);
        } else {
          loadPublicData();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, loadUserData, loadPublicData]);

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

  const { togglePlay, startRadio, hasStarted } = useAudio();

  // Global Keyboard Navigation & Cockpit Shortcuts Engine
  useKeyboardShortcuts({
    onNavigateTab: handleTabChange,
    onOpenSearch: () => setIsSearchOpen(true),
    onSync: () => {
      if (user) loadUserData();
      else loadPublicData();
    },
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    onToggleAudio: () => {
      if (!hasStarted) startRadio();
      else togglePlay();
    },
    characters,
    selectedCharId,
    onSelectChar: setSelectedCharId,
  });

  const isUserAdmin = Boolean(user && user.groupId >= 1);

  const activeChar =
    (selectedCharDetail && selectedCharDetail.charId === selectedCharId ? selectedCharDetail : null) ||
    characters.find((c) => c.charId === selectedCharId) ||
    (characters.length > 0 ? characters[0] : null);

  const activeCharZeny =
    characters.find((c) => c.charId === selectedCharId)?.zeny ??
    selectedCharDetail?.zeny ??
    activeChar?.zeny ??
    0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-background text-primary font-sans antialiased select-none">
      {/* 1. LEFT VERTICAL COCKPIT RAIL (Desktop) & TOP/BOTTOM BARS (Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={user ? loadUserData : loadPublicData}
        isRefreshing={isRefreshing}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={isUserAdmin ? () => setIsAdminVaultOpen(true) : undefined}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        user={user}
        openLoginModal={openLoginModal}
        logout={logout}
      />

      {/* 2. MAIN STAGE (Mobile: smooth vertical scroll; Desktop: zero body scrolling cockpit) */}
      <main className="flex-1 min-w-0 h-auto md:h-screen md:overflow-hidden p-3 md:p-4 pb-24 md:pb-4 overflow-x-hidden relative flex flex-col">
        <PullToRefresh
          onRefresh={user ? loadUserData : loadPublicData}
          isRefreshing={isRefreshing}
        >
          {/* ==================== TAB 1: ⚔️ HERO / CHARACTER & GEAR ==================== */}
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

                {(() => {
                  const activeChar =
                    selectedCharDetail && selectedCharDetail.charId === selectedCharId
                      ? selectedCharDetail
                      : characters.find((c) => c.charId === selectedCharId) || selectedCharDetail;

                  if (!activeChar) {
                    return (
                      <div className="bento-card flex-1 flex items-center justify-center text-xs text-muted font-medium">
                        Select a character above to inspect equipment paperdoll and combat telemetry.
                      </div>
                    );
                  }

                  return (
                    /* 6:6 Balanced Split: Left Combat Sheet & Expedition, Right 10-Slot Paperdoll & Inspector */
                    <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
                      <div className="col-span-12 lg:col-span-6 min-h-0 h-full">
                        <StatusWindow key={activeChar.charId} char={activeChar} />
                      </div>
                      <div className="col-span-12 lg:col-span-6 min-h-0 h-full">
                        <Paperdoll
                          paperdoll={
                            selectedCharDetail?.charId === activeChar.charId
                              ? selectedCharDetail.paperdoll
                              : {}
                          }
                        />
                      </div>
                    </div>
                  );
                })()}
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
                    onClick={() => handleTabChange("LOGIN")}
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

        {/* ==================== TAB 2: 💰 FINANCIAL HQ ==================== */}
        {activeTab === "FINANCE" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user && netWorth ? (
              <>
                {/* Hero Net Worth Bar */}
                <NetWorthCard
                  summary={netWorth}
                  characters={characters}
                  onSelectTab={setPortfolioTab}
                />

                {/* 5:7 Balanced Bento Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
                  {/* Left 5 Cols: Unified Account & Asset Hub (IBKR Style) */}
                  <div className="col-span-12 lg:col-span-5 flex flex-col gap-2 min-h-0">
                    {/* IBKR-Style Sub-Navigation Segmented Control */}
                    <div className="flex items-center justify-between p-1 bg-surface2/60 rounded-xl border border-border/80 shrink-0 text-xs font-mono">
                      <div className="flex items-center gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => setPortfolioTab("HOLDINGS")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-colors duration-150 whitespace-nowrap group ${
                            portfolioTab === "HOLDINGS"
                              ? "bg-surface text-primary shadow-sm border border-border"
                              : "text-muted hover:text-primary hover:bg-surface2/80"
                          }`}
                        >
                          <Briefcase className={`w-3.5 h-3.5 transition-colors ${portfolioTab === "HOLDINGS" ? "text-info" : "text-muted group-hover:text-info"}`} />
                          <span>Positions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioTab("BANK")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-colors duration-150 whitespace-nowrap group ${
                            portfolioTab === "BANK"
                              ? "bg-surface text-primary shadow-sm border border-border"
                              : "text-muted hover:text-primary hover:bg-surface2/80"
                          }`}
                        >
                          <Landmark className={`w-3.5 h-3.5 transition-colors ${portfolioTab === "BANK" ? "text-accent" : "text-muted group-hover:text-accent"}`} />
                          <span>Bank Vault</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioTab("BREAKDOWN")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-colors duration-150 whitespace-nowrap group ${
                            portfolioTab === "BREAKDOWN"
                              ? "bg-surface text-primary shadow-sm border border-border"
                              : "text-muted hover:text-primary hover:bg-surface2/80"
                          }`}
                        >
                          <PieChart className={`w-3.5 h-3.5 transition-colors ${portfolioTab === "BREAKDOWN" ? "text-purple-400" : "text-muted group-hover:text-purple-400"}`} />
                          <span>Allocation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioTab("HISTORY")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-colors duration-150 whitespace-nowrap group ${
                            portfolioTab === "HISTORY"
                              ? "bg-surface text-primary shadow-sm border border-border"
                              : "text-muted hover:text-primary hover:bg-surface2/80"
                          }`}
                        >
                          <History className={`w-3.5 h-3.5 transition-colors ${portfolioTab === "HISTORY" ? "text-success" : "text-muted group-hover:text-success"}`} />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Tab View */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      {portfolioTab === "HOLDINGS" && (
                        <StockPortfolio
                          holdings={netWorth.holdings}
                          totalNetWorth={netWorth.totalNetWorth}
                          assetClassTab={portfolioAssetFilter}
                          onAssetClassChange={(tab) => {
                            setPortfolioAssetFilter(tab);
                          }}
                          onSelectTicker={(ticker) => {
                            setSelectedTicker(ticker);
                            setSelectedIndexId(null);
                          }}
                          onRefresh={loadUserData}
                        />
                      )}
                      {portfolioTab === "BANK" && (
                        <ErrorBoundary>
                          <BankWidget
                            bank={netWorth.bank}
                            characters={characters}
                            selectedCharId={selectedCharId}
                            onRefresh={loadUserData}
                          />
                        </ErrorBoundary>
                      )}
                      {portfolioTab === "BREAKDOWN" && (
                        <AssetAllocationPie
                          liquidZeny={netWorth.liquidZeny}
                          bankTotal={netWorth.bankTotal}
                          stockMarketValue={netWorth.stockMarketValue}
                          municipalMarketValue={netWorth.municipalMarketValue}
                          cryptoMarketValue={netWorth.cryptoMarketValue}
                          etfMarketValue={netWorth.etfMarketValue}
                          totalNetWorth={netWorth.totalNetWorth}
                          characters={characters}
                          selectedAssetCategory={portfolioAssetFilter}
                          onSelectAssetCategory={(cat) => {
                            setPortfolioAssetFilter(cat);
                            setPortfolioTab("HOLDINGS");
                          }}
                        />
                      )}
                      {portfolioTab === "HISTORY" && (
                        <ErrorBoundary>
                          <StockTransactionHistory className="flex-1 min-h-0" />
                        </ErrorBoundary>
                      )}
                    </div>
                  </div>

                  {/* Right 7 Cols: Full Stock Exchange Terminal */}
                  <div className="col-span-12 lg:col-span-7 min-h-0">
                    <MarketWatch
                      quotes={netWorth.quotes}
                      indices={netWorth.indices}
                      marketMood={netWorth.marketMood}
                      marketDrift={netWorth.marketDrift}
                      equitiesMood={netWorth.equitiesMood}
                      equitiesDrift={netWorth.equitiesDrift}
                      cryptoMood={netWorth.cryptoMood}
                      cryptoDrift={netWorth.cryptoDrift}
                      latestEvent={netWorth.latestEvent}
                      selectedTicker={selectedTicker}
                      selectedIndexId={selectedIndexId}
                      onSelectTicker={(t) => {
                        setSelectedTicker(t);
                        setSelectedIndexId(null);
                      }}
                      onSelectIndex={(idxId) => {
                        setSelectedIndexId(idxId);
                        setSelectedTicker(null);
                      }}
                      filterTab={portfolioAssetFilter}
                      onFilterChange={setPortfolioAssetFilter}
                      onTradeSuccess={() => loadUserData(true)}
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
                    onClick={() => handleTabChange("LOGIN")}
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
                    equitiesMood={equitiesMood}
                    equitiesDrift={equitiesDrift}
                    cryptoMood={cryptoMood}
                    cryptoDrift={cryptoDrift}
                    latestEvent={latestEvent}
                    filterTab={portfolioAssetFilter}
                    onFilterChange={setPortfolioAssetFilter}
                    onTradeSuccess={loadPublicData}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ☕ LEISURE & OFFLINE PROGRESSION ==================== */}
        <div
          className={
            activeTab === "LEISURE"
              ? "flex-1 min-h-0 flex flex-col gap-3"
              : "fixed -left-[99999px] -top-[99999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
          }
        >
          {user && characters.length > 0 && (
            <CharSelector
              characters={characters}
              selectedCharId={selectedCharId}
              onSelect={setSelectedCharId}
            />
          )}
          <ErrorBoundary>
            <LeisureView
              characters={characters}
              selectedCharId={selectedCharId}
              selectedCharDetail={selectedCharDetail}
              onSelectChar={setSelectedCharId}
            />
          </ErrorBoundary>
        </div>

        {/* ==================== TAB 4: 📜 SOLO PROGRESSION & HUNT TRACKER ==================== */}
        {activeTab === "PROGRESSION" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user && progression ? (
              <>
                {characters.length > 0 && (
                  <CharSelector
                    characters={characters}
                    selectedCharId={selectedCharId}
                    onSelect={setSelectedCharId}
                  />
                )}
                <KillTracker
                  progression={progression}
                  selectedCharId={selectedCharId}
                  selectedCharName={
                    characters.find((c) => c.charId === selectedCharId)?.name ||
                    selectedCharDetail?.name
                  }
                  onClaimSuccess={() => loadUserData(true)}
                />
              </>
            ) : (

              <div className="bento-card flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/20 mx-auto flex items-center justify-center">
                  <Skull className="text-danger w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-primary mb-1">
                    Hunting Journal & Bounties
                  </h2>
                  <p className="text-xs font-medium text-muted max-w-md mx-auto">
                    Track your lifetime monster hunts, MvP triumphs, and unlock bounty rewards sent straight to your in-game RODEX mailbox. Log in to view your hunting progress.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange("LOGIN")}
                  className="bg-danger hover:bg-danger/90 text-background font-bold py-2 px-5 rounded-md text-xs transition-colors mt-2"
                >
                  Log In to View Hunting Journal
                </button>

              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: 🎯 DAILY BOUNTIES ==================== */}
        {activeTab === "BOUNTIES" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user && characters.length > 0 && (
              <CharSelector
                characters={characters}
                selectedCharId={selectedCharId}
                onSelect={setSelectedCharId}
              />
            )}
            <ErrorBoundary>
              <BountyBoard
                characters={characters}
                selectedCharId={selectedCharId}
                selectedCharDetail={selectedCharDetail}
                onSelectChar={setSelectedCharId}
                onRefreshUserData={loadUserData}
                user={user}
                onOpenLoginModal={openLoginModal}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* ==================== TAB 6: 🎰 GACHA ALTAR ==================== */}
        {activeTab === "GACHA" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {user && characters.length > 0 && (
              <CharSelector
                characters={characters}
                selectedCharId={selectedCharId}
                onSelect={setSelectedCharId}
              />
            )}
            <ErrorBoundary>
              <GachaAltar
                charId={selectedCharId}
                charZeny={activeCharZeny}
                onRefreshBalances={loadUserData}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* ==================== TAB 6: 🔐 DEDICATED LOGIN ==================== */}
        {activeTab === "LOGIN" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            <ErrorBoundary>
              <LoginPage onNavigate={handleTabChange} />
            </ErrorBoundary>
          </div>
        )}

        {/* ==================== TAB 7: 📝 DEDICATED REGISTER ==================== */}
        {activeTab === "REGISTER" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            <ErrorBoundary>
              <RegisterPage onNavigate={handleTabChange} />
            </ErrorBoundary>
          </div>
        )}
        </PullToRefresh>
      </main>

      {/* Persistent Global Background Audio Dock */}
      <GlobalAudioDock activeTab={activeTab} onNavigateTab={setActiveTab} />

      {/* Global Modals */}
      <LoginModal />
      <PublicSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      {isAdminVaultOpen && <AdminVaultWindow onClose={() => setIsAdminVaultOpen(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
};
