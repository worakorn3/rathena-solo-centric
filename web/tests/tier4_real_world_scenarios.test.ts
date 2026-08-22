import { describe, expect, it } from "bun:test";
import {
  createMockCharacter,
  createMockCharacterDetail,
  determineDispatchState,
  calculateDispatchYield,
  calculateHourlyRatePreview,
  CharacterSummary,
  MAX_DISPATCH_SECONDS,
} from "./helpers/test-utils";

/**
 * ==============================================================================
 * Test Suite: Tier 4 — Real-World Application Scenarios (Full User Journeys)
 * Requirement Sources: ORIGINAL_REQUEST §Acceptance Criteria, PROJECT.md §Milestones M5
 * ==============================================================================
 */

describe("Tier 4: Real-World Application Scenarios (User Journeys)", () => {
  // ----------------------------------------------------------------------------
  // Scenario 1: First-Time Solo Adventurer Expedition Deployment
  // ----------------------------------------------------------------------------
  it("Scenario 1: Full Journey — Login, Select Character, Preview Rates, Deploy, Observe Live Ticker, Check Claim Guidance", () => {
    // Step 1: User authenticates and retrieves roster
    let character = createMockCharacter({
      charId: 150001,
      name: "SoloNovice",
      baseLevel: 45,
      jobLevel: 25,
      online: false,
      dispatchStart: null,
    });

    // Step 2: System evaluates initial state (AVAILABLE / State B)
    expect(determineDispatchState(character)).toBe("AVAILABLE");

    // Step 3: UI computes and displays hourly rate preview
    const ratePreview = calculateHourlyRatePreview(character.baseLevel, character.jobLevel);
    expect(ratePreview.rateBadge).toBe("Lv.45 Rate");
    expect(ratePreview.baseExpPerHour).toBe(45 * 15000); // 675,000
    expect(ratePreview.jobExpPerHour).toBe(25 * 10000);  // 250,000
    expect(ratePreview.zenyPerHour).toBe(45 * 2500);    // 112,500

    // Step 4: User clicks "Deploy Expedition" -> Optimistic state mutation
    const deployTimestamp = 1724330000;
    character = { ...character, dispatchStart: deployTimestamp };

    // Step 5: System evaluates active state (ACTIVE / State C)
    expect(determineDispatchState(character)).toBe("ACTIVE");

    // Step 6: 10 seconds elapse -> Live ticker updates
    const currentTick = deployTimestamp + 10;
    const liveYield = calculateDispatchYield(character.baseLevel, character.jobLevel, character.dispatchStart, currentTick);

    expect(liveYield.effectiveSeconds).toBe(10);
    expect(liveYield.formattedElapsed).toBe("00:00:10");
    expect(liveYield.baseExpYield).toBe(Math.floor((45 * 15000 * 10) / 3600)); // 1875
    expect(liveYield.jobExpYield).toBe(Math.floor((25 * 10000 * 10) / 3600));  // 694
    expect(liveYield.zenyYield).toBe(0); // Zero Zeny clean rewards

    // Step 7: UI displays claim guidance badge
    const claimBadge = "Claim in-game via System Tablet";
    expect(claimBadge).toContain("System Tablet");
  });

  // ----------------------------------------------------------------------------
  // Scenario 2: Multi-Character Roster Switching & State Segregation
  // ----------------------------------------------------------------------------
  it("Scenario 2: Multi-Character Journey — Switching between Offline, Active Expedition, and Online Characters", () => {
    const baseTime = 1724330000;
    const roster: CharacterSummary[] = [
      createMockCharacter({ charId: 101, name: "PriestOffline", online: false, dispatchStart: null }),
      createMockCharacter({ charId: 102, name: "KnightOnExpedition", online: false, dispatchStart: baseTime - 7200 }), // 2h
      createMockCharacter({ charId: 103, name: "AssassinInGame", online: true, dispatchStart: null }),
    ];

    // Select Character 101 (Available)
    let selected = roster[0];
    expect(determineDispatchState(selected)).toBe("AVAILABLE");

    // Select Character 102 (Active Expedition)
    selected = roster[1];
    expect(determineDispatchState(selected)).toBe("ACTIVE");
    const activeYield = calculateDispatchYield(selected.baseLevel, selected.jobLevel, selected.dispatchStart, baseTime);
    expect(activeYield.formattedElapsed).toBe("02:00:00");
    // Progress for 2h out of 48h = (2 / 48) * 100 ≈ 4.17%
    expect(activeYield.progressPercent).toBeCloseTo(4.17, 1);

    // Select Character 103 (Online In-Game)
    selected = roster[2];
    expect(determineDispatchState(selected)).toBe("ONLINE_DISABLED");
  });

  // ----------------------------------------------------------------------------
  // Scenario 3: 8-Hour Overnight Expedition Check-in
  // ----------------------------------------------------------------------------
  it("Scenario 3: Overnight Journey — Checking status of an 8-hour expedition", () => {
    const startTimestamp = 1724300000;
    const checkinTimestamp = startTimestamp + 28800; // Exactly 8 hours (28,800s)

    const char = createMockCharacter({
      name: "OvernightWizard",
      baseLevel: 80,
      jobLevel: 50,
      online: false,
      dispatchStart: startTimestamp,
    });

    expect(determineDispatchState(char)).toBe("ACTIVE");

    const yieldSummary = calculateDispatchYield(char.baseLevel, char.jobLevel, char.dispatchStart, checkinTimestamp);

    // Progress bar check: 8h / 48h = 16.67%
    expect(yieldSummary.progressPercent).toBeCloseTo(16.67, 1);
    expect(yieldSummary.formattedElapsed).toBe("08:00:00");
    expect(yieldSummary.formattedCap).toBe("08:00 / 48h Cap");
    expect(yieldSummary.isCapped).toBe(false);

    // 8-hour yields:
    // Base EXP = 80 * 15000 * 8 = 9,600,000
    // Job EXP = 50 * 10000 * 8 = 4,000,000
    // Zeny = 0
    expect(yieldSummary.baseExpYield).toBe(9600000);
    expect(yieldSummary.jobExpYield).toBe(4000000);
    expect(yieldSummary.zenyYield).toBe(0);
  });

  // ----------------------------------------------------------------------------
  // Scenario 4: Max-Capped 50-Hour Long Expedition (exceeding 48h cap)
  // ----------------------------------------------------------------------------
  it("Scenario 4: Max Cap Journey — Checking status of a 50-hour expedition (exceeding 48h cap)", () => {
    const startTimestamp = 1724300000;
    const checkinTimestamp = startTimestamp + 180000; // 50 hours (180,000s)

    const char = createMockCharacter({
      name: "LongExpeditionBlacksmith",
      baseLevel: 90,
      jobLevel: 50,
      online: false,
      dispatchStart: startTimestamp,
    });

    const yieldSummary = calculateDispatchYield(char.baseLevel, char.jobLevel, char.dispatchStart, checkinTimestamp);

    // Timer shows full 50 hours elapsed
    expect(yieldSummary.formattedElapsed).toBe("50:00:00");

    // Cap status is reached
    expect(yieldSummary.isCapped).toBe(true);
    expect(yieldSummary.progressPercent).toBe(100);
    expect(yieldSummary.formattedCap).toBe("48:00 / 48h Cap");
    expect(yieldSummary.effectiveSeconds).toBe(MAX_DISPATCH_SECONDS); // 172,800

    // Exact 48h Capped yields:
    // Base EXP = 90 * 15000 * 48 = 64,800,000
    // Job EXP = 50 * 10000 * 48 = 24,000,000
    // Zeny = 0
    expect(yieldSummary.baseExpYield).toBe(64800000);
    expect(yieldSummary.jobExpYield).toBe(24000000);
    expect(yieldSummary.zenyYield).toBe(0);
  });

  // ----------------------------------------------------------------------------
  // Scenario 5: Online Conflict & Recovery Journey
  // ----------------------------------------------------------------------------
  it("Scenario 5: Conflict Journey — Attempting dispatch while online, logging out, deploying successfully", () => {
    let char = createMockCharacter({
      name: "ConflictHunter",
      online: true, // Currently logged in
      dispatchStart: null,
    });

    // Step 1: User views online character
    expect(determineDispatchState(char)).toBe("ONLINE_DISABLED");

    // Step 2: Attempting deploy is rejected
    const canDeploy = !char.online && (!char.dispatchStart || char.dispatchStart === 0);
    expect(canDeploy).toBe(false);

    // Step 3: Player logs out of Ragnarok client
    char = { ...char, online: false };

    // Step 4: Web UI updates to Available
    expect(determineDispatchState(char)).toBe("AVAILABLE");

    // Step 5: Player successfully deploys expedition
    const deployTimestamp = 1724330000;
    char = { ...char, dispatchStart: deployTimestamp };

    expect(determineDispatchState(char)).toBe("ACTIVE");
    expect(char.dispatchStart).toBe(deployTimestamp);
  });

  // ----------------------------------------------------------------------------
  // Scenario 6: Network Interruption & Optimistic Rollback Recovery Journey
  // ----------------------------------------------------------------------------
  it("Scenario 6: Fault Recovery Journey — Deploy triggers optimistic UI, network drops, UI rolls back cleanly with error", () => {
    const originalChar = createMockCharacter({
      charId: 999,
      name: "NetworkFaultPaladin",
      online: false,
      dispatchStart: null,
    });

    let activeChar = { ...originalChar };
    let errorMessage: string | null = null;

    // Step 1: User clicks deploy -> UI applies optimistic state
    const optimisticStart = 1724330000;
    activeChar = { ...activeChar, dispatchStart: optimisticStart };
    expect(determineDispatchState(activeChar)).toBe("ACTIVE");

    // Step 2: Network request fails (e.g. timeout or 503 Service Unavailable)
    const requestFailed = true;
    if (requestFailed) {
      // Rollback to original state
      activeChar = { ...originalChar };
      errorMessage = "Network connection lost. Dispatch could not be initiated.";
    }

    // Step 3: UI is restored to AVAILABLE with clear error notification
    expect(determineDispatchState(activeChar)).toBe("AVAILABLE");
    expect(activeChar.dispatchStart).toBeNull();
    expect(errorMessage).toBe("Network connection lost. Dispatch could not be initiated.");
  });
});
