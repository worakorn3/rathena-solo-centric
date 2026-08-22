import React, { useState, useRef, useCallback } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncButtonProps {
  onSync: () => Promise<void> | void;
  cooldownMs?: number;
  minSpinMs?: number;
  successDisplayMs?: number;
  className?: string;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  onSync,
  cooldownMs = 2500,
  minSpinMs = 600,
  successDisplayMs = 1500,
  className = "",
}) => {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSpamBlocked, setIsSpamBlocked] = useState(false);
  const lastSyncTimestampRef = useRef<number>(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spamShakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Not synced yet";
    return `Last synced at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  };

  const handleSync = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimestampRef.current;

    // Spam defense / debounce protection
    if (status === "syncing" || timeSinceLastSync < cooldownMs) {
      // Trigger visual micro-feedback indicating debounce lock
      setIsSpamBlocked(true);
      if (spamShakeTimerRef.current) clearTimeout(spamShakeTimerRef.current);
      spamShakeTimerRef.current = setTimeout(() => {
        setIsSpamBlocked(false);
      }, 500);
      return;
    }

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    setStatus("syncing");
    lastSyncTimestampRef.current = now;

    const startTime = Date.now();
    let syncError = false;

    try {
      await onSync();
    } catch {
      syncError = true;
    }

    // Guarantee minimum animation duration so fast DB replica hits don't flicker
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, minSpinMs - elapsed);

    setTimeout(() => {
      if (syncError) {
        setStatus("error");
        resetTimerRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2000);
      } else {
        const syncDate = new Date();
        setLastSynced(syncDate);
        setStatus("success");
        resetTimerRef.current = setTimeout(() => {
          setStatus("idle");
        }, successDisplayMs);
      }
    }, remainingDelay);
  }, [status, onSync, cooldownMs, minSpinMs, successDisplayMs]);

  // Dynamic visual styling based on active state
  const getStateStyles = () => {
    switch (status) {
      case "syncing":
        return "border-accent/40 bg-accent/10 text-accent shadow-[0_0_12px_rgba(251,191,36,0.15)] cursor-wait";
      case "success":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]";
      case "error":
        return "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]";
      case "idle":
      default:
        return "border-border bg-surface2/60 text-muted hover:text-primary hover:bg-surface2 hover:border-zinc-700 active:scale-95";
    }
  };

  const getAriaLabel = () => {
    switch (status) {
      case "syncing":
        return "Synchronizing game data from server";
      case "success":
        return "Synchronization complete";
      case "error":
        return "Synchronization failed";
      default:
        return "Sync data from server";
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={status === "syncing"}
      aria-busy={status === "syncing"}
      aria-label={getAriaLabel()}
      title={`${getAriaLabel()} • ${formatLastSync(lastSynced)}`}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 ${getStateStyles()} ${
        isSpamBlocked ? "animate-[shake_0.4s_ease-in-out]" : ""
      } ${className}`}
    >
      {/* Icon rendering with state-driven animation */}
      <span className="relative flex items-center justify-center w-3.5 h-3.5 flex-shrink-0">
        {status === "syncing" && (
          <RefreshCw
            size={14}
            className="animate-spin text-accent"
            aria-hidden="true"
          />
        )}
        {status === "success" && (
          <Check
            size={14}
            className="text-emerald-400 animate-in zoom-in-75 duration-200"
            aria-hidden="true"
          />
        )}
        {status === "error" && (
          <AlertCircle
            size={14}
            className="text-rose-400 animate-in zoom-in-75 duration-200"
            aria-hidden="true"
          />
        )}
        {status === "idle" && (
          <RefreshCw
            size={14}
            className="text-muted group-hover:text-primary group-hover:rotate-45 transition-transform duration-300 ease-out"
            aria-hidden="true"
          />
        )}
      </span>

      {/* Label text */}
      <span className="hidden sm:inline font-mono">
        {status === "syncing" && "Syncing..."}
        {status === "success" && "Synced!"}
        {status === "error" && "Failed"}
        {status === "idle" && "Sync"}
      </span>

      {/* Subtle indicator dot for quick visual status in compact view */}
      <span className="sm:hidden flex items-center">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "syncing"
              ? "bg-accent animate-pulse"
              : status === "success"
              ? "bg-emerald-400"
              : status === "error"
              ? "bg-rose-400"
              : "bg-muted/40"
          }`}
        />
      </span>
    </button>
  );
};
