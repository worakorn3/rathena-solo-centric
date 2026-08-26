import React, { useState, useEffect } from "react";
import {
  X,
  Coins,
  Landmark,
  Wallet,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Percent,
} from "lucide-react";
import { formatZeny } from "../../lib/assets";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  StockHolding,
  HarvestDividendsResponse,
  CharacterSummary,
} from "@rathena/shared";

interface DividendHarvestModalProps {
  holding?: StockHolding | null; // If provided, harvest specific position; if null, harvest all eligible
  allHoldings: StockHolding[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const DividendHarvestModal: React.FC<DividendHarvestModalProps> = ({
  holding,
  allHoldings = [],
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [destination, setDestination] = useState<"WALLET" | "BANK">("WALLET");
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [isLoadingChars, setIsLoadingChars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load characters for wallet destination
  useEffect(() => {
    const fetchChars = async () => {
      setIsLoadingChars(true);
      try {
        const res = await api.get<{ success: boolean; data: CharacterSummary[] }>("/api/characters");
        if (res.success && Array.isArray(res.data)) {
          setCharacters(res.data);
          const firstOffline = res.data.find((c) => c.online === 0) || res.data[0];
          if (firstOffline) {
            setSelectedCharId(firstOffline.charId);
          }
        }
      } catch (err) {
        console.error("Failed to load characters for dividend harvest:", err);
      } finally {
        setIsLoadingChars(false);
      }
    };
    fetchChars();
  }, []);

  // Compute dividend metrics
  const targetHoldings = holding
    ? [holding]
    : allHoldings.filter((h) => !h.dripEnabled && h.pendingDividends > 0);

  const totalGross = targetHoldings.reduce((sum, h) => sum + (h.pendingDividends || 0), 0);
  const estimatedTaxRate = 10; // 10% sovereign withholding
  const estimatedTax = Math.floor((totalGross * estimatedTaxRate) / 100);
  const estimatedNet = totalGross - estimatedTax;

  const isSingleDripActive = holding ? Boolean(holding.dripEnabled) : false;
  const activeChar = characters.find((c) => c.charId === selectedCharId);
  const isCharOnline = activeChar?.online === 1;

  const handleHarvest = async () => {
    if (isSingleDripActive) {
      setErrorMsg("DRIP is active for this asset. Please toggle DRIP OFF to harvest cash dividends.");
      return;
    }

    if (totalGross <= 0) {
      setErrorMsg("No eligible cash dividends available for harvest.");
      return;
    }

    if (destination === "WALLET") {
      if (!selectedCharId) {
        setErrorMsg("Please select a character to receive the wallet distribution.");
        return;
      }
      if (isCharOnline) {
        setErrorMsg("Selected character is currently online in-game. Please log out before harvesting via Web Terminal.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ticker: holding ? holding.ticker : undefined,
        charId: destination === "WALLET" ? selectedCharId : undefined,
        destination,
      };

      const res = await api.post<HarvestDividendsResponse>("/api/economy/dividends/harvest", payload);

      if (res.success) {
        setSuccessMsg(res.message || "Dividends harvested successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Failed to harvest dividends.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred while harvesting dividends.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface2/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/15 border border-success/30 text-success">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">
                {holding ? `Harvest Dividends: ${holding.ticker}` : "Harvest All Accrued Yields"}
              </h3>
              <p className="text-[11px] text-muted">
                {holding ? holding.name : `Harvest from ${targetHoldings.length} eligible position(s)`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted hover:text-primary rounded-lg hover:bg-surface2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* DRIP Active Warning */}
          {isSingleDripActive && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">DRIP is Currently Active</p>
                <p className="text-[10px] text-amber-200/80 mt-0.5">
                  Dividends for {holding?.ticker} are set to auto-reinvest into shares at midnight. Toggle DRIP OFF to claim cash dividends.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown Card */}
          <div className="p-3 rounded-lg bg-surface2 border border-border space-y-2">
            <div className="flex justify-between items-center text-muted text-[11px]">
              <span>Gross Accrued Yield:</span>
              <span className="font-mono text-primary font-bold">{formatZeny(totalGross)} Z</span>
            </div>
            <div className="flex justify-between items-center text-danger text-[11px]">
              <span className="flex items-center gap-1">
                <span>Sovereign Tax ({estimatedTaxRate}%):</span>
                <span title="Standard municipal dividend withholding tax">
                  <HelpCircle className="w-3 h-3 text-muted" />
                </span>
              </span>
              <span className="font-mono font-medium">-{formatZeny(estimatedTax)} Z</span>
            </div>
            <div className="border-t border-border/80 pt-2 flex justify-between items-center text-xs">
              <span className="font-bold text-primary">Net Distribution:</span>
              <span className="font-mono font-bold text-success text-sm">
                +{formatZeny(estimatedNet)} Z
              </span>
            </div>
          </div>

          {/* Destination Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Payout Destination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestination("WALLET")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  destination === "WALLET"
                    ? "bg-accent/15 border-accent text-accent font-bold ring-1 ring-accent/30"
                    : "bg-surface2 border-border text-muted hover:text-primary hover:bg-surface2/80"
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs">Character Wallet</div>
                  <div className="text-[10px] text-muted font-normal">Direct liquid cash</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDestination("BANK")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  destination === "BANK"
                    ? "bg-accent/15 border-accent text-accent font-bold ring-1 ring-accent/30"
                    : "bg-surface2 border-border text-muted hover:text-primary hover:bg-surface2/80"
                }`}
              >
                <Landmark className="w-4 h-4 shrink-0 text-info" />
                <div>
                  <div className="text-xs">Investment Bank</div>
                  <div className="text-[10px] text-muted font-normal">0% Fee (Wire Vault)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Character Selector (if Wallet selected) */}
          {destination === "WALLET" && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-muted">
                  Receiving Character
                </label>
                {activeChar && (
                  <span className="text-[10px] font-mono text-muted">
                    Balance: {formatZeny(activeChar.zeny)} Z
                  </span>
                )}
              </div>

              {isLoadingChars ? (
                <div className="flex items-center gap-2 p-2 text-muted text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading characters...
                </div>
              ) : characters.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={selectedCharId || ""}
                    onChange={(e) => setSelectedCharId(Number(e.target.value))}
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {characters.map((c) => (
                      <option key={c.charId} value={c.charId}>
                        {c.name} (Lv. {c.baseLevel}) — {c.online ? "🔴 Online" : "🟢 Offline"}
                      </option>
                    ))}
                  </select>
                  {isCharOnline && (
                    <p className="text-[10px] text-danger flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      Character must be logged out of the game before claiming.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-danger">No characters found for this account.</p>
              )}
            </div>
          )}

          {/* Status / Error Alerts */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-success/10 border border-success/30 text-success text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-surface2/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-primary hover:bg-surface2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleHarvest}
            disabled={isSubmitting || totalGross <= 0 || isSingleDripActive || (destination === "WALLET" && isCharOnline)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              isSubmitting || totalGross <= 0 || isSingleDripActive || (destination === "WALLET" && isCharOnline)
                ? "bg-surface2 text-muted border border-border cursor-not-allowed opacity-60"
                : "bg-success text-black hover:bg-success/90 shadow-md shadow-success/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Harvesting...</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5" />
                <span>Confirm Harvest (+{formatZeny(estimatedNet)} Z)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
