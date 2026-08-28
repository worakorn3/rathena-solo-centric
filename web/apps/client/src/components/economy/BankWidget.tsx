import React, { useState } from "react";
import { Landmark, Clock, CheckCircle2, AlertTriangle, ArrowRight, Wallet, User } from "lucide-react";
import { BankData, CharacterSummary, BANK_CONFIG } from "@rathena/shared";
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
    interestPaidTotal = 0,
    subdayProgressSeconds = 0,
    interestRate = 0.01,
    depositFeeRate = 0.02,
    maxPrincipalLimit = 1900000000,
  } = bank || {};

  const progressPct = maxDays > 0 ? (daysAccrued / maxDays) * 100 : 0;
  const isCapped = daysAccrued >= maxDays;
  const subdayHours = Math.floor(subdayProgressSeconds / 3600);
  const subdayMinutes = Math.floor((subdayProgressSeconds % 3600) / 60);

  // Deposit Preview Math
  const parsedDeposit = Math.floor(Number(depositAmount) || 0);
  const depositFee = Math.floor(parsedDeposit * depositFeeRate);
  const netDeposit = parsedDeposit - depositFee;
  const newPrincipalOnDeposit = principal + pendingInterest + netDeposit;

  // Withdraw Preview Math (strict input amount)
  const parsedWithdraw = Math.floor(Number(withdrawAmount) || 0);
  const safeWithdraw = Math.min(parsedWithdraw, totalPayout);
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
    if (parsedWithdraw <= 0) {
      setError("Please enter a valid amount to withdraw.");
      return;
    }
    if (parsedWithdraw > totalPayout) {
      setError(`Cannot withdraw more than accessible balance (${formatZeny(totalPayout)} Z).`);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<any>("/api/economy/bank/withdraw", {
        charId: selectedChar.charId,
        amount: parsedWithdraw,
      });
      if (res.success) {
        setSuccess(res.message || `Withdrew ${formatZeny(parsedWithdraw)} Z successfully.`);
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
    <div className="bento-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col overflow-hidden border border-border/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Landmark className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary">
              Midgard Sovereign Bank
            </h3>
            <span className="text-[10px] text-muted">Fixed-Yield Vault System</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2.5 p-1 bg-surface2/50 rounded-lg border border-border/50 shrink-0">
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
            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${
              activeTab === tab
                ? "bg-surface text-primary shadow-sm border border-border"
                : "text-muted hover:text-primary hover:bg-surface2/80"
            }`}
          >
            {tab === "OVERVIEW" ? "Vault Overview" : tab === "DEPOSIT" ? "Deposit Funds" : "Withdraw Funds"}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "OVERVIEW" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-y-auto animate-in fade-in duration-150">
          <div className="space-y-2">
            {/* Principal & Interest Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-surface2/30 border border-border/50">
                <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">
                  Active Principal
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-primary truncate">
                  {formatZeny(principal)} Z
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface2/30 border border-border/50 text-right">
                <div className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">
                  Accrued Interest
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-accent truncate">
                  +{formatZeny(pendingInterest)} Z
                </div>
              </div>
            </div>

            {/* Accrual Progress */}
            <div className="p-2.5 rounded-xl bg-surface2/20 border border-border/40 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-info" /> Interest Accumulation
                </span>
                <span className={`font-bold ${isCapped ? "text-accent" : "text-primary"}`}>
                  {daysAccrued}/{maxDays} Days {isCapped ? "(10% Cap Reached)" : ""}
                </span>
              </div>
              <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isCapped ? "bg-accent shadow-[0_0_10px_rgba(var(--color-accent),0.5)]" : "bg-info"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
              </div>
              {!isCapped && principal > 0 && (
                <div className="flex justify-between items-center text-[10px] font-mono text-muted pt-0.5">
                  <span>Cycle Progress ({subdayHours}h {subdayMinutes}m / 24h):</span>
                  <span className="text-accent font-semibold">Next +1% in {23 - subdayHours}h {59 - subdayMinutes}m</span>
                </div>
              )}
            </div>

            {/* Total Accessible Balance */}
            <div className="flex justify-between items-center text-xs font-mono p-2.5 rounded-xl bg-surface2/40 border border-border/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">Total Accessible:</span>
              <span className="font-bold text-accent text-sm sm:text-base font-mono">{formatZeny(totalPayout)} Z</span>
            </div>

            {/* Vault Rules / Policy & Lifetime Stats */}
            <div className="p-2.5 rounded-xl bg-surface2/20 border border-border/40 text-[11px] text-muted space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                <span>Vault Policy & Rates</span>
                <span className="text-success font-mono">{(interestRate * 100).toFixed(1)}% / Day</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Accrual Rate:</span>
                <span className="font-mono text-primary">+{(interestRate * 100).toFixed(1)}% of principal</span>
              </div>
              <div className="flex justify-between">
                <span>Accrual Duration Cap:</span>
                <span className="font-mono text-primary">{maxDays} Days (Max +{(interestRate * maxDays * 100).toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Deposit Surcharge:</span>
                <span className="font-mono text-warning">{(depositFeeRate * 100).toFixed(1)}% one-time fee</span>
              </div>
              <div className="flex justify-between">
                <span>Withdrawal Surcharge:</span>
                <span className="font-mono text-success">0% (Instant access)</span>
              </div>
              {interestPaidTotal > 0 && (
                <div className="flex justify-between border-t border-border/40 pt-1 mt-1 text-primary">
                  <span>Lifetime Interest Earned:</span>
                  <span className="font-mono font-bold text-accent">+{formatZeny(interestPaidTotal)} Z</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("DEPOSIT")}
              className="py-2 px-3 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent font-bold text-xs border border-accent/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Deposit Funds</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("WITHDRAW")}
              disabled={totalPayout <= 0}
              className="py-2 px-3 rounded-lg bg-surface2 hover:bg-surface2/80 text-primary font-bold text-xs border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Withdraw Funds</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Deposit */}
      {activeTab === "DEPOSIT" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-y-auto animate-in fade-in duration-150">
          <div className="space-y-2">
            {/* Source Character Wallet */}
            <div className="bg-surface2/30 p-2.5 rounded-xl border border-border/50 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-accent" /> Source Character (Wallet)
                </span>
                <span className="font-mono text-muted text-xs">
                  Available: <strong className="text-accent">{formatZeny(selectedChar?.zeny || 0)} Z</strong>
                </span>
              </div>
              {safeChars.length > 1 ? (
                <select
                  value={selectedChar?.charId || ""}
                  onChange={(e) => setLocalCharId(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent"
                >
                  {safeChars.map((c) => (
                    <option key={c.charId} value={c.charId}>
                      {c.name} (Lv.{c.baseLevel} {c.className}) — {formatZeny(c.zeny)} Z {c.online === 1 ? "[ONLINE]" : "[OFFLINE]"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-primary flex justify-between bg-surface/60 p-1.5 rounded-lg border border-border/40">
                  <span>{selectedChar?.name || "No character found"}</span>
                  {selectedChar && (
                    <span className={`text-[10px] ${isOnline ? "text-warning" : "text-success"}`}>
                      {isOnline ? "In-Game" : "Offline"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Destination Vault Indicator */}
            <div className="flex justify-between items-center text-[10px] font-mono px-2.5 py-1.5 bg-surface2/20 rounded-lg border border-border/40 text-muted">
              <span className="flex items-center gap-1">
                <Landmark className="w-3 h-3 text-accent" /> Destination: Midgard Sovereign Vault
              </span>
              <span>
                Current Principal: <strong className="text-primary">{formatZeny(principal)} Z</strong>
              </span>
            </div>

            {isOnline ? (
              <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Character is currently logged in. Please log out of the game to deposit funds safely.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={`Deposit Amount (Max ${formatZeny(selectedChar?.zeny || 0)} Z)`}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono text-primary outline-none focus:border-accent pr-8"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-2 text-sm font-mono text-muted">Z</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDepositAmount(Math.floor((selectedChar?.zeny || 0) * pct).toString())}
                        disabled={isLoading || !selectedChar?.zeny}
                        className="flex-1 py-1 rounded-md bg-surface2/40 hover:bg-surface2/80 text-[10px] font-mono font-bold text-muted hover:text-primary transition-colors border border-border/40 disabled:opacity-40"
                      >
                        {pct === 1 ? "MAX" : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {parsedDeposit > 0 && (
                  <div className="bg-surface2/20 border border-border/40 rounded-xl p-2.5 text-xs space-y-1 font-mono">
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Deposit Surcharge ({(depositFeeRate * 100).toFixed(1)}%):</span>
                      <span className="text-warning">-{formatZeny(depositFee)} Z</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Net Added to Vault:</span>
                      <span className="text-success">+{formatZeny(netDeposit)} Z</span>
                    </div>
                    {pendingInterest > 0 && (
                      <div className="flex justify-between text-success text-[11px]">
                        <span>Compound Interest Rollover:</span>
                        <span>+{formatZeny(pendingInterest)} Z (Added to Principal)</span>
                      </div>
                    )}
                    {subdayHours > 0 && (
                      <div className="flex justify-between text-info text-[11px]">
                        <span>Preserved Cycle Progress:</span>
                        <span>{subdayHours}h towards next +1%</span>
                      </div>
                    )}
                    <div className="border-t border-border/40 my-1 pt-1 flex justify-between font-bold text-primary text-[11px]">
                      <span>New Total Vault Principal:</span>
                      <span className="text-accent">{formatZeny(newPrincipalOnDeposit)} Z</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Remaining Character Wallet:</span>
                      <span className="text-primary">{formatZeny(Math.max(0, (selectedChar?.zeny || 0) - parsedDeposit))} Z</span>
                    </div>
                  </div>
                )}

                {error && <div className="text-xs text-error font-bold">{error}</div>}
                {success && (
                  <div className="text-xs text-success font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {success}
                  </div>
                )}
              </>
            )}
          </div>

          {!isOnline && (
            <button
              onClick={handleDeposit}
              disabled={isLoading || !selectedChar || parsedDeposit < 100 || parsedDeposit > (selectedChar?.zeny || 0)}
              className="w-full py-2.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs uppercase tracking-wider border border-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-1.5 shrink-0"
            >
              {isLoading ? "Processing Deposit..." : "Confirm Deposit"}
              {!isLoading && <Wallet className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}

      {/* Tab 3: Withdraw */}
      {activeTab === "WITHDRAW" && (
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-y-auto animate-in fade-in duration-150">
          <div className="space-y-2">
            {/* Source: Vault Available Balance */}
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25 space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-accent" /> Available in Vault to Withdraw
                </span>
                <span className="text-[9px] font-mono font-bold text-success bg-success/15 px-1.5 py-0.5 rounded border border-success/25">
                  0% Fee / Free
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-lg font-black font-mono text-primary flex items-baseline gap-1">
                  <span>{formatZeny(totalPayout)}</span>
                  <span className="text-accent text-xs font-sans font-bold">Z</span>
                </div>
                <div className="text-[10px] font-mono text-muted text-right">
                  Principal: {formatZeny(principal)} Z · Yield: +{formatZeny(pendingInterest)} Z
                </div>
              </div>
            </div>

            {/* Destination Character Selector */}
            <div className="bg-surface2/30 p-2.5 rounded-xl border border-border/50 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-accent" /> Destination Character (Wallet)
                </span>
                <span className="font-mono text-muted text-xs">
                  Current Wallet: <strong className="text-primary">{formatZeny(selectedChar?.zeny || 0)} Z</strong>
                </span>
              </div>
              {safeChars.length > 1 ? (
                <select
                  value={selectedChar?.charId || ""}
                  onChange={(e) => setLocalCharId(Number(e.target.value))}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent"
                >
                  {safeChars.map((c) => (
                    <option key={c.charId} value={c.charId}>
                      {c.name} (Lv.{c.baseLevel} {c.className}) — {formatZeny(c.zeny)} Z {c.online === 1 ? "[ONLINE]" : "[OFFLINE]"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-primary flex justify-between bg-surface/60 p-1.5 rounded-lg border border-border/40">
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
              <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Character is currently logged in. Please log out of the game to withdraw funds safely.</p>
              </div>
            ) : totalPayout <= 0 ? (
              <div className="p-4 text-center text-muted text-xs bg-surface2/20 rounded-xl border border-border/40 space-y-2">
                <p>No active principal or accrued interest available in the vault to withdraw.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("DEPOSIT")}
                  className="px-3 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold transition-colors"
                >
                  Deposit Funds
                </button>
              </div>
            ) : (
              <>
                {/* Amount Input & Preset Chips */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={`Withdraw Amount (Max ${formatZeny(totalPayout)} Z)`}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono text-primary outline-none focus:border-accent pr-8"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="absolute right-3 top-2 text-sm font-mono text-muted">Z</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setWithdrawAmount(Math.floor(totalPayout * pct).toString())}
                        disabled={isLoading || totalPayout <= 0}
                        className="flex-1 py-1 rounded-md bg-surface2/40 hover:bg-surface2/80 text-[10px] font-mono font-bold text-muted hover:text-primary transition-colors border border-border/40 disabled:opacity-40"
                      >
                        {pct === 1 ? "MAX" : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Transaction Preview */}
                {parsedWithdraw > 0 && (
                  <div className="bg-surface2/20 border border-border/40 rounded-xl p-2.5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Transferring to Character:</span>
                      <span className="font-bold text-success">+{formatZeny(safeWithdraw)} Z</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>New Character Wallet:</span>
                      <span className="text-primary">{formatZeny((selectedChar?.zeny || 0) + safeWithdraw)} Z</span>
                    </div>
                    <div className="border-t border-border/40 pt-1 flex justify-between text-muted text-[11px]">
                      <span>Remaining Vault Balance:</span>
                      <span className="font-bold text-accent">{formatZeny(remainingPrincipalOnWithdraw)} Z</span>
                    </div>
                    <div className="flex justify-between text-muted text-[10px]">
                      <span>Withdrawal Surcharge:</span>
                      <span className="text-success">0 Z (Free / Instant)</span>
                    </div>
                  </div>
                )}

                {error && <div className="text-xs text-error font-bold">{error}</div>}
                {success && (
                  <div className="text-xs text-success font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {success}
                  </div>
                )}
              </>
            )}
          </div>

          {!isOnline && totalPayout > 0 && (
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !selectedChar || parsedWithdraw <= 0 || parsedWithdraw > totalPayout}
              className="w-full py-2.5 rounded-lg bg-success/20 hover:bg-success/30 text-success font-bold text-xs uppercase tracking-wider border border-success/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-1.5 shrink-0"
            >
              {isLoading ? "Processing Withdrawal..." : "Confirm Withdrawal"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
