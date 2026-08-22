import { describe, expect, it, mock, beforeEach } from "bun:test";

const queryMock = mock(() => Promise.resolve([]));
const executeMock = mock(() => Promise.resolve([]));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  execute: executeMock,
  primaryQuery: queryMock,
  primaryExecute: executeMock,
}));

import { EconomyService } from "../src/services/economy.service";

describe("EconomyService - Daily Junk Trader Bounties", () => {
  beforeEach(() => {
    queryMock.mockClear();
    executeMock.mockClear();
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

  it("should provide default fallback strings if custom_junk_pool metadata is missing", async () => {
    queryMock.mockImplementation(async () => [
      {
        var_item: "$JunkT2_1",
        item_id: 99999,
        price: 500,
        item_name: null,
        mob_name: null,
        mob_lv: null,
      },
    ]);

    const bounties = await EconomyService.getDailyBounties();
    expect(bounties.length).toBe(1);
    expect(bounties[0].tier).toBe(2);
    expect(bounties[0].index).toBe(1);
    expect(bounties[0].itemName).toBe("Unknown Item");
    expect(bounties[0].mobName).toBe("Unknown Monster");
    expect(bounties[0].mobLevel).toBe(0);
  });
});
