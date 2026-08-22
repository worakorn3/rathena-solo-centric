import React from "react";
import { Coins, Search, User, LogOut, Shield, Database } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatZeny } from "../../lib/assets";
import { SyncButton } from "./SyncButton";

interface HeaderProps {
  netWorth?: number;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  netWorth,
  onRefresh,
  onOpenSearch,
}) => {
  const { user, openLoginModal, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-border px-4 py-2.5 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-surface2 border border-border flex items-center justify-center">
            <Shield className="text-accent" size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base text-primary uppercase">
                Photonic <span className="text-accent">Singularity</span>
              </span>
              <span className="bg-success/10 border border-success/20 text-success text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" />
                SOLO RO
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <span className="font-medium">Player Portal</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-info font-mono">
                <Database size={11} />
                Replica :3307 (RO)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Net Worth Ticker (if logged in) */}
        {user && netWorth !== undefined && (
          <div className="hidden md:flex items-center space-x-2.5 bg-surface2 border border-border px-4 py-1.5 rounded-md">
            <Coins className="text-accent" size={16} />
            <span className="text-[11px] text-muted font-bold uppercase tracking-wider">Net Worth:</span>
            <span className="text-sm font-bold font-mono text-accent">
              {formatZeny(netWorth)} <span className="text-[10px] opacity-80 font-sans">Z</span>
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Public Armory Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded hover:bg-surface2 transition-colors text-muted hover:text-primary text-sm font-medium"
            title="Search character armory"
          >
            <Search size={14} className="text-info" />
            <span className="hidden sm:inline">Armory Search</span>
          </button>

          {/* Manual Refresh / Sync Button */}
          {onRefresh && <SyncButton onSync={onRefresh} />}


          {/* User Status / Login */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="bg-surface2 border border-border px-2.5 py-1 rounded flex items-center space-x-1.5 text-xs">
                <User size={13} className="text-accent" />
                <span className="font-semibold text-primary">{user.userid}</span>
                <span className="text-[10px] text-muted font-mono">#{user.accountId}</span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded hover:bg-danger/20 text-danger/70 hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-background font-bold py-1.5 px-3 rounded text-sm transition-colors"
            >
              <User size={14} />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
