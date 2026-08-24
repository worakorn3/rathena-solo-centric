import { describe, expect, it, mock, spyOn } from "bun:test";
import { GachaService } from "../src/services/gacha.service";
import * as pool from "../src/db/pool";

describe("Web Gacha System (Midgard Egg Spinner Altar)", () => {
  it("computes dynamic discount and returns formatted banners", async () => {
    // Mock database queries
    spyOn(pool, "queryOne").mockImplementation(async (sql: string) => {
      if (sql.includes("solo_stock_meta")) {
        return { mval: 60 }; // 60 mood -> 10% discount
      }
      if (sql.includes("solo_gacha_rotation")) {
        return { count: 1 };
      }
      return null;
    });

    spyOn(pool, "query").mockImplementation(async (sql: string) => {
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

    const banners = await GachaService.getBanners();
    expect(banners.length).toBe(1);
    expect(banners[0].bannerId).toBe("supplies");
    expect(banners[0].discountPct).toBe(10);
    expect(banners[0].effectivePrice).toBe(9000); // 10,000 * (1 - 0.10)
    expect(banners[0].featuredSsr?.itemName).toBe("Bloody Branch");
    expect(banners[0].featuredSrs?.length).toBe(1);
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
});
