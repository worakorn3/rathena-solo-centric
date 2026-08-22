import React from "react";
import { Coins, Search, User, LogOut, RefreshCw, Shield, Database } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatZeny } from "../../lib/assets";

interface HeaderProps {
  netWorth?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  netWorth,
  onRefresh,
  isRefreshing = false,
  onOpenSearch,
}) => {
  const { user, openLoginModal, logout } = useAuth();

  return (
    <header className="bg-[#151c27] border-b-2 border-ro-borderMedium px-4 py-2.5 shadow-roWindow relative z-20">
      {/* Subtle top glare */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10"></div>
      
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded shadow-roDeepInset bg-[#1a2332] border border-ro-gold flex items-center justify-center">
            <Shield className="text-ro-gold" size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel font-black text-sm sm:text-base tracking-widest text-slate-100 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Photonic <span className="text-ro-gold">Singularity</span>
              </span>
              <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" />
                SOLO RO
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-sans tracking-wide text-slate-300">Player Portal</span>
              <span className="text-ro-borderMedium">•</span>
              <span className="flex items-center gap-1 text-sky-300/80 font-mono">
                <Database size={11} />
                Replica :3307 (RO)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Net Worth Ticker (if logged in) */}
        {user && netWorth !== undefined && (
          <div className="hidden md:flex items-center space-x-2.5 bg-ro-bg border-2 border-ro-borderMedium shadow-roInset px-4 py-1.5 rounded-md">
            <Coins className="text-ro-zeny" size={16} />
            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Net Worth:</span>
            <span className="text-sm font-black font-mono text-ro-zeny drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              {formatZeny(netWorth)} <span className="text-[10px] text-amber-200/80 font-sans">Z</span>
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Public Armory Search */}
          <button
            onClick={onOpenSearch}
            className="ro-button flex items-center space-x-1.5 py-1 px-2.5"
            title="Search character armory"
          >
            <Search size={13} className="text-sky-300" />
            <span className="hidden sm:inline">Armory Search</span>
          </button>

          {/* Manual Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`ro-button flex items-center space-x-1.5 py-1 px-2.5 ${
                isRefreshing ? "opacity-60 cursor-not-allowed" : ""
              }`}
              title="Manual Data Sync"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-ro-gold" : ""} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          {/* User Status / Login */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="ro-inset px-2.5 py-1 flex items-center space-x-1.5 text-xs text-slate-200">
                <User size={13} className="text-ro-gold" />
                <span className="font-semibold text-slate-100">{user.userid}</span>
                <span className="text-[10px] text-slate-400 font-mono">#{user.accountId}</span>
              </div>
              <button
                onClick={logout}
                className="ro-button hover:border-red-500/50 hover:bg-red-950/40 p-1.5"
                title="Logout"
              >
                <LogOut size={13} className="text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="ro-button-gold flex items-center space-x-1.5 py-1 px-3"
            >
              <User size={13} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
