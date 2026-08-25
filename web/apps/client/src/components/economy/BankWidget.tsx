import React, { useState } from "react";
import { Landmark, Clock, CheckCircle2, AlertTriangle, ArrowRight, Wallet, User, Coins, Sparkles } from "lucide-react";
import { BankData, CharacterSummary } from "@rathena/shared";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";

interface BankWidgetProps {
  bank?: BankData;
  characters?: CharacterSummary[];
  selectedCharId?: number | null;
  onRefresh?: () => Promise<void>;
}

export const BankWidget: React.FC<BankWidgetProps> = ({
  bank,
  characters = [],
  selectedCharId,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "DEPOSIT" | "WITHDRAW">("OVERVIEW");
  const [localCharId, setLocalCharId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const safeChars = Array.isArray(characters) ? characters : [];
  
  // Resolve active character: local selection -> prop selectedCharId -> first character
  const activeCharId = localCharId ?? selectedCharId ?? (safeChars.length > 0 ? safeChars[0].charId : null);
  const selectedChar = safeChars.find((c) => c.charId === activeCharId) || (safeChars.length > 0 ? safeChars[0] : undefined);
  const isOnline = selectedChar?.online === 1;

  const {
    principal = 0,
    pendingInterest = 0,
    daysAccrued = 0,
    maxDays = 10,
    totalPayout = 0,
  } = bank || {};

  const progressPct = maxDays > 0 ? (daysAccrued / maxDays) * 100 : 0;
  const isCapped = daysAccrued >= maxDays;

  // Deposit Preview Math
  const parsedDeposit = Math.floor(Number(depositAmount) || 0);
  const depositFee = Math.floor(parsedDeposit / 50); // 2% fee
  const netDeposit = parsedDeposit - depositFee;
  const newPrincipalOnDeposit = principal + pendingInterest + netDeposit;

  // Withdraw Preview Math
  const parsedWithdraw = withdrawAmount === "" ? totalPayout : Math.floor(Number(withdrawAmount) || 0);
  const safeWithdraw = Math.min(Math.max(0, parsedWithdraw), totalPayout);
  const remainingPrincipalOnWithdraw = Math.max(0, totalPayout - safeWithdraw);

  const handleDeposit = async () => {
    if (!selectedChar?.charId) {
      setError("Please select a character.");
      return;
    }
    if (parsedDeposit < 100) {
      setError("Minimum deposit is 100 Zeny.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<any>("/api/economy/bank/deposit", {
        charId: selectedChar.charId,
        amount: parsedDeposit,
      });
      if (res.success) {
        setSuccess(res.message || `Deposited ${formatZeny(parsedDeposit)} Z successfully.`);
        setDepositAmount("");
        if (onRefresh) await onRefresh();
        setActiveTab("OVERVIEW");
      } else {
        setError(res.error || "Failed to deposit.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedChar?.charId) {
      setError("Please select a character.");
      return;
    }
    if (safeWithdraw <= 0) {
      setError("Please enter a valid amount to withdraw.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<any>("/api/economy/bank/withdraw", {
        charId: selectedChar.charId,
        amount: safeWithdraw >= totalPayout ? undefined : safeWithdraw,
      });
      if (res.success) {
        setSuccess(res.message || `Withdrew ${formatZeny(safeWithdraw)} Z successfully.`);
        setWithdrawAmount("");
        if (onRefresh) await onRefresh();
        setActiveTab("OVERVIEW");
      } else {
        setError(res.error || "Failed to withdraw.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bento-card p-3.5 flex flex-col justify-between shrink-0 overflow-hidden relative border border-border/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Landmark className="w-3.5 h-3.5 text-accent" />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary truncate">
            Investment Bank
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/20 shrink-0">
          +1%/day (Max 10%)
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2.5 p-0.5 bg-surface2/40 rounded-md border border-border/50 shrink-0">
        {(["OVERVIEW", "DEPOSIT", "WITHDRAW"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError(null);
              setSuccess(null);
              setDepositAmount("");
              setWithdrawAmount("");
            }}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${
              activeTab === tab
                ? "bg-surface text-primary shadow-sm border border-border"
                : "text-muted hover:text-primary hover:bg-surface2/60"
            }`}
          >
            {tab === "OVERVIEW" ? "Overview" : tab === "DEPOSIT" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-surface2/30 border border-border/50">
              <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">
                Principal
              </div>
              <div className="text-sm font-bold font-mono text-primary truncate">
                {formatZeny(principal)} Z
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-surface2/30 border border-border/50 text-right">
              <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">
                Accrued Interest
              </div>
              <div className="text-sm font-bold font-mono text-accent truncate">
                +{formatZeny(pendingInterest)} Z
              </div>
            </div>
          </div>

          {/* Accrual Progress */}
          <div className="p-2.5 rounded-lg bg-surface2/20 border border-border/40 space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-info" /> Accrual Progress
              </span>
              <span className={`font-bold ${isCapped ? "text-accent" : "text-primary"}`}>
                {daysAccrued}/{maxDays} Days {isCapped ? "(Capped)" : ""}
              </span>
            </div>
            <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isCapped ? "bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.5)]" : "bg-info"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono pt-1.5 text-muted border-t border-border/40">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Accessible:</span>
            <span className="font-bold text-primary text-sm font-mono">{formatZeny(totalPayout)} Z</span>
          </div>
        </div>
      )}

      {/* Tab 2: Deposit */}
      {activeTab === "DEPOSIT" && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-150">
          {/* Character Selector */}
          <div className="bg-surface2/30 p-2 rounded-lg border border-border/50 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted flex items-center gap-1">
                <User className="w-3 h-3 text-accent" /> Source Account:
              </span>
              <span className="font-mono text-accent font-bold">
                {formatZeny(selectedChar?.zeny || 0)} Z
              </span>
            </div>
            {safeChars.length > 1 ? (
              <select
                value={selectedChar?.charId || ""}
                onChange={(e) => setLocalCharId(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-primary font-bold outline-none focus:border-accent"
              >
                {safeChars.map((c) => (
                  <option key={c.charId} value={c.charId}>
                    {c.name} (Lv.{c.baseLevel} {c.className}) — {formatZeny(c.zeny)} Z {c.online === 1 ? "[ONLINE]" : "[OFFLINE]"}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-bold text-primary flex justify-between">
                <span>{selectedChar?.name || "No character found"}</span>
                {selectedChar && (
                  <span className={`text-[10px] ${isOnline ? "text-warning" : "text-success"}`}>
                    {isOnline ? "In-Game" : "Offline"}
                  </span>
                )}
              </div>
            )}
          </div>

          {isOnline ? (
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning flex items-start gap-1.5 text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Character is currently logged in. Please log out to perform bank transactions.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Deposit Amount (Min 100 Z)"
                    className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-accent pr-8"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-mono text-muted">Z</span>
                </div>
                <div className="flex gap-1">
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDepositAmount(Math.floor((selectedChar?.zeny || 0) * pct).toString())}
                      disabled={isLoading || !selectedChar?.zeny}
                      className="flex-1 py-1 rounded bg-surface2/40 hover:bg-surface2/80 text-[9px] font-mono font-bold text-muted hover:text-primary transition-colors border border-border/40 disabled:opacity-40"
                    >
                      {pct === 1 ? "MAX" : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              {parsedDeposit > 0 && (
                <div className="bg-surface2/20 border border-border/40 rounded-lg p-2 text-[10px] space-y-1">
                  <div className="flex justify-between text-muted">
                    <span>Deposit Amount:</span>
                    <span className="font-mono">{formatZeny(parsedDeposit)} Z</span>
                  </div>
                  <div className="flex justify-between text-warning">
                    <span>Deposit Fee (2%):</span>
                    <span className="font-mono">-{formatZeny(depositFee)} Z</span>
                  </div>
                  {pendingInterest > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Compound Interest:</span>
                      <span className="font-mono">+{formatZeny(pendingInterest)} Z</span>
                    </div>
                  )}
                  <div className="border-t border-border/40 my-0.5 pt-1 flex justify-between font-bold text-primary">
                    <span>New Total Principal:</span>
                    <span className="font-mono text-accent">{formatZeny(newPrincipalOnDeposit)} Z</span>
                  </div>
                </div>
              )}

              {error && <div className="text-[10px] text-error font-bold">{error}</div>}
              {success && (
                <div className="text-[10px] text-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {success}
                </div>
              )}

              <button
                onClick={handleDeposit}
                disabled={isLoading || !selectedChar || parsedDeposit < 100 || parsedDeposit > (selectedChar?.zeny || 0)}
                className="w-full py-2 rounded-md bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs uppercase tracking-wider border border-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-1.5"
              >
                {isLoading ? "Processing..." : "Confirm Deposit"}
                {!isLoading && <Wallet className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Withdraw */}
      {activeTab === "WITHDRAW" && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-150">
          {/* Character Selector */}
          <div className="bg-surface2/30 p-2 rounded-lg border border-border/50 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted flex items-center gap-1">
                <User className="w-3 h-3 text-accent" /> Receiving Character:
              </span>
              <span className="font-mono text-accent font-bold">
                {formatZeny(selectedChar?.zeny || 0)} Z
              </span>
            </div>
            {safeChars.length > 1 ? (
              <select
                value={selectedChar?.charId || ""}
                onChange={(e) => setLocalCharId(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-primary font-bold outline-none focus:border-accent"
              >
                {safeChars.map((c) => (
                  <option key={c.charId} value={c.charId}>
                    {c.name} (Lv.{c.baseLevel} {c.className}) — {formatZeny(c.zeny)} Z {c.online === 1 ? "[ONLINE]" : "[OFFLINE]"}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-bold text-primary flex justify-between">
                <span>{selectedChar?.name || "No character found"}</span>
                {selectedChar && (
                  <span className={`text-[10px] ${isOnline ? "text-warning" : "text-success"}`}>
                    {isOnline ? "In-Game" : "Offline"}
                  </span>
                )}
              </div>
            )}
          </div>

          {isOnline ? (
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning flex items-start gap-1.5 text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Character is currently logged in. Please log out to perform bank transactions.</p>
            </div>
          ) : totalPayout <= 0 ? (
            <div className="p-4 text-center text-muted text-xs bg-surface2/20 rounded-lg border border-border/40">
              No active balance or interest available to withdraw.
            </div>
          ) : (
            <>
              {/* Amount Input & Preset Chips */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="number"
                    placeholder={`Withdraw Amount (Max ${formatZeny(totalPayout)} Z)`}
                    className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-primary outline-none focus:border-accent pr-8"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-mono text-muted">Z</span>
                </div>
                <div className="flex gap-1">
                  {[0.25, 0.5, 0.75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setWithdrawAmount(Math.floor(totalPayout * pct).toString())}
                      disabled={isLoading || totalPayout <= 0}
                      className="flex-1 py-1 rounded bg-surface2/40 hover:bg-surface2/80 text-[9px] font-mono font-bold text-muted hover:text-primary transition-colors border border-border/40 disabled:opacity-40"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                  {pendingInterest > 0 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(pendingInterest.toString())}
                      disabled={isLoading}
                      className="py-1 px-1.5 rounded bg-accent/15 hover:bg-accent/30 text-[9px] font-mono font-bold text-accent transition-colors border border-accent/30"
                      title="Withdraw only accumulated interest"
                    >
                      Interest
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(totalPayout.toString())}
                    disabled={isLoading || totalPayout <= 0}
                    className="flex-1 py-1 rounded bg-surface2/40 hover:bg-surface2/80 text-[9px] font-mono font-bold text-muted hover:text-primary transition-colors border border-border/40 disabled:opacity-40"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="bg-surface2/20 border border-border/40 rounded-lg p-2 text-[10px] space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Withdrawing:</span>
                  <span className="font-mono font-bold text-primary">{formatZeny(safeWithdraw)} Z</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Remaining Principal:</span>
                  <span className="font-mono">{formatZeny(remainingPrincipalOnWithdraw)} Z</span>
                </div>
              </div>

              {error && <div className="text-[10px] text-error font-bold">{error}</div>}
              {success && (
                <div className="text-[10px] text-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {success}
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={isLoading || !selectedChar || safeWithdraw <= 0}
                className="w-full py-2 rounded-md bg-success/20 hover:bg-success/30 text-success font-bold text-xs uppercase tracking-wider border border-success/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-1.5"
              >
                {isLoading ? "Processing..." : safeWithdraw >= totalPayout ? "Liquidate All" : "Confirm Withdrawal"}
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
