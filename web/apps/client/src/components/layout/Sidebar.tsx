import React, { useState, useEffect } from "react";
import {
  Shield,
  BarChart3,
  UserCheck,
  Headphones,
  Skull,
  Target,
  Sparkles,
  RefreshCw,
  Search,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import { AuthUser } from "@rathena/shared";
import { RoIcon } from "../common/RoIcon";

export type NavTab = "FINANCE" | "CHARACTER" | "LEISURE" | "PROGRESSION" | "BOUNTIES" | "GACHA" | "LOGIN" | "REGISTER";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  onOpenSearch: () => void;
  onOpenAdmin?: () => void;
  onOpenShortcuts?: () => void;
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
  onOpenShortcuts,
  user,
  openLoginModal,
  logout,
}) => {
  const [localSpinning, setLocalSpinning] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Close More Drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMoreDrawerOpen) {
        setIsMoreDrawerOpen(false);
      }
    };
    if (isMoreDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoreDrawerOpen]);

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
            <RoIcon className="w-5 h-5 text-accent" />
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
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "CHARACTER"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Hero & Paperdoll [1]"
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
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "FINANCE"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Financial HQ [2]"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[8px] font-bold mt-0.5 tracking-tight">Finance</span>
              {activeTab === "FINANCE" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 3: Leisure Lounge */}
            <button
              onClick={() => onTabChange("LEISURE")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "LEISURE"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Leisure & Radio Lounge [3]"
            >
              <Headphones className="w-4 h-4" />
              <span className="text-[8px] font-bold mt-0.5 tracking-tight">Leisure</span>
              {activeTab === "LEISURE" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 4: Progression / Hunt Tracker */}
            <button
              onClick={() => onTabChange("PROGRESSION")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "PROGRESSION"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Solo Hunt Tracker [4]"
            >
              <Skull className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Hunt</span>
              {activeTab === "PROGRESSION" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 5: Daily Bounties */}
            <button
              onClick={() => onTabChange("BOUNTIES")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "BOUNTIES"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Daily Bounties [5]"
            >
              <Target className="w-4 h-4" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight">Bounty</span>
              {activeTab === "BOUNTIES" && (
                <span className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-accent rounded-r" />
              )}
            </button>

            {/* Tab 6: Gacha Altar */}
            <button
              onClick={() => onTabChange("GACHA")}
              className={`rail-btn relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
                activeTab === "GACHA"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-primary hover:bg-surface2"
              }`}
              title="Gacha Altar [6]"
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
                className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all group disabled:opacity-50 cursor-pointer"
                title="Sync Live Realm Data [R]"
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
              className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
              title="Armory Search [/]"
            >
              <Search className="w-4 h-4 text-info" />
            </button>

            {/* Keyboard Shortcuts HUD Button */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border flex items-center justify-center text-muted hover:text-accent transition-all cursor-pointer"
                title="Keyboard Shortcuts [?]"
              >
                <Keyboard className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </button>
            )}

            {/* Admin & Vault Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-10 h-10 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border hover:border-ro-gold/40 flex items-center justify-center text-ro-gold transition-all cursor-pointer"
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
              onClick={() => onTabChange("LOGIN")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shadow-sm ${
                activeTab === "LOGIN" || activeTab === "REGISTER"
                  ? "bg-accent text-background"
                  : "bg-primary hover:bg-primary/90 text-background"
              }`}
              title="Log In / Register"
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
            <RoIcon className="w-4 h-4 text-accent" />
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
              onClick={() => onTabChange("LOGIN")}
              className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm ${
                activeTab === "LOGIN" || activeTab === "REGISTER"
                  ? "bg-accent text-background"
                  : "bg-primary hover:bg-primary/90 text-background"
              }`}
              title="Log In"
            >
              <User size={13} />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE VIEWPORT: Fixed 5-Tab Navigation Bar & More Drawer (md:hidden)  */}
      {/* ========================================================================= */}
      {(() => {
        const isMoreTabActive = activeTab === "BOUNTIES" || activeTab === "GACHA";
        const moreTabLabel =
          activeTab === "BOUNTIES" ? "Bounty" : activeTab === "GACHA" ? "Gacha" : "More";

        return (
          <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border px-1.5 py-1 flex items-center justify-around shadow-2xl select-none pb-safe">
              {/* Tab 1: Character / Hero */}
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onTabChange("CHARACTER");
                }}
                className={`flex-1 min-w-0 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeTab === "CHARACTER"
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
                    : "text-muted hover:text-primary border border-transparent font-medium"
                }`}
                title="Hero"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span className="text-[10px] mt-0.5 tracking-tight truncate">Hero</span>
              </button>

              {/* Tab 2: Finance */}
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onTabChange("FINANCE");
                }}
                className={`flex-1 min-w-0 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeTab === "FINANCE"
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
                    : "text-muted hover:text-primary border border-transparent font-medium"
                }`}
                title="Finance"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="text-[10px] mt-0.5 tracking-tight truncate">Finance</span>
              </button>

              {/* Tab 3: Leisure */}
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onTabChange("LEISURE");
                }}
                className={`flex-1 min-w-0 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeTab === "LEISURE"
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
                    : "text-muted hover:text-primary border border-transparent font-medium"
                }`}
                title="Leisure"
              >
                <Headphones className="w-4 h-4 shrink-0" />
                <span className="text-[10px] mt-0.5 tracking-tight truncate">Leisure</span>
              </button>

              {/* Tab 4: Progression / Hunt */}
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onTabChange("PROGRESSION");
                }}
                className={`flex-1 min-w-0 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeTab === "PROGRESSION"
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
                    : "text-muted hover:text-primary border border-transparent font-medium"
                }`}
                title="Hunt"
              >
                <Skull className="w-4 h-4 shrink-0" />
                <span className="text-[10px] mt-0.5 tracking-tight truncate">Hunt</span>
              </button>

              {/* Tab 5: More Hub / Drawer Trigger */}
              <button
                onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
                className={`flex-1 min-w-0 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all relative ${
                  isMoreTabActive || isMoreDrawerOpen
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold shadow-sm"
                    : "text-muted hover:text-primary border border-transparent font-medium"
                }`}
                title="More Activities & Hub"
                aria-expanded={isMoreDrawerOpen}
              >
                {isMoreDrawerOpen ? (
                  <X className="w-4 h-4 shrink-0 text-accent" />
                ) : isMoreTabActive && activeTab === "BOUNTIES" ? (
                  <Target className="w-4 h-4 shrink-0 text-accent" />
                ) : isMoreTabActive && activeTab === "GACHA" ? (
                  <Sparkles className="w-4 h-4 shrink-0 text-accent" />
                ) : (
                  <Menu className="w-4 h-4 shrink-0" />
                )}
                <span className="text-[10px] mt-0.5 tracking-tight truncate flex items-center gap-1">
                  <span>{moreTabLabel}</span>
                  {isMoreTabActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                  )}
                </span>
              </button>
            </nav>

            {/* Mobile Bottom Sheet Drawer for Secondary Activities */}
            {isMoreDrawerOpen && (
              <div
                className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setIsMoreDrawerOpen(false)}
              >
                <div
                  className="bg-surface border-t border-border rounded-t-2xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drawer Handle & Header */}
                  <div className="flex flex-col gap-1.5 border-b border-border pb-2.5">
                    <div className="w-10 h-1 rounded-full bg-border mx-auto shrink-0 mb-1" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RoIcon className="w-4 h-4 text-accent" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-primary">
                          Activities & Realm Hub
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsMoreDrawerOpen(false)}
                        className="p-1 rounded-lg bg-surface2/60 hover:bg-surface2 text-muted hover:text-primary transition-colors text-xs"
                        aria-label="Close drawer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Bento Grid of Extended Actions */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Activity 1: Daily Junk Trader Bounties */}
                    <button
                      onClick={() => {
                        setIsMoreDrawerOpen(false);
                        onTabChange("BOUNTIES");
                      }}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-left transition-all group ${
                        activeTab === "BOUNTIES"
                          ? "bg-accent/15 border-accent/40 text-primary shadow-sm"
                          : "bg-surface2/40 hover:bg-surface2/80 border-border/80 text-muted hover:text-primary"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-accent/10 border border-accent/25 text-accent shrink-0 mt-0.5">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-primary group-hover:text-accent transition-colors flex items-center gap-1">
                          <span>Daily Bounties</span>
                          <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                          Junk Trader turn-ins & boosted payouts
                        </div>
                      </div>
                    </button>

                    {/* Activity 2: Gacha Altar */}
                    <button
                      onClick={() => {
                        setIsMoreDrawerOpen(false);
                        onTabChange("GACHA");
                      }}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-left transition-all group ${
                        activeTab === "GACHA"
                          ? "bg-accent/15 border-accent/40 text-primary shadow-sm"
                          : "bg-surface2/40 hover:bg-surface2/80 border-border/80 text-muted hover:text-primary"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-primary group-hover:text-purple-400 transition-colors flex items-center gap-1">
                          <span>Gacha Altar</span>
                          <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                          Egg Spinner machine & rewards stash
                        </div>
                      </div>
                    </button>

                    {/* Activity 3: Public Armory Search */}
                    <button
                      onClick={() => {
                        setIsMoreDrawerOpen(false);
                        onOpenSearch();
                      }}
                      className="p-3 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-border/80 hover:border-info/40 text-muted hover:text-primary flex items-start gap-2.5 text-left transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-info/10 border border-info/25 text-info shrink-0 mt-0.5">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-primary group-hover:text-info transition-colors flex items-center gap-1">
                          <span>Armory Search</span>
                          <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                          Inspect player gear & builds
                        </div>
                      </div>
                    </button>

                    {/* Activity 4: Admin Vault (if permitted) OR Sync Data */}
                    {onOpenAdmin ? (
                      <button
                        onClick={() => {
                          setIsMoreDrawerOpen(false);
                          onOpenAdmin();
                        }}
                        className="p-3 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-border/80 hover:border-ro-gold/40 text-muted hover:text-primary flex items-start gap-2.5 text-left transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-ro-gold shrink-0 mt-0.5">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-primary group-hover:text-ro-gold transition-colors flex items-center gap-1">
                            <span>System Vault</span>
                            <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                            Admin controls & server backups
                          </div>
                        </div>
                      </button>
                    ) : onRefresh ? (
                      <button
                        onClick={() => {
                          setIsMoreDrawerOpen(false);
                          handleSyncClick();
                        }}
                        className="p-3 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-border/80 hover:border-accent/40 text-muted hover:text-primary flex items-start gap-2.5 text-left transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-surface2 border border-border text-accent shrink-0 mt-0.5">
                          <RefreshCw className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-primary group-hover:text-accent transition-colors flex items-center gap-1">
                            <span>Live Sync</span>
                            <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                            Refresh realm quotes & status
                          </div>
                        </div>
                      </button>
                    ) : null}

                    {/* Activity 5: Keyboard Shortcuts Guide */}
                    {onOpenShortcuts && (
                      <button
                        onClick={() => {
                          setIsMoreDrawerOpen(false);
                          onOpenShortcuts();
                        }}
                        className="p-3 rounded-xl bg-surface2/40 hover:bg-surface2/80 border border-border/80 hover:border-accent/40 text-muted hover:text-primary flex items-start gap-2.5 text-left transition-all group col-span-2 cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-surface2 border border-border text-accent shrink-0 mt-0.5">
                          <Keyboard className="w-4 h-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-primary group-hover:text-accent transition-colors flex items-center gap-1">
                            <span>Keyboard Shortcuts HUD</span>
                            <ChevronRight className="w-3 h-3 text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted font-medium mt-0.5 line-clamp-2">
                            Quick navigation hotkeys [1-6], search [/], and realm sync [R]
                          </div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Drawer Footer Notice */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Kafra Live Network
                    </span>
                    <span>Tap outside to close</span>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </>
  );
};
