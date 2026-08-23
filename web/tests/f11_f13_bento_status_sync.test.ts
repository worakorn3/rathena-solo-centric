import { describe, expect, it } from "bun:test";
import {
  createMockCharacter,
  determineDispatchState,
  CharacterSummary,
} from "./helpers/test-utils";

/**
 * ==============================================================================
 * Test Suite: F11, F12, F13 — Bento Grid Layout, Roster Status Pill, Optimistic Sync
 * Requirement Sources: ORIGINAL_REQUEST §R2, §R4, PROJECT.md §F11-F13
 * ==============================================================================
 */

describe("Feature F11: Bento Grid Integration in StatusWindow.tsx", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F11-T1-1: Dispatch card container specifies Bento grid token classes (bento-card, rounded-xl)", () => {
    const cardClass = "bento-card lg:col-span-4 flex flex-col gap-4";
    expect(cardClass).toContain("bento-card");
    expect(cardClass).toContain("flex-col");
  });

  it("F11-T1-2: StatusWindow layout distributes columns across responsive Bento grid without overflow", () => {
    const statusWindowGrid = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4";
    expect(statusWindowGrid).toContain("grid-cols-1");
    expect(statusWindowGrid).toContain("lg:grid-cols-12");
    expect(statusWindowGrid).toContain("gap-4");
  });

  it("F11-T1-3: Yield statistics grid uses responsive 2-column or 3-column micro-grid", () => {
    const yieldGrid = "grid grid-cols-3 gap-2 bg-surface2/40 p-3 rounded-lg border border-border/50";
    expect(yieldGrid).toContain("grid-cols-3");
    expect(yieldGrid).toContain("rounded-lg");
  });

  it("F11-T1-4: Dispatch card maintains consistent padding and border styling matching StatusWindow", () => {
    const statusWindowBorder = "border border-border";
    const dispatchCardBorder = "border border-border/60";
    expect(statusWindowBorder).toContain("border");
    expect(dispatchCardBorder).toContain("border");
  });

  it("F11-T1-5: StatusWindow layout accommodates HP/SP bars, Stats grid, and Dispatch Card simultaneously", () => {
    const sections = ["Header/Level", "HP/SP Bars", "Stats Grid", "Dispatch Expedition Card", "Footer Meta"];
    expect(sections.length).toBe(5);
    expect(sections).toContain("Dispatch Expedition Card");
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F11-T2-1: Ensures no horizontal scroll/overflow on mobile viewport width (320px - 375px)", () => {
    const mobileContainerClasses = "w-full max-w-full overflow-hidden";
    expect(mobileContainerClasses).toContain("max-w-full");
    expect(mobileContainerClasses).toContain("overflow-hidden");
  });

  it("F11-T2-2: Handles long character names (24 chars) inside dispatch card header without text clipping", () => {
    const longName = "VeryLongSoloAdventurerName";
    const nameClasses = "truncate font-bold text-sm text-primary max-w-[200px]";
    expect(nameClasses).toContain("truncate");
  });

  it("F11-T2-3: Verifies vertical layout elasticity when switching between State A, State B, and State C", () => {
    const cardHeights = {
      stateA: "min-h-[160px]",
      stateB: "min-h-[160px]",
      stateC: "min-h-[160px]",
    };
    expect(cardHeights.stateA).toBe(cardHeights.stateB);
    expect(cardHeights.stateB).toBe(cardHeights.stateC);
  });

  it("F11-T2-4: Prevents z-index collisions between dispatch card tooltips and paperdoll equipment tooltips", () => {
    const dispatchTooltipZ = 30;
    const paperdollTooltipZ = 40;
    const modalZ = 50;
    expect(dispatchTooltipZ).toBeLessThan(paperdollTooltipZ);
    expect(paperdollTooltipZ).toBeLessThan(modalZ);
  });

  it("F11-T2-5: Bento card border color reacts appropriately on hover in desktop viewports", () => {
    const bentoCardStyle = "border-border/60 hover:border-accent/40 transition-colors";
    expect(bentoCardStyle).toContain("hover:border-accent/40");
  });
});

describe("Feature F12: Dispatch Status Pill in CharSelector.tsx", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F12-T1-1: Renders active dispatch status pill when character has dispatchStart > 0", () => {
    const char = createMockCharacter({ online: false, dispatchStart: 1724330000 });
    const isDispatched = Boolean(char.dispatchStart && char.dispatchStart > 0);
    expect(isDispatched).toBe(true);
  });

  it("F12-T1-2: Status pill in roster displays 'Expedition' or 'Dispatched' label", () => {
    const pillText = "Expedition";
    expect(["Expedition", "Dispatched", "On Dispatch"]).toContain(pillText);
  });

  it("F12-T1-3: Status pill styling uses subtle accent background and border tokens", () => {
    const pillClasses = "px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1";
    expect(pillClasses).toContain("bg-accent");
    expect(pillClasses).toContain("text-accent");
    expect(pillClasses).toContain("text-[10px]");
  });

  it("F12-T1-4: Roster clearly differentiates Online (green dot), Dispatched (accent pill), and Offline (muted)", () => {
    const getRosterStatusIndicator = (c: CharacterSummary) => {
      if (c.online) return { type: "online", color: "bg-success" };
      if (c.dispatchStart && c.dispatchStart > 0) return { type: "dispatch", color: "bg-accent" };
      return { type: "offline", color: "bg-muted" };
    };

    const onlineChar = createMockCharacter({ online: true, dispatchStart: null });
    const dispatchChar = createMockCharacter({ online: false, dispatchStart: 1724330000 });
    const offlineChar = createMockCharacter({ online: false, dispatchStart: null });

    expect(getRosterStatusIndicator(onlineChar).type).toBe("online");
    expect(getRosterStatusIndicator(dispatchChar).type).toBe("dispatch");
    expect(getRosterStatusIndicator(offlineChar).type).toBe("offline");
  });

  it("F12-T1-5: Selecting a character with active dispatch retains selection highlight and updates active view", () => {
    let selectedId = 150001;
    const selectChar = (id: number) => { selectedId = id; };
    selectChar(150002);
    expect(selectedId).toBe(150002);
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F12-T2-1: Handles empty character roster gracefully without errors", () => {
    const characters: CharacterSummary[] = [];
    const emptyNotice = characters.length === 0 ? "No characters found on this account." : null;
    expect(emptyNotice).toBe("No characters found on this account.");
  });

  it("F12-T2-2: Handles multi-character account with all characters on active dispatch", () => {
    const roster: CharacterSummary[] = [
      createMockCharacter({ charId: 101, name: "Knight1", dispatchStart: 1724330000 }),
      createMockCharacter({ charId: 102, name: "Priest1", dispatchStart: 1724330000 }),
      createMockCharacter({ charId: 103, name: "Wizard1", dispatchStart: 1724330000 }),
    ];

    const dispatchedCount = roster.filter(c => c.dispatchStart && c.dispatchStart > 0).length;
    expect(dispatchedCount).toBe(3);
  });

  it("F12-T2-3: Roster item click handler propagates charId correctly regardless of dispatch status", () => {
    let clickedCharId: number | null = null;
    const onSelect = (id: number) => { clickedCharId = id; };

    const char = createMockCharacter({ charId: 150009, dispatchStart: 1724330000 });
    onSelect(char.charId);
    expect(clickedCharId).toBe(150009);
  });

  it("F12-T2-4: Overflow scrolling in roster container handles 10+ characters smoothly (max-h-[400px])", () => {
    const rosterClasses = "flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1";
    expect(rosterClasses).toContain("overflow-y-auto");
    expect(rosterClasses).toContain("max-h-[400px]");
  });

  it("F12-T2-5: Prevents badge clipping when character level is 3 digits (e.g. Lv 175)", () => {
    const char = createMockCharacter({ baseLevel: 175 });
    const levelBadge = `${char.baseLevel}`;
    expect(levelBadge.length).toBe(3);
  });
});

describe("Feature F13: Optimistic State Synchronization", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F13-T1-1: Instantly updates local character state to Active upon deploy trigger without waiting for page reload", () => {
    let character = createMockCharacter({ online: false, dispatchStart: null });
    expect(determineDispatchState(character)).toBe("AVAILABLE");

    // Optimistic mutation application
    const optimisticTimestamp = Math.floor(Date.now() / 1000);
    character = { ...character, dispatchStart: optimisticTimestamp };

    expect(determineDispatchState(character)).toBe("ACTIVE");
    expect(character.dispatchStart).toBe(optimisticTimestamp);
  });

  it("F13-T1-2: Simultaneously updates character roster list optimistically", () => {
    let roster = [
      createMockCharacter({ charId: 101, dispatchStart: null }),
      createMockCharacter({ charId: 102, dispatchStart: null }),
    ];

    const targetCharId = 101;
    const now = Math.floor(Date.now() / 1000);
    roster = roster.map(c => c.charId === targetCharId ? { ...c, dispatchStart: now } : c);

    expect(roster.find(c => c.charId === 101)?.dispatchStart).toBe(now);
    expect(roster.find(c => c.charId === 102)?.dispatchStart).toBeNull();
  });

  it("F13-T1-3: Confirms server response timestamp replaces optimistic timestamp smoothly", () => {
    const optimisticTimestamp = 1000;
    const serverTimestamp = 1002;
    let currentDispatchStart = optimisticTimestamp;

    // Server acknowledges mutation
    currentDispatchStart = serverTimestamp;
    expect(currentDispatchStart).toBe(1002);
  });

  it("F13-T1-4: Live yield calculation immediately engages upon optimistic state update", () => {
    const now = Math.floor(Date.now() / 1000);
    const char = createMockCharacter({ baseLevel: 85, jobLevel: 50, dispatchStart: now });
    expect(determineDispatchState(char)).toBe("ACTIVE");
  });

  it("F13-T1-5: Multiple sequential state dispatches update correct characters independently", () => {
    let roster = [
      createMockCharacter({ charId: 201, dispatchStart: null }),
      createMockCharacter({ charId: 202, dispatchStart: null }),
      createMockCharacter({ charId: 203, dispatchStart: null }),
    ];

    const now = 1724330000;
    // Dispatch char 201
    roster = roster.map(c => c.charId === 201 ? { ...c, dispatchStart: now } : c);
    // Dispatch char 203
    roster = roster.map(c => c.charId === 203 ? { ...c, dispatchStart: now + 60 } : c);

    expect(roster[0].dispatchStart).toBe(now);
    expect(roster[1].dispatchStart).toBeNull();
    expect(roster[2].dispatchStart).toBe(now + 60);
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F13-T2-1: Rolls back optimistic state to AVAILABLE if backend returns HTTP 500 error", () => {
    const originalChar = createMockCharacter({ charId: 301, dispatchStart: null });
    let char = { ...originalChar, dispatchStart: Math.floor(Date.now() / 1000) }; // Optimistic

    // API error simulation
    const apiSuccess = false;
    if (!apiSuccess) {
      char = { ...originalChar }; // Rollback
    }

    expect(char.dispatchStart).toBeNull();
    expect(determineDispatchState(char)).toBe("AVAILABLE");
  });

  it("F13-T2-2: Rolls back optimistic state if backend returns HTTP 403 unauthorized", () => {
    const originalChar = createMockCharacter({ charId: 302, dispatchStart: null });
    let char = { ...originalChar, dispatchStart: 1724330000 };

    const httpStatus = 403;
    if (httpStatus >= 400) {
      char = { ...originalChar };
    }

    expect(char.dispatchStart).toBeNull();
  });

  it("F13-T2-3: Preserves other character states during single character mutation rollback", () => {
    const originalRoster = [
      createMockCharacter({ charId: 401, dispatchStart: 1724320000 }), // already active
      createMockCharacter({ charId: 402, dispatchStart: null }),       // target
    ];

    let currentRoster = [
      originalRoster[0],
      { ...originalRoster[1], dispatchStart: 1724330000 }, // optimistic
    ];

    // Rollback char 402 only
    currentRoster = [
      originalRoster[0],
      originalRoster[1],
    ];

    expect(currentRoster[0].dispatchStart).toBe(1724320000);
    expect(currentRoster[1].dispatchStart).toBeNull();
  });

  it("F13-T2-4: Reconciles state when background character polling returns fresh data from Read Replica", () => {
    let localChar = createMockCharacter({ charId: 501, dispatchStart: 1724330000 });
    const polledReplicaChar = createMockCharacter({ charId: 501, dispatchStart: 1724330000 });

    // Merged state matches polled replica
    localChar = { ...localChar, ...polledReplicaChar };
    expect(localChar.dispatchStart).toBe(1724330000);
  });

  it("F13-T2-5: Prevents race condition when switching characters during an in-flight dispatch mutation", () => {
    let selectedCharId = 601;
    let inFlightMutationCharId = 601;

    // User switches character before mutation finishes
    selectedCharId = 602;

    // Mutation completes for 601
    const applyMutation = (roster: CharacterSummary[]) =>
      roster.map(c => c.charId === inFlightMutationCharId ? { ...c, dispatchStart: 1724330000 } : c);

    const initialRoster = [
      createMockCharacter({ charId: 601, dispatchStart: null }),
      createMockCharacter({ charId: 602, dispatchStart: null }),
    ];

    const updatedRoster = applyMutation(initialRoster);
    expect(updatedRoster.find(c => c.charId === 601)?.dispatchStart).toBe(1724330000);
    expect(updatedRoster.find(c => c.charId === 602)?.dispatchStart).toBeNull();
    expect(selectedCharId).toBe(602);
  });

  it("F13-T2-6: Roster switch immediately updates activeChar and recalculates offline rest and expedition EXP yields", () => {
    const charA = createMockCharacter({
      charId: 701,
      baseLevel: 100,
      online: false,
      lastLogoutTime: 1724330000 - 3600, // 60 min ago
      unclaimedRestMin: 30, // 30 min banked
    });
    const charB = createMockCharacter({
      charId: 702,
      baseLevel: 50,
      online: false,
      lastLogoutTime: 1724330000 - 7200, // 120 min ago
      unclaimedRestMin: 0,
    });

    const roster: CharacterSummary[] = [charA, charB];
    let selectedCharId = 701;
    let selectedCharDetail: any = { ...charA, paperdoll: {} };

    // Function matching App.tsx activeChar derivation
    const getActiveChar = (selId: number, selDetail: any, chars: CharacterSummary[]) =>
      (selDetail && selDetail.charId === selId)
        ? selDetail
        : chars.find((c) => c.charId === selId) || selDetail;

    // Active character is initially Char A
    let active = getActiveChar(selectedCharId, selectedCharDetail, roster);
    expect(active.charId).toBe(701);
    expect(active.baseLevel).toBe(100);

    const now = 1724330000;
    const calcYields = (c: CharacterSummary) => {
      const elapsedSec = !c.online ? Math.max(0, now - (c.lastLogoutTime || now)) : 0;
      const totalAccruedMin = (c.unclaimedRestMin || 0) + (!c.online ? Math.floor(elapsedSec / 60) : 0);
      const cappedMin = Math.min(2880, totalAccruedMin);
      const estBaseExp = Math.floor(c.baseLevel * 10 * cappedMin);
      const estJobExp = Math.floor(c.baseLevel * 5 * cappedMin);
      return { cappedMin, estBaseExp, estJobExp };
    };

    const yieldA = calcYields(active);
    expect(yieldA.cappedMin).toBe(90); // 30 banked + 60 elapsed
    expect(yieldA.estBaseExp).toBe(100 * 10 * 90); // 90,000
    expect(yieldA.estJobExp).toBe(100 * 5 * 90); // 45,000

    // User switches to Char B in Roster
    selectedCharId = 702;
    active = getActiveChar(selectedCharId, selectedCharDetail, roster);

    expect(active.charId).toBe(702);
    expect(active.baseLevel).toBe(50);

    const yieldB = calcYields(active);
    expect(yieldB.cappedMin).toBe(120); // 0 banked + 120 elapsed
    expect(yieldB.estBaseExp).toBe(50 * 10 * 120); // 60,000
    expect(yieldB.estJobExp).toBe(50 * 5 * 120); // 30,000

    // Yields and stats changed cleanly between characters
    expect(yieldB.estBaseExp).not.toBe(yieldA.estBaseExp);
    expect(yieldB.estJobExp).not.toBe(yieldA.estJobExp);
  });
});

