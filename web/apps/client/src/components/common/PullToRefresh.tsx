import React, { useState, useRef, useEffect } from "react";
import { RefreshCw, Check } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 60; // Distance in pixels to trigger refresh
const MAX_PULL_DISTANCE = 80; // Maximum visual travel distance

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing = false,
  disabled = false,
  children,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(isRefreshing);
  isRefreshingRef.current = isRefreshing;

  // Track refresh completion to briefly show success checkmark
  const prevRefreshingRef = useRef(isRefreshing);
  useEffect(() => {
    if (prevRefreshingRef.current && !isRefreshing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1200);
      return () => clearTimeout(timer);
    }
    prevRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshingRef.current) return;
    
    // Only allow pull to refresh when scrolled to the very top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || disabled || isRefreshingRef.current) return;

    const currentY = e.touches[0].clientY;
    const rawDelta = currentY - startYRef.current;

    if (rawDelta > 0) {
      // Apply logarithmic damping for natural spring resistance
      const dampedDelta = Math.min(MAX_PULL_DISTANCE, Math.pow(rawDelta, 0.85) * 1.8);
      setPullDistance(dampedDelta);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null || disabled) return;
    startYRef.current = null;
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshingRef.current) {
      setPullDistance(0);
      try {
        await onRefresh();
      } catch (err) {
        console.error("[PullToRefresh] Refresh failed:", err);
      }
    } else {
      setPullDistance(0);
    }
  };

  const isTriggerReady = pullDistance >= PULL_THRESHOLD;
  const rotationDeg = isRefreshing
    ? 0
    : Math.min(360, (pullDistance / PULL_THRESHOLD) * 360);

  const isVisible = pullDistance > 8 || isRefreshing || showSuccess;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 flex flex-col min-h-0 relative"
    >
      {/* Floating Animated Pull-Down Pill Indicator (Mobile Only) */}
      <div
        className={`md:hidden fixed top-12 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
        style={{
          transform: isVisible
            ? `translateY(${Math.min(16, pullDistance * 0.25)}px)`
            : "translateY(-16px)",
        }}
      >
        <div className="bg-surface/95 border border-accent/40 shadow-2xl backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-primary select-none animate-in fade-in">
          {showSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-success stroke-[2.5]" />
              <span className="text-success text-[11px] font-mono">Synchronized</span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin" />
              <span className="text-accent text-[11px] font-mono">Syncing Live Realm...</span>
            </>
          ) : isTriggerReady ? (
            <>
              <RefreshCw
                className="w-3.5 h-3.5 text-accent transition-transform duration-100"
                style={{ transform: `rotate(${rotationDeg}deg)` }}
              />
              <span className="text-accent text-[11px] font-mono font-bold">
                Release to Sync
              </span>
            </>
          ) : (
            <>
              <RefreshCw
                className="w-3.5 h-3.5 text-muted transition-transform duration-100"
                style={{ transform: `rotate(${rotationDeg}deg)` }}
              />
              <span className="text-muted text-[11px] font-mono">
                Pull down to sync
              </span>
            </>
          )}
        </div>
      </div>

      {/* Children Stage Content */}
      <div
        className="flex-1 flex flex-col min-h-0 transition-transform duration-150"
        style={{
          transform:
            isPulling && pullDistance > 0
              ? `translateY(${Math.min(24, pullDistance * 0.3)}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
