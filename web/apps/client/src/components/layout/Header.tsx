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
    <header className="bg-gradient-to-r from-[#17202e] via-[#1e2a3c] to-[#17202e] border-b-2 border-ro-borderLight/40 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#2b3a50] border border-ro-gold flex items-center justify-center shadow-roWindow">
            <Shield className="text-ro-gold" size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel font-black text-sm sm:text-base tracking-wider text-slate-100 uppercase">
                Photonic <span className="text-ro-gold">Singularity</span>
              </span>
              <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SOLO RO
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Player Portal</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-300/80">
                <Database size={11} />
                Replica :3307 (RO)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Net Worth Ticker (if logged in) */}
        {user && netWorth !== undefined && (
          <div className="hidden md:flex items-center space-x-2 ro-inset px-3 py-1.5 border border-ro-gold/30">
            <Coins className="text-ro-zeny" size={16} />
            <span className="text-xs text-slate-300 font-medium">Net Worth:</span>
            <span className="text-sm font-bold font-mono text-ro-zeny">
              {formatZeny(netWorth)} <span className="text-[10px] text-amber-200/80">Z</span>
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
