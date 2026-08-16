import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { NetWorthCard } from "./components/economy/NetWorthCard";
import { BankWidget } from "./components/economy/BankWidget";
import { StockPortfolio } from "./components/economy/StockPortfolio";
import { MarketWatch } from "./components/economy/MarketWatch";
import { CharSelector } from "./components/character/CharSelector";
import { StatusWindow } from "./components/character/StatusWindow";
import { Paperdoll } from "./components/character/Paperdoll";
import { KillTracker } from "./components/tracking/KillTracker";
import { PublicSearch } from "./components/armory/PublicSearch";
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
import { Coins, Shield, Skull, Search, User, Sparkles } from "lucide-react";

export const App: React.FC = () => {
  const { user, openLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"FINANCE" | "CHARACTER" | "PROGRESSION" | "ARMORY">("FINANCE");
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
  const [rankings, setRankings] = useState<CharacterSummary[]>([]);

  // Load Public Data
  const loadPublicData = useCallback(async () => {
    try {
      const [qRes, rRes] = await Promise.all([
        api.get<{ success: boolean; quotes: StockMarketQuote[] }>("/api/economy/quotes"),
        api.get<{ success: boolean; rankings: CharacterSummary[] }>("/api/character/rankings"),
      ]);
      if (qRes.success) setQuotes(qRes.quotes);
      if (rRes.success) setRankings(rRes.rankings);
    } catch {
      // Ignore
    }
  }, []);

  // Load Authenticated Player Data
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
        // Default select first character if none selected
        if (!selectedCharId || !charsRes.characters.some((c) => c.charId === selectedCharId)) {
          setSelectedCharId(charsRes.characters[0].charId);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [user, selectedCharId]);

  // Load Selected Character Detail (with Paperdoll)
  useEffect(() => {
    if (!selectedCharId) {
      setSelectedCharDetail(null);
      return;
    }
    api.get<{ success: boolean; character: CharacterDetail }>(`/api/character/${selectedCharId}`)
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

  return (
    <div className="min-h-screen bg-[#121824] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        netWorth={netWorth?.totalNetWorth}
        onRefresh={user ? loadUserData : loadPublicData}
        isRefreshing={isRefreshing}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ro-borderLight/30 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("FINANCE")}
              className={`ro-button flex items-center space-x-1.5 py-1.5 px-3 ${
                activeTab === "FINANCE"
                  ? "bg-gradient-to-b from-[#e5a824] to-[#b37e0e] text-slate-950 font-bold border-[#ffe194]"
                  : ""
              }`}
            >
              <Coins size={14} className={activeTab === "FINANCE" ? "text-slate-950" : "text-amber-400"} />
              <span>💰 Financial HQ</span>
              <span className="bg-amber-900/40 text-[9px] font-mono px-1 rounded uppercase font-bold text-amber-200">
                Top Priority
              </span>
            </button>

            <button
              onClick={() => setActiveTab("CHARACTER")}
              className={`ro-button flex items-center space-x-1.5 py-1.5 px-3 ${
                activeTab === "CHARACTER"
                  ? "bg-gradient-to-b from-[#e5a824] to-[#b37e0e] text-slate-950 font-bold border-[#ffe194]"
                  : ""
              }`}
            >
              <Shield size={14} className={activeTab === "CHARACTER" ? "text-slate-950" : "text-sky-400"} />
              <span>⚔️ Character & Gear</span>
            </button>

            <button
              onClick={() => setActiveTab("PROGRESSION")}
              className={`ro-button flex items-center space-x-1.5 py-1.5 px-3 ${
                activeTab === "PROGRESSION"
                  ? "bg-gradient-to-b from-[#e5a824] to-[#b37e0e] text-slate-950 font-bold border-[#ffe194]"
                  : ""
              }`}
            >
              <Skull size={14} className={activeTab === "PROGRESSION" ? "text-slate-950" : "text-red-400"} />
              <span>📜 Solo Progression</span>
            </button>
          </div>

          {!user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Viewing public data. Log in to access your personal vault.
              </span>
              <button
                onClick={openLoginModal}
                className="ro-button-gold flex items-center gap-1.5 text-xs py-1 px-3"
              >
                <User size={13} />
                <span>Account Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: 💰 FINANCIAL HQ (Top Priority) */}
        {activeTab === "FINANCE" && (
          <div className="space-y-4">
            {user && netWorth ? (
              <>
                <NetWorthCard summary={netWorth} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <BankWidget bank={netWorth.bank} />
                  <StockPortfolio holdings={netWorth.holdings} />
                </div>
                <MarketWatch quotes={netWorth.quotes} />
              </>
            ) : (
              /* Public / Logged Out Finance Preview */
              <div className="space-y-4">
                <div className="ro-window p-6 text-center space-y-3 bg-[#1e2736]">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-ro-gold mx-auto flex items-center justify-center">
                    <Coins className="text-ro-gold" size={24} />
                  </div>
                  <h2 className="font-cinzel font-bold text-base text-slate-100 uppercase">
                    Personal Economy & Wealth Dashboard
                  </h2>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Track your combined Net Worth across characters, calculate real-time Investment Bank accrued interest, and manage your Midgard Municipal stock positions.
                  </p>
                  <button
                    onClick={openLoginModal}
                    className="ro-button-gold py-1.5 px-5 text-xs font-semibold"
                  >
                    Log In to View Your Assets
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MarketWatch quotes={quotes} />
                  <div className="ro-window p-4 space-y-3">
                    <div className="ro-titlebar -mx-4 -mt-4 mb-3">
                      <span className="font-cinzel font-bold text-xs uppercase text-slate-100">
                        Solo Economy Highlights
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Investment Bank (Prontera 165, 180):</strong> Earn 1% daily interest on deposited Zeny (capped at 10% after 10 days).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Midgard Stock Exchange:</strong> Buy shares in Prontera, Geffen, Morroc, and Payon municipal enterprises. Collect daily dividends.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Zero Game Impact:</strong> Live queries run 100% on the Read-Only Replica (:3307).
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: ⚔️ CHARACTER & GEAR */}
        {activeTab === "CHARACTER" && (
          <div className="space-y-4">
            {user ? (
              <>
                <CharSelector
                  characters={characters}
                  selectedCharId={selectedCharId}
                  onSelect={setSelectedCharId}
                />

                {selectedCharDetail ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StatusWindow char={selectedCharDetail} />
                    <Paperdoll paperdoll={selectedCharDetail.paperdoll} />
                  </div>
                ) : (
                  <div className="ro-inset p-8 text-center text-xs text-slate-400 font-mono">
                    Select a character above to inspect equipment paperdoll and status.
                  </div>
                )}
              </>
            ) : (
              <div className="ro-window p-6 text-center space-y-3 bg-[#1e2736]">
                <Shield className="mx-auto text-sky-400" size={32} />
                <h2 className="font-cinzel font-bold text-base text-slate-100 uppercase">
                  Character & Paperdoll Viewer
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Log in to inspect your character status, equipped gear, refinement levels, and slotted cards. Or use Armory Search to inspect public players.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={openLoginModal}
                    className="ro-button-gold py-1.5 px-4 text-xs font-semibold"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="ro-button py-1.5 px-4 text-xs font-semibold"
                  >
                    Search Public Armory
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: 📜 SOLO PROGRESSION */}
        {activeTab === "PROGRESSION" && (
          <div className="space-y-4">
            {user && progression ? (
              <KillTracker progression={progression} />
            ) : (
              <div className="ro-window p-6 text-center space-y-3 bg-[#1e2736]">
                <Skull className="mx-auto text-red-400" size={32} />
                <h2 className="font-cinzel font-bold text-base text-slate-100 uppercase">
                  Solo Persistence & Monster Hunt Tracker
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Silently records your lifetime monster kills and rare loot discoveries directly into the solo persistence log. Log in to view your milestones.
                </p>
                <button
                  onClick={openLoginModal}
                  className="ro-button-gold py-1.5 px-5 text-xs font-semibold"
                >
                  Log In to View Hunting Records
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ro-borderLight/20 py-3 px-4 bg-[#0e141e] text-center text-[11px] text-slate-500 font-mono">
        Photonic Singularity • Ragnarok Solo-Centric Portal • Connected to MariaDB Replica (:3307)
      </footer>

      {/* Modals */}
      <LoginModal />
      <PublicSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
