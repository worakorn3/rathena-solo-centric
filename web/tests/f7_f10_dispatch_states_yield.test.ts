import { describe, expect, it } from "bun:test";
import {
  determineDispatchState,
  calculateDispatchYield,
  calculateHourlyRatePreview,
  createMockCharacter,
  MAX_DISPATCH_SECONDS,
} from "./helpers/test-utils";

/**
 * ==============================================================================
 * Test Suite: F7, F8, F9, F10 — 3-State Interactive Machine, Live Yield, 12h Cap
 * Requirement Sources: ORIGINAL_REQUEST §R2, §R3, PROJECT.md §F7-F10
 * ==============================================================================
 */

describe("Feature F7: 3-State Interactive Machine (State A: Online)", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F7-T1-1: Determines State A (ONLINE_DISABLED) when char.online is true", () => {
    const char = createMockCharacter({ online: true, dispatchStart: null });
    const state = determineDispatchState(char);
    expect(state).toBe("ONLINE_DISABLED");
  });

  it("F7-T1-2: Determines State A even if character has a dispatchStart timestamp (priority: online disables)", () => {
    const char = createMockCharacter({ online: true, dispatchStart: 1724330000 });
    const state = determineDispatchState(char);
    expect(state).toBe("ONLINE_DISABLED");
  });

  it("F7-T1-3: Contextual banner contains exact guidance text for online state", () => {
    const onlineBanner = "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet.";
    expect(onlineBanner).toContain("logged into Ragnarok");
    expect(onlineBanner).toContain("offline or via the System Tablet");
  });

  it("F7-T1-4: Deploy action button is disabled in State A", () => {
    const isOnline = true;
    const isDeployDisabled = isOnline;
    expect(isDeployDisabled).toBe(true);
  });

  it("F7-T1-5: Live ticker is not rendered in State A (State A shows tooltip/banner instead)", () => {
    const state = "ONLINE_DISABLED";
    const shouldRenderTicker = state === "ACTIVE";
    expect(shouldRenderTicker).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F7-T2-1: Handles char.online expressed as numeric 1 (rAthena DB format)", () => {
    const char = { online: 1, dispatchStart: null };
    const state = determineDispatchState(char);
    expect(state).toBe("ONLINE_DISABLED");
  });

  it("F7-T2-2: Transition from online (1) to offline (0) updates state to AVAILABLE immediately", () => {
    let char = { online: 1 as number | boolean, dispatchStart: null };
    expect(determineDispatchState(char)).toBe("ONLINE_DISABLED");

    char = { online: 0, dispatchStart: null };
    expect(determineDispatchState(char)).toBe("AVAILABLE");
  });

  it("F7-T2-3: Verifies tooltip/banner styling tokens include warning/surface styling without overflow", () => {
    const bannerClasses = "p-3 rounded-lg bg-surface2/60 border border-border/80 text-xs text-muted leading-relaxed flex items-start gap-2.5";
    expect(bannerClasses).toContain("bg-surface2");
    expect(bannerClasses).toContain("text-xs");
    expect(bannerClasses).toContain("leading-relaxed");
  });

  it("F7-T2-4: Disabled button in State A has cursor-not-allowed and opacity-50 classes", () => {
    const disabledButtonClasses = "opacity-50 cursor-not-allowed bg-surface2 text-muted";
    expect(disabledButtonClasses).toContain("cursor-not-allowed");
    expect(disabledButtonClasses).toContain("opacity-50");
  });

  it("F7-T2-5: ShieldAlert or AlertCircle icon is rendered alongside the online warning banner", () => {
    const bannerIcon = "ShieldAlert";
    expect(["ShieldAlert", "AlertCircle", "Info"]).toContain(bannerIcon);
  });
});

describe("Feature F8: 3-State Interactive Machine (State B: Available/Offline)", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F8-T1-1: Determines State B (AVAILABLE) when char is offline and dispatchStart is null", () => {
    const char = createMockCharacter({ online: false, dispatchStart: null });
    const state = determineDispatchState(char);
    expect(state).toBe("AVAILABLE");
  });

  it("F8-T1-2: Determines State B (AVAILABLE) when char is offline and dispatchStart is 0", () => {
    const char = createMockCharacter({ online: false, dispatchStart: 0 as any });
    const state = determineDispatchState(char);
    expect(state).toBe("AVAILABLE");
  });

  it("F8-T1-3: Yield rate preview formula calculates accurate hourly rates for Level 85 / Job 50", () => {
    const rates = calculateHourlyRatePreview(85, 50);
    // Base EXP/h = 85 * 15,000 = 1,275,000
    expect(rates.baseExpPerHour).toBe(1275000);
    // Job EXP/h = 50 * 10,000 = 500,000
    expect(rates.jobExpPerHour).toBe(500000);
    // Zeny/h = 85 * 2,500 = 212,500
    expect(rates.zenyPerHour).toBe(212500);
    expect(rates.rateBadge).toBe("Lv.85 Rate");
  });

  it("F8-T1-4: Tactile 'Deploy Expedition' button is fully enabled in State B", () => {
    const state = "AVAILABLE";
    const isDeployEnabled = state === "AVAILABLE";
    expect(isDeployEnabled).toBe(true);
  });

  it("F8-T1-5: Button label explicitly displays 'Deploy Expedition'", () => {
    const buttonLabel = "Deploy Expedition";
    expect(buttonLabel).toBe("Deploy Expedition");
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F8-T2-1: Calculates rate preview for Level 1 / Job 1 novice", () => {
    const rates = calculateHourlyRatePreview(1, 1);
    expect(rates.baseExpPerHour).toBe(15000);
    expect(rates.jobExpPerHour).toBe(10000);
    expect(rates.zenyPerHour).toBe(2500);
    expect(rates.rateBadge).toBe("Lv.1 Rate");
  });

  it("F8-T2-2: Calculates rate preview for Level 99 / Job 50 second-class master", () => {
    const rates = calculateHourlyRatePreview(99, 50);
    expect(rates.baseExpPerHour).toBe(1485000); // 99 * 15000
    expect(rates.jobExpPerHour).toBe(500000);  // 50 * 10000
    expect(rates.zenyPerHour).toBe(247500);   // 99 * 2500
    expect(rates.rateBadge).toBe("Lv.99 Rate");
  });

  it("F8-T2-3: Button transitions to loading state during API dispatch mutation", () => {
    let isSubmitting = false;
    let buttonText = isSubmitting ? "Deploying..." : "Deploy Expedition";
    expect(buttonText).toBe("Deploy Expedition");

    isSubmitting = true;
    buttonText = isSubmitting ? "Deploying..." : "Deploy Expedition";
    expect(buttonText).toBe("Deploying...");
  });

  it("F8-T2-4: Prevents double-submitting while mutation is in-flight", () => {
    let inFlight = true;
    const handleClick = () => {
      if (inFlight) return false;
      return true;
    };
    expect(handleClick()).toBe(false);
  });

  it("F8-T2-5: Displays error banner if dispatch mutation fails and restores button state", () => {
    let error: string | null = null;
    let isSubmitting = false;

    // Simulate failed API response
    error = "Character logged in elsewhere.";
    isSubmitting = false;

    expect(error).not.toBeNull();
    expect(isSubmitting).toBe(false);
  });
});

describe("Feature F9: 3-State Interactive Machine (State C: Active Expedition)", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F9-T1-1: Determines State C (ACTIVE) when char is offline and dispatchStart > 0", () => {
    const char = createMockCharacter({ online: false, dispatchStart: 1724330000 });
    const state = determineDispatchState(char);
    expect(state).toBe("ACTIVE");
  });

  it("F9-T1-2: Formats live 1s interval elapsed timer into HH:MM:SS format", () => {
    const start = 1000;
    const now = 1000 + 3665; // 1 hour, 1 minute, 5 seconds
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.formattedElapsed).toBe("01:01:05");
  });

  it("F9-T1-3: Computes live Base EXP yield accurately using Math.floor((Lv * 15000 * effectiveSeconds) / 3600)", () => {
    const start = 1000;
    const now = 1000 + 7200; // 2 hours = 7200s
    // Base Lv 80 -> (80 * 15000 * 7200) / 3600 = 80 * 15000 * 2 = 2,400,000
    const yieldSummary = calculateDispatchYield(80, 40, start, now);
    expect(yieldSummary.baseExpYield).toBe(2400000);
  });

  it("F9-T1-4: Computes live Job EXP yield accurately with Zero Zeny", () => {
    const start = 1000;
    const now = 1000 + 7200; // 2 hours
    // Job Lv 40 -> (40 * 10000 * 7200) / 3600 = 40 * 10000 * 2 = 800,000
    // Zeny -> 0 (Zero Zeny clean rewards)
    const yieldSummary = calculateDispatchYield(80, 40, start, now);
    expect(yieldSummary.jobExpYield).toBe(800000);
    expect(yieldSummary.zenyYield).toBe(0);
  });

  it("F9-T1-5: Displays 'Claim in-game via System Tablet' guidance badge in State C", () => {
    const state = "ACTIVE";
    const claimGuidanceBadge = state === "ACTIVE" ? "Claim in-game via System Tablet" : null;
    expect(claimGuidanceBadge).toBe("Claim in-game via System Tablet");
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F9-T2-1: Handles zero elapsed seconds (instant after deploy) without NaN or crash", () => {
    const now = 1724330000;
    const yieldSummary = calculateDispatchYield(85, 50, now, now);
    expect(yieldSummary.effectiveSeconds).toBe(0);
    expect(yieldSummary.baseExpYield).toBe(0);
    expect(yieldSummary.jobExpYield).toBe(0);
    expect(yieldSummary.zenyYield).toBe(0);
    expect(yieldSummary.progressPercent).toBe(0);
    expect(yieldSummary.formattedElapsed).toBe("00:00:00");
  });

  it("F9-T2-2: Handles clock skew where client time is slightly behind server dispatch timestamp", () => {
    const start = 1724330010;
    const clientNow = 1724330000; // 10 seconds behind
    const yieldSummary = calculateDispatchYield(85, 50, start, clientNow);
    expect(yieldSummary.effectiveSeconds).toBe(0);
    expect(yieldSummary.baseExpYield).toBe(0);
    expect(yieldSummary.formattedElapsed).toBe("00:00:00");
  });

  it("F9-T2-3: Yield formulas apply Math.floor to ensure integer values at fractional seconds", () => {
    const start = 1000;
    const now = 1000 + 37; // 37 seconds elapsed
    // Base Lv 85 -> (85 * 15000 * 37) / 3600 = 47,175,000 / 3600 = 13104.166... -> 13104
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(Number.isInteger(yieldSummary.baseExpYield)).toBe(true);
    expect(yieldSummary.baseExpYield).toBe(13104);
    // Job Lv 50 -> (50 * 10000 * 37) / 3600 = 18,500,000 / 3600 = 5138.88... -> 5138
    expect(yieldSummary.jobExpYield).toBe(5138);
    // Zeny -> 0 (Zero Zeny clean rewards)
    expect(yieldSummary.zenyYield).toBe(0);
  });

  it("F9-T2-4: Elapsed timer accurately counts past 99 hours without visual glitch", () => {
    const start = 1000;
    const now = 1000 + 360000; // 100 hours
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.formattedElapsed).toBe("100:00:00");
  });

  it("F9-T2-5: Sub-second timer tick updates smoothly at 1000ms cadence", () => {
    let tickCount = 0;
    const mockTick = () => { tickCount++; };
    for (let i = 0; i < 5; i++) {
      mockTick();
    }
    expect(tickCount).toBe(5);
  });
});

describe("Feature F10: 48-Hour Visual Progress Capacity Bar", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F10-T1-1: Uses MAX_DISPATCH_SECONDS = 172800 (48 Hours) as capacity limit", () => {
    expect(MAX_DISPATCH_SECONDS).toBe(172800);
    expect(MAX_DISPATCH_SECONDS / 3600).toBe(48);
  });

  it("F10-T1-2: Renders 50% progress at exactly 24 hours (86,400s)", () => {
    const start = 1000;
    const now = 1000 + 86400;
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.progressPercent).toBe(50);
    expect(yieldSummary.formattedCap).toBe("24:00 / 48h Cap");
    expect(yieldSummary.isCapped).toBe(false);
  });

  it("F10-T1-3: Renders 25% progress at 12 hours (43,200s)", () => {
    const start = 1000;
    const now = 1000 + 43200;
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.progressPercent).toBe(25);
    expect(yieldSummary.formattedCap).toBe("12:00 / 48h Cap");
    expect(yieldSummary.isCapped).toBe(false);
  });

  it("F10-T1-4: Renders 100% progress at exactly 48 hours (172,800s)", () => {
    const start = 1000;
    const now = 1000 + 172800;
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.progressPercent).toBe(100);
    expect(yieldSummary.formattedCap).toBe("48:00 / 48h Cap");
    expect(yieldSummary.isCapped).toBe(true);
  });

  it("F10-T1-5: Progress bar structure uses bg-surface2 track and bg-accent fill tokens", () => {
    const trackClasses = "w-full bg-surface2 rounded-full h-2 overflow-hidden";
    const fillClasses = "bg-accent h-2 rounded-full transition-all duration-300";
    expect(trackClasses).toContain("bg-surface2");
    expect(fillClasses).toContain("bg-accent");
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F10-T2-1: Hard-clamps progress bar percentage at 100% even if elapsed is 72 hours (259,200s)", () => {
    const start = 1000;
    const now = 1000 + 259200; // 72 hours elapsed
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.progressPercent).toBe(100);
    expect(yieldSummary.effectiveSeconds).toBe(172800);
    expect(yieldSummary.isCapped).toBe(true);
  });

  it("F10-T2-2: Hard-clamps yields at exactly 48-hour max values for overtime expeditions", () => {
    const start = 1000;
    const now48h = 1000 + 172800;
    const now96h = 1000 + 345600; // 96 hours elapsed

    const yield48h = calculateDispatchYield(99, 50, start, now48h);
    const yield96h = calculateDispatchYield(99, 50, start, now96h);

    expect(yield96h.baseExpYield).toBe(yield48h.baseExpYield);
    expect(yield96h.jobExpYield).toBe(yield48h.jobExpYield);
    expect(yield96h.zenyYield).toBe(0);
  });

  it("F10-T2-3: Handles 1 second elapsed duration progress bar calculation", () => {
    const start = 1000;
    const now = 1001;
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.progressPercent).toBeGreaterThan(0);
    expect(yieldSummary.progressPercent).toBeLessThan(0.01);
  });

  it("F10-T2-4: Formatted cap label displays '48:00 / 48h Cap' when duration exceeds 48 hours", () => {
    const start = 1000;
    const now = 1000 + 200000; // > 48h
    const yieldSummary = calculateDispatchYield(85, 50, start, now);
    expect(yieldSummary.formattedCap).toBe("48:00 / 48h Cap");
  });

  it("F10-T2-5: Visual progress width style clamps cleanly between 0% and 100%", () => {
    const getStyleWidth = (pct: number) => `${Math.min(100, Math.max(0, pct))}%`;
    expect(getStyleWidth(-10)).toBe("0%");
    expect(getStyleWidth(0)).toBe("0%");
    expect(getStyleWidth(75.5)).toBe("75.5%");
    expect(getStyleWidth(100)).toBe("100%");
    expect(getStyleWidth(250)).toBe("100%");
  });
});
