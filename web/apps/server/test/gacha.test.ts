import { describe, expect, it, mock, spyOn } from "bun:test";
import { GachaService } from "../src/services/gacha.service";
import * as pool from "../src/db/pool";

describe("Web Gacha System (Midgard Egg Spinner Altar)", () => {
  it("computes dynamic discount and returns formatted banners for Bullish market", async () => {
    // Mock database queries
    spyOn(pool, "query").mockImplementation(async (sql: string) => {
      if (sql.includes("solo_stock_meta")) {
        return [
          { mkey: "MarketMood", mval: 1 }, // Bullish (1)
          { mkey: "MarketDrift", mval: 3 }, // Drift +3 -> 5 + (3 * 2) = 11% discount
        ];
      }
      if (sql.includes("solo_gacha_banners")) {
        return [
          {
            banner_id: "supplies",
            name: "General Supplies",
            description: "Supplies test banner",
            icon: "flask-conical",
            base_price: 10000,
            ssr_rate: "10.00",
            sr_rate: "25.00",
            r_rate: "65.00",
            pity_threshold: 20,
            enabled: 1,
            sort_order: 1,
          },
        ];
      }
      if (sql.includes("solo_gacha_rotation")) {
        return [
          {
            banner_id: "supplies",
            featured_ssr_id: 12103,
            featured_sr_ids: "[12710, 22774]",
            rotated_date: "2026-08-24",
          },
        ];
      }
      if (sql.includes("solo_gacha_pool")) {
        return [
          {
            id: 1,
            banner_id: "supplies",
            nameid: 12103,
            item_name: "Bloody Branch",
            amount: 1,
            refine: 0,
            tier: "SSR",
            weight: 10,
            enabled: 1,
          },
          {
            id: 2,
            banner_id: "supplies",
            nameid: 12710,
            item_name: "Guyak Pudding",
            amount: 5,
            refine: 0,
            tier: "SR",
            weight: 20,
            enabled: 1,
          },
        ];
      }
      return [];
    });

    const econState = await GachaService.getMarketEconomicState();
    expect(econState.marketMood).toBe(1);
    expect(econState.marketDrift).toBe(3);
    expect(econState.discountPct).toBe(11);

    const banners = await GachaService.getBanners();
    expect(banners.length).toBe(1);
    expect(banners[0].bannerId).toBe("supplies");
    expect(banners[0].discountPct).toBe(11);
    expect(banners[0].effectivePrice).toBe(8900); // 10,000 * (1 - 0.11)
    expect(banners[0].featuredSsr?.itemName).toBe("Bloody Branch");
    expect(banners[0].featuredSrs?.length).toBe(1);
  });

  it("computes dynamic surcharge for Bearish market", async () => {
    spyOn(pool, "query").mockImplementation(async (sql: string) => {
      if (sql.includes("solo_stock_meta")) {
        return [
          { mkey: "MarketMood", mval: 2 }, // Bearish (2)
          { mkey: "MarketDrift", mval: -2 }, // Drift -2 -> -5 + (-2 * 1.5) = -8% surcharge
        ];
      }
      return [];
    });

    const econState = await GachaService.getMarketEconomicState();
    expect(econState.marketMood).toBe(2);
    expect(econState.marketDrift).toBe(-2);
    expect(econState.discountPct).toBe(-8);
  });

  it("calculates correct Gacha Shards when scrapping items", async () => {
    spyOn(pool, "primaryQuery").mockImplementation(async (sql: string) => {
      if (sql.includes("solo_gacha_stash")) {
        return [
          { id: 1, tier: "SSR" }, // 100
          { id: 2, tier: "SR" },  // 25
          { id: 3, tier: "R" },   // 5
          { id: 4, tier: "R" },   // 5
        ];
      }
      return [];
    });

    let executedSql: string[] = [];
    spyOn(pool, "primaryExecute").mockImplementation(async (sql: string) => {
      executedSql.push(sql);
      return { insertId: 0, affectedRows: 4 };
    });

    spyOn(pool, "primaryQueryOne").mockImplementation(async () => {
      return { value: 135 }; // 100 + 25 + 5 + 5 = 135
    });

    const res = await GachaService.scrapItems(2000001, [1, 2, 3, 4]);
    expect(res.success).toBe(true);
    expect(res.shardsGained).toBe(135);
    expect(res.totalShards).toBe(135);
    expect(executedSql.some((s) => s.includes("acc_reg_num"))).toBe(true);
    expect(executedSql.some((s) => s.includes("solo_gacha_stash"))).toBe(true);
  });

  it("rejects gacha pull when character is online in-game", async () => {
    spyOn(pool, "primaryQueryOne").mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, zeny: 1000000, name: "TestNovice", online: 1 };
      }
      return null;
    });

    const res = await GachaService.pull(2000001, {
      bannerId: "supplies",
      count: 1,
      charId: 150001,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("logged into the game");
  });

  it("executes gacha pull with atomic online = 0 deduction when character is offline", async () => {
    spyOn(pool, "primaryQueryOne").mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `char`")) {
        return { char_id: 150001, zeny: 1000000, name: "TestNovice", online: 0 };
      }
      if (sql.includes("FROM `solo_gacha_banners`")) {
        return {
          banner_id: "supplies",
          name: "Supplies",
          base_price: 10000,
          ssr_rate: "10.00",
          sr_rate: "25.00",
          r_rate: "65.00",
          pity_threshold: 20,
          enabled: 1,
        };
      }
      if (sql.includes("FROM `solo_gacha_rotation`")) {
        return { featured_ssr_id: 12103, featured_sr_ids: "[]" };
      }
      if (sql.includes("FROM `solo_gacha_pity`")) {
        return { pity_count: 0 };
      }
      return null;
    });

    spyOn(pool, "query").mockImplementation(async () => []);
    spyOn(pool, "primaryQuery").mockImplementation(async (sql: string) => {
      if (sql.includes("FROM `solo_gacha_pool`")) {
        return [
          {
            id: 1,
            banner_id: "supplies",
            nameid: 12103,
            item_name: "Bloody Branch",
            amount: 1,
            refine: 0,
            tier: "SSR",
            weight: 100,
            enabled: 1,
          },
        ];
      }
      return [];
    });

    let executedSql: string[] = [];
    spyOn(pool, "primaryExecute").mockImplementation(async (sql: string) => {
      executedSql.push(sql);
      return { insertId: 1, affectedRows: 1 };
    });

    const res = await GachaService.pull(2000001, {
      bannerId: "supplies",
      count: 1,
      charId: 150001,
    });

    expect(res.success).toBe(true);
    expect(res.rewards.length).toBe(1);
    expect(res.rewards[0].stashId).toBe(1);

    const zenyDeductCall = executedSql.find((s) => s.includes("UPDATE `char` SET `zeny`"));
    expect(zenyDeductCall).toBeDefined();
    expect(zenyDeductCall).toContain("`online` = 0");
    expect(zenyDeductCall).toContain("`zeny` >=");
  });
});
