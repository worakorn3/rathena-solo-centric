import React, { useState } from "react";
import {
  Shield,
  BarChart3,
  UserCheck,
  Skull,
  Target,
  Sparkles,
  RefreshCw,
  Search,
  User,
  LogOut,
} from "lucide-react";
import { AuthUser } from "@rathena/shared";

export type NavTab = "FINANCE" | "CHARACTER" | "PROGRESSION" | "BOUNTIES" | "GACHA";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  onOpenSearch: () => void;
  onOpenAdmin?: () => void;
  user: AuthUser | null;
  openLoginModal: () => void;
  logout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing = false,
  onOpenSearch,
  onOpenAdmin,
  user,
  openLoginModal,
  logout,
}) => {
  const [localSpinning, setLocalSpinning] = useState(false);

  const handleSyncClick = async () => {
    if (onRefresh) {
      setLocalSpinning(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setLocalSpinning(false), 600);
      }
    }
  };

  const spinning = isRefreshing || localSpinning;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEWPORT: Exact 16-width Left Cockpit Rail (md:flex)           */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-16 bg-surface border-r border-border flex-col items-center py-4 px-2 shrink-0 z-30 justify-between h-screen sticky top-0 select-none">
        {/* Top Section: Brand & Primary Navigation Tabs */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Brand Logo with Integrated Live Pulse Indicator */}
          <div
            className="relative w-10 h-10 rounded-xl bg-surface2 border border-border flex items-center justify-center shadow-inner cursor-pointer hover:border-accent/50 transition-colors"
            title="Photonic Singularity • Solo RO"
          >
            <Shield className="w-5 h-5 text-accent" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-surface animate-pulse shadow-[0_0_6px_#4ade80]"
              title="Kafra Live Network: Synchronized"
            />
          </div>

          <div className="w-6 h-px bg-border my-1" />

          {/* Primary Navigation Tabs */}
          <nav className="flex flex-col items-center gap-3.5 w-full">
            {/* Tab 1: Character / Hero */}
            <button
              onClick={() => onTabChange("CHARACTER")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
                activeTab === "CHARACTER"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Character & Paperdoll"
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Hero</span>
              {activeTab === "CHARACTER" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 2: Financial HQ */}
            <button
              onClick={() => onTabChange("FINANCE")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
                activeTab === "FINANCE"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Financial HQ"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[8px] font-bold mt-0.5 tracking-tight">Finance</span>
              {activeTab === "FINANCE" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 3: Progression / Hunt Tracker */}
            <button
              onClick={() => onTabChange("PROGRESSION")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
                activeTab === "PROGRESSION"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Solo Hunt Tracker"
            >
              <Skull className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Hunt</span>
              {activeTab === "PROGRESSION" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 4: Daily Bounties */}
            <button
              onClick={() => onTabChange("BOUNTIES")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
                activeTab === "BOUNTIES"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Daily Bounties"
            >
              <Target className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Bounty</span>
              {activeTab === "BOUNTIES" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 5: Gacha Altar */}
            <button
              onClick={() => onTabChange("GACHA")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
                activeTab === "GACHA"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Midgard Egg Spinner Altar"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Gacha</span>
              {activeTab === "GACHA" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Section: Utility Tools & User Account */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Utility Tools Group */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* Manual Refresh / Sync Button */}
            {onRefresh && (
              <button
                onClick={handleSyncClick}
                disabled={spinning}
                className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all group disabled:opacity-50"
                title="Sync Live Realm Data"
              >
                <RefreshCw
                  className={`w-4 h-4 text-accent transition-transform ${
                    spinning ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}

            {/* Armory Search Button */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all"
              title="Armory Search"
            >
              <Search className="w-4 h-4 text-info" />
            </button>

            {/* Admin & Vault Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border hover:border-ro-gold/40 flex items-center justify-center text-ro-gold transition-all"
                title="System Setup & Zero-Knowledge Vault"
              >
                <Shield className="w-4 h-4 text-ro-gold" />
              </button>
            )}
          </div>

          <div className="w-6 h-px bg-border my-1" />

          {/* User Badge / Login Action */}
          {user ? (
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div
                className="w-10 h-10 rounded-xl bg-surface2 border border-accent/40 flex items-center justify-center text-accent font-bold text-xs shadow-inner cursor-default uppercase"
                title={`Logged in as ${user.userid}`}
              >
                {user.userid.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="w-10 h-6 rounded-lg bg-surface2/40 hover:bg-danger/20 text-muted hover:text-danger flex items-center justify-center border border-border/50 transition-colors text-[10px]"
                title="Logout"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-background flex items-center justify-center font-bold transition-colors shadow-sm"
              title="Log In"
            >
              <User size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEWPORT: Streamlined Top Header Bar (md:hidden)                */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-surface/95 backdrop-blur border-b border-border px-3.5 py-2 flex items-center justify-between shadow-sm select-none">
        {/* Brand & Live Sync Badge */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center shadow-inner">
            <Shield className="w-4 h-4 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success ring-1 ring-surface animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-xs text-primary uppercase tracking-wide">
                Photonic <span className="text-accent">RO</span>
              </span>
            </div>
            <span className="text-[10px] text-muted font-medium">Solo Portal</span>
          </div>
        </div>

        {/* Streamlined Quick Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={handleSyncClick}
              disabled={spinning}
              className="w-8 h-8 rounded-lg bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all disabled:opacity-50"
              title="Sync Data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-accent transition-transform ${
                  spinning ? "animate-spin" : ""
                }`}
              />
            </button>
          )}

          {/* Armory Search Button */}
          <button
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-lg bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all"
            title="Armory Search"
          >
            <Search className="w-3.5 h-3.5 text-info" />
          </button>

          {/* Admin Button (Mobile) */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-8 h-8 rounded-lg bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-ro-gold transition-all"
              title="Server Management & Backups"
            >
              <Shield className="w-3.5 h-3.5 text-ro-gold" />
            </button>
          )}

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-1 pl-1.5 border-l border-border">
              <div
                className="w-8 h-8 rounded-lg bg-surface2 border border-accent/40 flex items-center justify-center text-accent font-bold text-xs uppercase"
                title={`Logged in as ${user.userid}`}
              >
                {user.userid.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg bg-surface2/40 hover:bg-danger/20 border border-border flex items-center justify-center text-muted hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-background font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Log In"
            >
              <User size={13} />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE VIEWPORT: Fixed Bottom Navigation Tab Bar (md:hidden)           */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border px-2 py-1 flex items-center justify-around shadow-2xl select-none pb-safe">
        {/* Tab 1: Character / Hero */}
        <button
          onClick={() => onTabChange("CHARACTER")}
          className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === "CHARACTER"
              ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
              : "text-muted hover:text-primary font-medium"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Hero</span>
        </button>

        {/* Tab 2: Finance */}
        <button
          onClick={() => onTabChange("FINANCE")}
          className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === "FINANCE"
              ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
              : "text-muted hover:text-primary font-medium"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Finance</span>
        </button>

        {/* Tab 3: Progression / Hunt */}
        <button
          onClick={() => onTabChange("PROGRESSION")}
          className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === "PROGRESSION"
              ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
              : "text-muted hover:text-primary font-medium"
          }`}
        >
          <Skull className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Hunt</span>
        </button>

        {/* Tab 4: Daily Bounties */}
        <button
          onClick={() => onTabChange("BOUNTIES")}
          className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === "BOUNTIES"
              ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
              : "text-muted hover:text-primary font-medium"
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Bounty</span>
        </button>

        {/* Tab 5: Gacha Altar */}
        <button
          onClick={() => onTabChange("GACHA")}
          className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
            activeTab === "GACHA"
              ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
              : "text-muted hover:text-primary font-medium"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Gacha</span>
        </button>
      </nav>
    </>
  );
};
