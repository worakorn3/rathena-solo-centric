import { describe, expect, it, mock, beforeEach } from "bun:test";

const queryMock = mock(() => Promise.resolve([]));
const queryOneMock = mock(() => Promise.resolve(null));
const executeMock = mock(() => Promise.resolve({ affectedRows: 1 }));
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryQueryOneMock = mock(() => Promise.resolve(null));
const primaryExecuteMock = mock(() => Promise.resolve({ affectedRows: 1 }));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  queryOne: queryOneMock,
  execute: executeMock,
  primaryQuery: primaryQueryMock,
  primaryQueryOne: primaryQueryOneMock,
  primaryExecute: primaryExecuteMock,
}));

import { EconomyService, getRAthenaDayOfYear } from "../src/services/economy.service";

describe("EconomyService - Daily Junk Trader Bounties & On-Hand Selling", () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryOneMock.mockClear();
    executeMock.mockClear();
    primaryQueryMock.mockClear();
    primaryQueryOneMock.mockClear();
    primaryExecuteMock.mockClear();
  });

  it("should parse and map mapreg and custom_junk_pool joined rows correctly into DailyBounty format", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("mapreg m1") && sql.includes("custom_junk_pool")) {
        return [
          {
            var_item: "$JunkT1_1",
            item_id: 904,
            price: 850,
            item_name: "Scorpion Tail",
            mob_name: "Elusive Scorpion",
            mob_lv: 16,
          },
          {
            var_item: "$JunkT1_2",
            item_id: 939,
            price: 600,
            item_name: "Bee Sting",
            mob_name: "Elusive Hornet",
            mob_lv: 11,
          },
          {
            var_item: "$JunkT6_5",
            item_id: 7005,
            price: 12000,
            item_name: "Skull",
            mob_name: "Furious Wanderer",
            mob_lv: 151,
          },
        ];
      }
      return [];
    });

    const bounties = await EconomyService.getDailyBounties();
    expect(bounties.length).toBe(3);

    // Verify Tier 1, Index 1
    expect(bounties[0].tier).toBe(1);
    expect(bounties[0].index).toBe(1);
    expect(bounties[0].itemId).toBe(904);
    expect(bounties[0].itemName).toBe("Scorpion Tail");
    expect(bounties[0].price).toBe(850);
    expect(bounties[0].mobName).toBe("Elusive Scorpion");
    expect(bounties[0].mobLevel).toBe(16);

    // Verify Tier 6, Index 5
    expect(bounties[2].tier).toBe(6);
    expect(bounties[2].index).toBe(5);
    expect(bounties[2].itemId).toBe(7005);
    expect(bounties[2].itemName).toBe("Skull");
    expect(bounties[2].price).toBe(12000);
    expect(bounties[2].mobName).toBe("Furious Wanderer");
    expect(bounties[2].mobLevel).toBe(151);
  });

  it("should handle empty or uninitialized mapreg gracefully without throwing", async () => {
    queryMock.mockImplementation(async () => []);
    const bounties = await EconomyService.getDailyBounties();
    expect(Array.isArray(bounties)).toBe(true);
    expect(bounties.length).toBe(0);
  });

  it("should fetch player inventory matches, recommendations, and quota via getPlayerBounties", async () => {
    const currentDay = getRAthenaDayOfYear();

    queryOneMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `char`")) {
        return {
          char_id: 150001,
          name: "Valkyrie_Knight",
          class: 4008, // Lord Knight
          base_level: 99,
          zeny: 500000,
          online: 0,
        };
      }
      return null;
    });

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `acc_reg_num`")) {
        return [
          { key: "#DailyJunkSold", value: 30 },
          { key: "#LastJunkDay", value: currentDay },
          { key: "#TotalJunkSold", value: 500 },
          { key: "#LifetimeZenyEarned", value: 2500000 },
        ];
      }
      if (sql.includes("FROM `inventory`")) {
        return [
          { nameid: 904, total_amount: 45 }, // Scorpion Tail
          { nameid: 939, total_amount: 10 }, // Bee Sting
        ];
      }
      if (sql.includes("FROM `storage`")) {
        return [
          { nameid: 904, total_amount: 100 }, // Scorpion Tail in storage
        ];
      }
      if (sql.includes("mapreg m1")) {
        return [
          {
            var_item: "$JunkT1_1",
            item_id: 904,
            price: 850,
            item_name: "Scorpion Tail",
            mob_name: "Elusive Scorpion",
            mob_lv: 16,
          },
          {
            var_item: "$JunkT1_2",
            item_id: 939,
            price: 600,
            item_name: "Bee Sting",
            mob_name: "Elusive Hornet",
            mob_lv: 11,
          },
          {
            var_item: "$JunkT2_1",
            item_id: 1010,
            price: 2000,
            item_name: "Orcish Voucher",
            mob_name: "Furious Orc Warrior",
            mob_lv: 44,
          },
        ];
      }
      return [];
    });

    const res = await EconomyService.getPlayerBounties(2000001, 150001);
    expect(res.success).toBe(true);
    expect(res.character?.name).toBe("Valkyrie_Knight");
    expect(res.character?.online).toBe(false);
    expect(res.quota?.dailySold).toBe(30);
    expect(res.quota?.remainingQuota).toBe(70);
    expect(res.quota?.dailyLimit).toBe(100);

    // Recommended on hand should contain items in inventory (904 and 939)
    expect(res.recommendedOnHand?.length).toBe(2);
    const scorp = res.recommendedOnHand?.find((b) => b.itemId === 904);
    expect(scorp).toBeDefined();
    expect(scorp?.inInventory).toBe(45);
    expect(scorp?.inStorage).toBe(100);
    expect(scorp?.totalAvailable).toBe(145);
    expect(scorp?.potentialZeny).toBe(45 * 850);

    const voucher = res.allBounties?.find((b) => b.itemId === 1010);
    expect(voucher?.inInventory).toBe(0);
    expect(voucher?.isRecommended).toBe(false);
  });

  it("should reset daily quota when day of year has changed", async () => {
    queryOneMock.mockImplementation(async () => ({
      char_id: 150001,
      name: "Valkyrie_Knight",
      class: 4008,
      base_level: 99,
      zeny: 500000,
      online: 0,
    }));

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `acc_reg_num`")) {
        return [
          { key: "#DailyJunkSold", value: 100 }, // Maxed yesterday
          { key: "#LastJunkDay", value: 1 }, // Old day
          { key: "#TotalJunkSold", value: 500 },
          { key: "#LifetimeZenyEarned", value: 2500000 },
        ];
      }
      return [];
    });

    const res = await EconomyService.getPlayerBounties(2000001, 150001);
    expect(res.success).toBe(true);
    expect(res.quota?.dailySold).toBe(0); // Reset
    expect(res.quota?.remainingQuota).toBe(100);
  });

  it("should reject direct web selling if character is online in-game", async () => {
    primaryQueryOneMock.mockImplementation(async () => ({
      char_id: 150001,
      name: "Valkyrie_Knight",
      zeny: 500000,
      online: 1, // Currently online in-game!
    }));

    const res = await EconomyService.sellBountyItem(2000001, 150001, 904, 10, "INVENTORY");
    expect(res.success).toBe(false);
    expect(res.error).toContain("logged into the game");
  });

  it("should successfully execute direct web sale and mutate inventory, zeny, and acc_reg_num", async () => {
    const currentDay = getRAthenaDayOfYear();

    primaryQueryOneMock.mockImplementation(async () => ({
      char_id: 150001,
      name: "Valkyrie_Knight",
      zeny: 100000,
      online: 0, // Offline safe
    }));

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("mapreg m1")) {
        return [
          {
            var_item: "$JunkT1_1",
            item_id: 904,
            price: 850,
            item_name: "Scorpion Tail",
            mob_name: "Elusive Scorpion",
            mob_lv: 16,
          },
        ];
      }
      return [];
    });

    primaryQueryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `acc_reg_num`")) {
        return [
          { key: "#DailyJunkSold", value: 10 },
          { key: "#LastJunkDay", value: currentDay },
          { key: "#TotalJunkSold", value: 50 },
          { key: "#LifetimeZenyEarned", value: 40000 },
        ];
      }
      if (sql.includes("FROM `inventory`")) {
        return [{ id: 991, amount: 20 }];
      }
      return [];
    });

    const res = await EconomyService.sellBountyItem(2000001, 150001, 904, 15, "INVENTORY");
    expect(res.success).toBe(true);
    expect(res.soldAmount).toBe(15);
    expect(res.pricePerUnit).toBe(850);
    expect(res.payoutZeny).toBe(15 * 850); // 12,750
    expect(res.newCharZeny).toBe(100000 + 12750);
    expect(res.quota?.dailySold).toBe(25);
    expect(res.quota?.remainingQuota).toBe(75);

    // Verify DB mutations executed on primary DB
    expect(primaryExecuteMock).toHaveBeenCalled();
  });

  it("should reject sell if turn-in exceeds daily quota limit", async () => {
    const currentDay = getRAthenaDayOfYear();

    primaryQueryOneMock.mockImplementation(async () => ({
      char_id: 150001,
      name: "Valkyrie_Knight",
      zeny: 100000,
      online: 0,
    }));

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("mapreg m1")) {
        return [
          {
            var_item: "$JunkT1_1",
            item_id: 904,
            price: 850,
            item_name: "Scorpion Tail",
            mob_name: "Elusive Scorpion",
            mob_lv: 16,
          },
        ];
      }
      return [];
    });

    primaryQueryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `acc_reg_num`")) {
        return [
          { key: "#DailyJunkSold", value: 95 }, // Only 5 quota remaining today!
          { key: "#LastJunkDay", value: currentDay },
        ];
      }
      if (sql.includes("FROM `inventory`")) {
        return [{ id: 991, amount: 20 }];
      }
      return [];
    });

    const res = await EconomyService.sellBountyItem(2000001, 150001, 904, 10, "INVENTORY");
    expect(res.success).toBe(false);
    expect(res.error).toContain("exceeds your remaining daily quota");
  });
});
