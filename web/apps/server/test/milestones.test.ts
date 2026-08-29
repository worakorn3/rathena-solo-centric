import { describe, expect, it, mock, beforeEach } from "bun:test";

const queryMock = mock(() => Promise.resolve([]));
const queryOneMock = mock(() => Promise.resolve(null));
const executeMock = mock(() => Promise.resolve({ affectedRows: 1 }));
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryQueryOneMock = mock(() => Promise.resolve(null));
const primaryExecuteMock = mock(() => Promise.resolve({ affectedRows: 1, insertId: 42 }));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  queryOne: queryOneMock,
  execute: executeMock,
  primaryQuery: primaryQueryMock,
  primaryQueryOne: primaryQueryOneMock,
  primaryExecute: primaryExecuteMock,
}));

import { TrackingService } from "../src/services/tracking.service";

describe("TrackingService - Dynamic Hunt Milestones & 1-Click RODEX Delivery", () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryOneMock.mockClear();
    executeMock.mockClear();
    primaryQueryMock.mockClear();
    primaryQueryOneMock.mockClear();
    primaryExecuteMock.mockClear();
  });

  it("should dynamically evaluate milestone progression and prerequisite locking", async () => {
    queryMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("solo_persistence_log") && sql.includes("KILL")) {
        return [
          { target_id: 1002, value: 600, tstamp: "2026-08-28 10:00:00" }, // Poring (Novice)
          { target_id: 1023, value: 1200, tstamp: "2026-08-28 11:00:00" }, // Orc Warrior (2nd)
          { target_id: 1163, value: 2000, tstamp: "2026-08-28 12:00:00" }, // Raydric (Trans)
          { target_id: 1086, value: 55, tstamp: "2026-08-28 13:00:00" }, // Golden Thief Bug (MVP)
        ];
      }
      if (sql.includes("solo_persistence_log") && sql.includes("LOOT")) {
        return [];
      }
      if (sql.includes("solo_milestones")) {
        return [
          {
            id: "poring_hunter_500",
            category: "SPECIFIC_MOB",
            prev_milestone_id: null,
            target_mob_id: 1002,
            required_count: 500,
            title: "Jelly Menace",
            description: "Defeat 500 Porings",
            reward_zeny: 25000,
            reward_item_id: 501,
            reward_item_amount: 50,
            reward_desc: "25,000 Zeny + 50x Red Potions",
            tier_label: "Novice (Lv 1–40)",
            is_active: 1,
            sort_order: 1,
          },
          {
            id: "orc_warrior_1000",
            category: "SPECIFIC_MOB",
            prev_milestone_id: "poring_hunter_500",
            target_mob_id: 1023,
            required_count: 1000,
            title: "Orc Village Conqueror",
            description: "Defeat 1,000 Orc Warriors",
            reward_zeny: 100000,
            reward_item_id: 604,
            reward_item_amount: 5,
            reward_desc: "100,000 Zeny + 5x Dead Branches",
            tier_label: "2nd Class (Lv 41–99)",
            is_active: 1,
            sort_order: 2,
          },
          {
            id: "raydric_slayer_1500",
            category: "SPECIFIC_MOB",
            prev_milestone_id: "orc_warrior_1000",
            target_mob_id: 1163,
            required_count: 1500,
            title: "Glast Heim Knightfall",
            description: "Slay 1,500 Raydrics",
            reward_zeny: 350000,
            reward_item_id: 984,
            reward_item_amount: 10,
            reward_desc: "350,000 Zeny + 10x Oridecon",
            tier_label: "Trans (Lv 90–99)",
            is_active: 1,
            sort_order: 3,
          },
          {
            id: "mvp_centurion_50",
            category: "MVP",
            prev_milestone_id: null,
            target_mob_id: 0,
            required_count: 50,
            title: "Centurion Slayer",
            description: "Defeat 50 MvPs",
            reward_zeny: 1000000,
            reward_item_id: 0,
            reward_item_amount: 0,
            reward_desc: "1,000,000z",
            tier_label: "Global / Boss",
            is_active: 1,
            sort_order: 4,
          },
        ];
      }
      if (sql.includes("solo_milestone_claims")) {
        // Account has only claimed Poring so far
        return [{ milestone_id: "poring_hunter_500" }];
      }
      return [];
    });

    const summary = await TrackingService.getProgressionSummary(2000001);

    expect(summary.totalKills).toBe(600 + 1200 + 2000 + 55);
    expect(summary.mvpKills).toBe(55);
    expect(summary.milestones.length).toBe(4);

    // 1. Poring: claimed, not locked, completed
    const poringM = summary.milestones.find((m) => m.id === "poring_hunter_500");
    expect(poringM).toBeDefined();
    expect(poringM?.currentCount).toBe(600);
    expect(poringM?.isLocked).toBe(false);
    expect(poringM?.isCompleted).toBe(true);
    expect(poringM?.isClaimed).toBe(true);

    // 2. Orc Warrior: unlocked (Poring claimed), completed (1200 >= 1000), not yet claimed
    const orcM = summary.milestones.find((m) => m.id === "orc_warrior_1000");
    expect(orcM).toBeDefined();
    expect(orcM?.currentCount).toBe(1200);
    expect(orcM?.isLocked).toBe(false);
    expect(orcM?.isCompleted).toBe(true);
    expect(orcM?.isClaimed).toBe(false);

    // 3. Raydric Slayer: LOCKED (requires Orc Warrior which is not yet claimed)
    const raydricM = summary.milestones.find((m) => m.id === "raydric_slayer_1500");
    expect(raydricM).toBeDefined();
    expect(raydricM?.isLocked).toBe(true);
    expect(raydricM?.isCompleted).toBe(false);
    expect(raydricM?.prevMilestoneId).toBe("orc_warrior_1000");
    expect(raydricM?.prevMilestoneTitle).toBe("Orc Village Conqueror");

    // 4. MvP Centurion: independent (no prereq) -> unlocked & completed
    const mvpM = summary.milestones.find((m) => m.id === "mvp_centurion_50");
    expect(mvpM).toBeDefined();
    expect(mvpM?.isLocked).toBe(false);
    expect(mvpM?.isCompleted).toBe(true);
  });

  it("should reject claiming if prerequisite milestone has not been claimed", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "SolitaryKnight" };
      }
      if (sql.includes("FROM `solo_milestones`")) {
        return {
          id: "raydric_slayer_1500",
          category: "SPECIFIC_MOB",
          prev_milestone_id: "orc_warrior_1000",
          target_mob_id: 1163,
          required_count: 1500,
          title: "Glast Heim Knightfall",
          reward_desc: "350,000 Zeny",
          is_active: 1,
        };
      }
      if (sql.includes("FROM `solo_milestone_claims`")) {
        return null; // Prereq not claimed!
      }
      return null;
    });

    const res = await TrackingService.claimMilestoneToRodex(2000001, 150001, "raydric_slayer_1500");

    expect(res.success).toBe(false);
    expect(res.error).toContain("Prerequisite milestone has not been claimed yet");
    expect(primaryExecuteMock).not.toHaveBeenCalled();
  });

  it("should successfully claim completed milestone and dispatch parcel to RODEX mail", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "SolitaryKnight" };
      }
      if (sql.includes("FROM `solo_milestones`")) {
        return {
          id: "orc_warrior_1000",
          category: "SPECIFIC_MOB",
          prev_milestone_id: "poring_hunter_500",
          target_mob_id: 1023,
          required_count: 1000,
          title: "Orc Village Conqueror",
          description: "Defeat 1,000 Orc Warriors",
          reward_zeny: 100000,
          reward_item_id: 604,
          reward_item_amount: 5,
          reward_desc: "100,000 Zeny + 5x Dead Branches",
          tier_label: "2nd Class (Lv 41–99)",
          is_active: 1,
          sort_order: 2,
        };
      }
      if (sql.includes("FROM `solo_milestone_claims`") && params[1] === "poring_hunter_500") {
        return { milestone_id: "poring_hunter_500" }; // Prerequisite claimed!
      }
      if (sql.includes("FROM `solo_milestone_claims`") && params[1] === "orc_warrior_1000") {
        return null; // Not yet claimed
      }
      return null;
    });

    primaryQueryMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `solo_persistence_log`")) {
        return [{ target_id: 1023, value: 1200 }];
      }
      return [];
    });

    primaryExecuteMock.mockImplementation(async (sql: string, params: any[]) => {
      return { affectedRows: 1, insertId: 999 };
    });

    const res = await TrackingService.claimMilestoneToRodex(2000001, 150001, "orc_warrior_1000");

    expect(res.success).toBe(true);
    expect(res.recipientChar).toBe("SolitaryKnight");
    expect(res.rewardDesc).toContain("100,000 Zeny");

    // Verify DB calls
    const executedSqls = primaryExecuteMock.mock.calls.map((c: any) => c[0]);
    
    // 1. solo_milestone_claims insertion
    expect(executedSqls.some((s: string) => s.includes("INSERT INTO `solo_milestone_claims`"))).toBe(true);

    // 2. mail insertion for RODEX
    expect(executedSqls.some((s: string) => s.includes("INSERT INTO `mail`"))).toBe(true);

    // 3. mail_attachments insertion with reward item
    expect(executedSqls.some((s: string) => s.includes("INSERT INTO `mail_attachments`"))).toBe(true);
  });

  it("should reject claiming if completion requirements are not met", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "SolitaryKnight" };
      }
      if (sql.includes("FROM `solo_milestones`")) {
        return {
          id: "orc_warrior_1000",
          category: "SPECIFIC_MOB",
          prev_milestone_id: null,
          target_mob_id: 1023,
          required_count: 1000,
          title: "Orc Village Conqueror",
          reward_zeny: 100000,
          reward_item_id: 604,
          reward_item_amount: 5,
          is_active: 1,
        };
      }
      if (sql.includes("FROM `solo_milestone_claims`")) {
        return null;
      }
      return null;
    });

    primaryQueryMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `solo_persistence_log`")) {
        return [{ target_id: 1023, value: 400 }]; // only 400 / 1000 kills
      }
      return [];
    });

    const res = await TrackingService.claimMilestoneToRodex(2000001, 150001, "orc_warrior_1000");

    expect(res.success).toBe(false);
    expect(res.error).toContain("Requirements not met");
    expect(primaryExecuteMock).not.toHaveBeenCalled();
  });

  it("should reject claiming if milestone has already been claimed", async () => {
    primaryQueryOneMock.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, name: "SolitaryKnight" };
      }
      if (sql.includes("FROM `solo_milestones`")) {
        return {
          id: "poring_hunter_500",
          category: "SPECIFIC_MOB",
          prev_milestone_id: null,
          target_mob_id: 1002,
          required_count: 500,
          title: "Jelly Menace",
          is_active: 1,
        };
      }
      if (sql.includes("FROM `solo_milestone_claims`")) {
        return { milestone_id: "poring_hunter_500" }; // Already claimed!
      }
      return null;
    });

    const res = await TrackingService.claimMilestoneToRodex(2000001, 150001, "poring_hunter_500");

    expect(res.success).toBe(false);
    expect(res.error).toContain("already been claimed");
    expect(primaryExecuteMock).not.toHaveBeenCalled();
  });

  it("should support Admin CRUD operations on solo_milestones with prev_milestone_id", async () => {
    primaryQueryMock.mockResolvedValueOnce([
      {
        id: "test_milestone",
        category: "TOTAL",
        prev_milestone_id: null,
        target_mob_id: 0,
        required_count: 5000,
        title: "Test Exterminator",
        description: "Test description",
        reward_zeny: 10000,
        reward_item_id: 501,
        reward_item_amount: 10,
        reward_desc: "10,000z",
        tier_label: "Global / Boss",
        is_active: 1,
        sort_order: 1,
      },
    ]);

    const adminList = await TrackingService.getAllMilestonesAdmin();
    expect(adminList.length).toBe(1);
    expect(adminList[0].id).toBe("test_milestone");
    expect(adminList[0].prev_milestone_id).toBeNull();

    await TrackingService.saveMilestoneAdmin({
      id: "test_milestone_2",
      title: "Second Milestone",
      category: "MVP",
      prev_milestone_id: "test_milestone",
      required_count: 10,
    });

    expect(primaryExecuteMock).toHaveBeenCalled();

    await TrackingService.deleteMilestoneAdmin("test_milestone_2");
    expect(primaryExecuteMock).toHaveBeenCalledTimes(2);
  });
});
