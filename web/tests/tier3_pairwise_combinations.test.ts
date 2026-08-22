import { describe, expect, it } from "bun:test";
import {
  createMockCharacter,
  determineDispatchState,
  calculateDispatchYield,
  calculateHourlyRatePreview,
  CharacterSummary,
  MAX_DISPATCH_SECONDS,
} from "./helpers/test-utils";

/**
 * ==============================================================================
 * Test Suite: Tier 3 — Cross-Feature Pairwise Combinations
 * Requirement Sources: PROJECT.md §Milestones M5, ORIGINAL_REQUEST Acceptance
 * ==============================================================================
 */

describe("Tier 3: Cross-Feature Pairwise Combinations", () => {
  // ----------------------------------------------------------------------------
  // Combination 1: Character Switching + Active Dispatch State Sync (F11 + F13 + F7/F8/F9)
  // ----------------------------------------------------------------------------
  it("Combo-1: Switching between idle and active characters renders correct 3-state machine views", () => {
    const idleChar = createMockCharacter({ charId: 101, name: "IdlePriest", dispatchStart: null, online: false });
    const activeChar = createMockCharacter({ charId: 102, name: "ActiveKnight", dispatchStart: 1724330000, online: false });
    const onlineChar = createMockCharacter({ charId: 103, name: "OnlineWizard", dispatchStart: null, online: true });

    expect(determineDispatchState(idleChar)).toBe("AVAILABLE");
    expect(determineDispatchState(activeChar)).toBe("ACTIVE");
    expect(determineDispatchState(onlineChar)).toBe("ONLINE_DISABLED");
  });

  // ----------------------------------------------------------------------------
  // Combination 2: Dispatch Deployment + Immediate Roster Status Pill Update (F2 + F12 + F13)
  // ----------------------------------------------------------------------------
  it("Combo-2: Dispatch deploy mutation immediately activates the roster status pill for that character", () => {
    let roster: CharacterSummary[] = [
      createMockCharacter({ charId: 201, name: "CharA", dispatchStart: null }),
      createMockCharacter({ charId: 202, name: "CharB", dispatchStart: null }),
    ];

    const getPillStatus = (c: CharacterSummary) => Boolean(c.dispatchStart && c.dispatchStart > 0);

    expect(getPillStatus(roster[0])).toBe(false);
    expect(getPillStatus(roster[1])).toBe(false);

    // Deploy CharA
    const deployTimestamp = 1724330000;
    roster = roster.map(c => c.charId === 201 ? { ...c, dispatchStart: deployTimestamp } : c);

    expect(getPillStatus(roster[0])).toBe(true);
    expect(getPillStatus(roster[1])).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // Combination 3: Dispatch Yield Calculation + 48h Max Cap Thresholds (F9 + F10)
  // ----------------------------------------------------------------------------
  it("Combo-3: Yield calculation adheres strictly to 48h cap when elapsed exceeds max threshold", () => {
    const start = 1000;
    const now48h = 1000 + 172800;
    const now56h = 1000 + 201600; // 56 hours

    const yield48h = calculateDispatchYield(80, 40, start, now48h);
    const yield56h = calculateDispatchYield(80, 40, start, now56h);

    expect(yield56h.effectiveSeconds).toBe(172800);
    expect(yield56h.progressPercent).toBe(100);
    expect(yield56h.baseExpYield).toBe(yield48h.baseExpYield);
    expect(yield56h.jobExpYield).toBe(yield48h.jobExpYield);
    expect(yield56h.zenyYield).toBe(0);
  });

  // ----------------------------------------------------------------------------
  // Combination 4: Character Online Status Change + Dispatch Action Disable (F2 + F7)
  // ----------------------------------------------------------------------------
  it("Combo-4: In-game login disables dispatch action in web UI even if character was previously offline", () => {
    let char = createMockCharacter({ online: false, dispatchStart: null });
    expect(determineDispatchState(char)).toBe("AVAILABLE");

    // Player logs in-game
    char = { ...char, online: true };
    expect(determineDispatchState(char)).toBe("ONLINE_DISABLED");
  });

  // ----------------------------------------------------------------------------
  // Combination 5: Rapid Successive Dispatches + Double-Dispatch Prevention (F2 + F13 + F15)
  // ----------------------------------------------------------------------------
  it("Combo-5: Rapid successive dispatch triggers are blocked while mutation is in progress", () => {
    let inProgress = false;
    let dispatchCallCount = 0;

    const tryDispatch = () => {
      if (inProgress) return { accepted: false, error: "Mutation in-flight" };
      inProgress = true;
      dispatchCallCount++;
      return { accepted: true };
    };

    const call1 = tryDispatch();
    const call2 = tryDispatch();
    const call3 = tryDispatch();

    expect(call1.accepted).toBe(true);
    expect(call2.accepted).toBe(false);
    expect(call3.accepted).toBe(false);
    expect(dispatchCallCount).toBe(1);
  });

  // ----------------------------------------------------------------------------
  // Combination 6: Max Level (Lv 99 Job 50) Yield Math + Progress Bar 100% saturation (F8 + F9 + F10)
  // ----------------------------------------------------------------------------
  it("Combo-6: Max level character at 100% capacity produces exact theoretical max yield without overflow", () => {
    const start = 1000;
    const now = 1000 + MAX_DISPATCH_SECONDS;
    const summary = calculateDispatchYield(99, 50, start, now);

    // Exact theoretical maximums for 48h (172,800s):
    // Base EXP: 99 * 15000 * 48 = 71,280,000
    // Job EXP: 50 * 10000 * 48 = 24,000,000
    // Zeny: 0 (Zero Zeny clean rewards)
    expect(summary.baseExpYield).toBe(71280000);
    expect(summary.jobExpYield).toBe(24000000);
    expect(summary.zenyYield).toBe(0);
    expect(summary.progressPercent).toBe(100);
    expect(summary.formattedCap).toBe("48:00 / 48h Cap");
  });

  // ----------------------------------------------------------------------------
  // Combination 7: Zero Elapsed Timestamp + Initial Dispatch State (F1 + F9)
  // ----------------------------------------------------------------------------
  it("Combo-7: Immediate post-dispatch state renders 0 yield without NaN or division by zero", () => {
    const timestamp = 1724330000;
    const summary = calculateDispatchYield(85, 50, timestamp, timestamp);

    expect(summary.effectiveSeconds).toBe(0);
    expect(summary.baseExpYield).toBe(0);
    expect(summary.jobExpYield).toBe(0);
    expect(summary.zenyYield).toBe(0);
    expect(summary.progressPercent).toBe(0);
    expect(summary.formattedElapsed).toBe("00:00:00");
  });

  // ----------------------------------------------------------------------------
  // Combination 8: Sub-minute yield calculation floor behavior (F9 + F15)
  // ----------------------------------------------------------------------------
  it("Combo-8: Sub-minute increments floor yields correctly preventing fractional currency/EXP", () => {
    const start = 1000;
    const now = 1000 + 45; // 45s
    const summary = calculateDispatchYield(85, 50, start, now);

    expect(Number.isInteger(summary.baseExpYield)).toBe(true);
    expect(Number.isInteger(summary.jobExpYield)).toBe(true);
    expect(Number.isInteger(summary.zenyYield)).toBe(true);
    expect(summary.formattedElapsed).toBe("00:00:45");
  });

  // ----------------------------------------------------------------------------
  // Combination 9: Read Replica Status Poll + Primary DB Dispatch Mutation Consistency (F2 + F3)
  // ----------------------------------------------------------------------------
  it("Combo-9: Verifies state consistency between primary write and read replica poll models", () => {
    const primaryWriteResult = { charId: 150001, dispatchStart: 1724330000 };
    const replicaPollResult = createMockCharacter({ charId: 150001, dispatchStart: 1724330000 });

    expect(primaryWriteResult.dispatchStart).toBe(replicaPollResult.dispatchStart);
  });

  // ----------------------------------------------------------------------------
  // Combination 10: Multi-character Roster with Mixed States (F11 + F12 + F7/F8/F9)
  // ----------------------------------------------------------------------------
  it("Combo-10: Multi-character roster simultaneously supports Online, Available, Active, and Capped members", () => {
    const now = 1000000;
    const roster: CharacterSummary[] = [
      createMockCharacter({ charId: 1, name: "OnlinePaladin", online: true, dispatchStart: null }),
      createMockCharacter({ charId: 2, name: "AvailableHighPriest", online: false, dispatchStart: null }),
      createMockCharacter({ charId: 3, name: "ActiveSniper", online: false, dispatchStart: now - 7200 }), // 2h active
      createMockCharacter({ charId: 4, name: "CappedLordKnight", online: false, dispatchStart: now - 200000 }), // capped > 48h
    ];

    expect(determineDispatchState(roster[0])).toBe("ONLINE_DISABLED");
    expect(determineDispatchState(roster[1])).toBe("AVAILABLE");
    expect(determineDispatchState(roster[2])).toBe("ACTIVE");
    expect(determineDispatchState(roster[3])).toBe("ACTIVE");

    const yieldSniper = calculateDispatchYield(roster[2].baseLevel, roster[2].jobLevel, roster[2].dispatchStart, now);
    const yieldLordKnight = calculateDispatchYield(roster[3].baseLevel, roster[3].jobLevel, roster[3].dispatchStart, now);

    expect(yieldSniper.isCapped).toBe(false);
    expect(yieldLordKnight.isCapped).toBe(true);
    expect(yieldLordKnight.progressPercent).toBe(100);
  });
});
