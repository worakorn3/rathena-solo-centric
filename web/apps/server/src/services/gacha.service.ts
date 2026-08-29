import { query, queryOne, primaryExecute, primaryQuery, primaryQueryOne } from "../db/pool";
import {
  GachaBanner,
  GachaPoolItem,
  GachaPullRequest,
  GachaPullResult,
  GachaRewardItem,
  GachaStashItem,
  GachaShopItem,
  GachaHistoryLog,
  GachaAdminItemPayload,
  GachaAdminBannerPayload,
  GachaTier,
  GachaRosterItem,
} from "@rathena/shared";

interface RawBannerRow {
  banner_id: string;
  name: string;
  description: string;
  icon: string;
  base_price: number;
  ssr_rate: string | number;
  sr_rate: string | number;
  r_rate: string | number;
  pity_threshold: number;
  enabled: number;
  sort_order: number;
}

interface RawPoolItemRow {
  id: number;
  banner_id: string;
  nameid: number;
  item_name: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  weight: number;
  enabled: number;
}

interface RawRotationRow {
  banner_id: string;
  featured_ssr_id: number;
  featured_sr_ids: string;
  rotated_date: string;
}

export class GachaService {
  /**
   * Get Current Stock Market Economic Conditions for Gacha Pricing
   * 1 = Bullish -> base 5% discount + drift * 2% (clamped 1% to 15% discount)
   * 2 = Bearish -> base -5% surcharge + drift * 1.5% (clamped -10% to -1% surcharge)
   * 3 = Chaos -> erratic swing based on drift * 3%, clamped between -10% and 15%
   * 0 / Other = Neutral -> drift * 1%, clamped between -4% and 4%
   */
  static async getMarketEconomicState(): Promise<{
    marketMood: number;
    marketDrift: number;
    discountPct: number;
  }> {
    try {
      const metaRows = await query<{ mkey: string; mval: number }>(
        "SELECT mkey, mval FROM `solo_stock_meta` WHERE mkey IN ('MarketMood', 'MarketDrift')"
      );
      let marketMood = 0;
      let marketDrift = 0;
      for (const row of metaRows) {
        if (row.mkey === "MarketMood") marketMood = Number(row.mval) || 0;
        if (row.mkey === "MarketDrift") marketDrift = Number(row.mval) || 0;
      }

      let discountPct = 0;
      if (marketMood === 1) {
        // Bullish: 5% base discount + 2% per drift point (clamped 1% to 15%)
        discountPct = Math.min(15, Math.max(1, Math.round(5 + marketDrift * 2)));
      } else if (marketMood === 2) {
        // Bearish: -5% base surcharge + 1.5% per drift point (clamped -10% to -1%)
        discountPct = Math.max(-10, Math.min(-1, Math.round(-5 + marketDrift * 1.5)));
      } else if (marketMood === 3) {
        // Chaos: Highly volatile swing based on drift
        discountPct = Math.min(15, Math.max(-10, Math.round(marketDrift * 3)));
      } else {
        // Neutral: Modulated solely by drift (-4% to +4%)
        discountPct = Math.min(4, Math.max(-4, Math.round(marketDrift)));
      }

      return { marketMood, marketDrift, discountPct };
    } catch {
      return { marketMood: 0, marketDrift: 0, discountPct: 0 };
    }
  }

  /**
   * Get Market Mood Discount percentage (0-15% discount for bull markets, 0-10% surcharge for bear markets)
   */
  static async getMarketDiscountPct(): Promise<number> {
    const { discountPct } = await this.getMarketEconomicState();
    return discountPct;
  }

  /**
   * Get all active banners with calculated dynamic pricing, daily rotation spotlights, and player pity stats
   */
  static async getBanners(accountId?: number): Promise<GachaBanner[]> {
    // Check if daily rotation needs catch-up
    await this.checkAndRotateDaily();

    const { discountPct } = await this.getMarketEconomicState();

    const bannerRows = await query<RawBannerRow>(
      "SELECT * FROM `solo_gacha_banners` WHERE `enabled` = 1 ORDER BY `sort_order` ASC"
    );

    const rotationRows = await query<RawRotationRow>(
      "SELECT * FROM `solo_gacha_rotation`"
    );
    const rotationMap = new Map(rotationRows.map((r) => [r.banner_id, r]));

    const poolRows = await query<RawPoolItemRow>(
      "SELECT * FROM `solo_gacha_pool` WHERE `enabled` = 1"
    );

    let pityMap = new Map<string, number>();
    if (accountId) {
      const pityRows = await query<{ banner_id: string; pity_count: number }>(
        "SELECT banner_id, pity_count FROM `solo_gacha_pity` WHERE account_id = ?",
        [accountId]
      );
      pityMap = new Map(pityRows.map((p) => [p.banner_id, Number(p.pity_count) || 0]));
    }

    // Calculate seconds until next midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const nextRotationInSeconds = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));

    return bannerRows.map((b) => {
      const basePrice = Number(b.base_price);
      // Effective price with discount
      const effectivePrice = Math.max(100, Math.round(basePrice * (1 - discountPct / 100)));

      const rot = rotationMap.get(b.banner_id);
      let featuredSsr: GachaPoolItem | null = null;
      let featuredSrs: GachaPoolItem[] = [];
      const bannerPool = poolRows.filter((p) => p.banner_id === b.banner_id);

      const ssrPool = bannerPool.filter((p) => p.tier === "SSR");
      const srPool = bannerPool.filter((p) => p.tier === "SR");
      const rPool = bannerPool.filter((p) => p.tier === "R");

      const ssrRate = Number(b.ssr_rate);
      const srRate = Number(b.sr_rate);
      const rRate = Number(b.r_rate);

      const totalSsrWeight = ssrPool.reduce((sum, p) => sum + Number(p.weight), 0) || 1;
      const totalSrWeight = srPool.reduce((sum, p) => sum + Number(p.weight), 0) || 1;
      const totalRWeight = rPool.reduce((sum, p) => sum + Number(p.weight), 0) || 1;

      const featuredSsrId = rot ? Number(rot.featured_ssr_id) : 0;
      let parsedSrIds: number[] = [];
      if (rot) {
        try {
          parsedSrIds = JSON.parse(rot.featured_sr_ids || "[]");
        } catch {
          parsedSrIds = [];
        }
      }

      if (rot) {
        const ssrItem = bannerPool.find((p) => p.nameid === featuredSsrId && p.tier === "SSR");
        if (ssrItem) {
          featuredSsr = {
            id: ssrItem.id,
            bannerId: ssrItem.banner_id,
            nameId: ssrItem.nameid,
            itemName: ssrItem.item_name,
            amount: ssrItem.amount,
            refine: ssrItem.refine,
            tier: ssrItem.tier,
            weight: ssrItem.weight,
            enabled: Boolean(ssrItem.enabled),
          };
        }

        featuredSrs = bannerPool
          .filter((p) => parsedSrIds.includes(p.nameid) && p.tier === "SR")
          .map((p) => ({
            id: p.id,
            bannerId: p.banner_id,
            nameId: p.nameid,
            itemName: p.item_name,
            amount: p.amount,
            refine: p.refine,
            tier: p.tier,
            weight: p.weight,
            enabled: Boolean(p.enabled),
          }));
      }

      // Compute full drop roster with individual dropRatePct
      const roster: GachaRosterItem[] = [];

      // 1. SSR items
      const hasFeaturedSsr = ssrPool.some((p) => p.nameid === featuredSsrId);
      for (const item of ssrPool) {
        const isSpotlight = item.nameid === featuredSsrId;
        let dropRatePct = 0;
        if (hasFeaturedSsr) {
          if (isSpotlight) {
            dropRatePct = (0.50 * ssrRate) + (0.50 * ssrRate * (Number(item.weight) / totalSsrWeight));
          } else {
            dropRatePct = 0.50 * ssrRate * (Number(item.weight) / totalSsrWeight);
          }
        } else {
          dropRatePct = ssrRate * (Number(item.weight) / totalSsrWeight);
        }
        roster.push({
          id: item.id,
          bannerId: item.banner_id,
          nameId: item.nameid,
          itemName: item.item_name,
          amount: Number(item.amount),
          refine: Number(item.refine),
          tier: "SSR",
          weight: Number(item.weight),
          isSpotlight,
          dropRatePct: Number(dropRatePct.toFixed(4)),
        });
      }

      // 2. SR items
      const spotlightSrCount = srPool.filter((p) => parsedSrIds.includes(p.nameid)).length;
      for (const item of srPool) {
        const isSpotlight = parsedSrIds.includes(item.nameid);
        let dropRatePct = 0;
        if (spotlightSrCount > 0) {
          if (isSpotlight) {
            dropRatePct = ((0.50 * srRate) / spotlightSrCount) + (0.50 * srRate * (Number(item.weight) / totalSrWeight));
          } else {
            dropRatePct = 0.50 * srRate * (Number(item.weight) / totalSrWeight);
          }
        } else {
          dropRatePct = srRate * (Number(item.weight) / totalSrWeight);
        }
        roster.push({
          id: item.id,
          bannerId: item.banner_id,
          nameId: item.nameid,
          itemName: item.item_name,
          amount: Number(item.amount),
          refine: Number(item.refine),
          tier: "SR",
          weight: Number(item.weight),
          isSpotlight,
          dropRatePct: Number(dropRatePct.toFixed(4)),
        });
      }

      // 3. R items
      for (const item of rPool) {
        const dropRatePct = rRate * (Number(item.weight) / totalRWeight);
        roster.push({
          id: item.id,
          bannerId: item.banner_id,
          nameId: item.nameid,
          itemName: item.item_name,
          amount: Number(item.amount),
          refine: Number(item.refine),
          tier: "R",
          weight: Number(item.weight),
          isSpotlight: false,
          dropRatePct: Number(dropRatePct.toFixed(4)),
        });
      }

      // Sort: SSR -> SR -> R; spotlights first; descending dropRatePct
      roster.sort((a, b) => {
        const tierOrder = { SSR: 0, SR: 1, R: 2 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        if (a.isSpotlight !== b.isSpotlight) return a.isSpotlight ? -1 : 1;
        return b.dropRatePct - a.dropRatePct;
      });

      return {
        bannerId: b.banner_id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        basePrice,
        effectivePrice,
        discountPct,
        ssrRate,
        srRate,
        rRate,
        pityThreshold: Number(b.pity_threshold),
        currentPity: pityMap.get(b.banner_id) || 0,
        enabled: Boolean(b.enabled),
        sortOrder: Number(b.sort_order),
        featuredSsr,
        featuredSrs,
        roster,
        nextRotationInSeconds,
      };
    });
  }

  /**
   * Daily midnight rotation and offline server boot catch-up
   */
  static async checkAndRotateDaily(force = false): Promise<void> {
    try {
      const checkRow = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM `solo_gacha_rotation` WHERE `rotated_date` = CURDATE()"
      );

      if (!force && checkRow && Number(checkRow.count) > 0) {
        return; // Already rotated for today
      }

      await this.rotateAllBanners();
    } catch (err) {
      console.error("[GachaService] Failed checkAndRotateDaily:", err);
    }
  }

  /**
   * Perform live rotation for all active banners
   */
  static async rotateAllBanners(): Promise<void> {
    const banners = await primaryQuery<RawBannerRow>(
      "SELECT `banner_id` FROM `solo_gacha_banners` WHERE `enabled` = 1"
    );

    for (const b of banners) {
      const poolItems = await primaryQuery<RawPoolItemRow>(
        "SELECT `id`, `nameid`, `tier` FROM `solo_gacha_pool` WHERE `banner_id` = ? AND `enabled` = 1",
        [b.banner_id]
      );

      const ssrItems = poolItems.filter((p) => p.tier === "SSR");
      const srItems = poolItems.filter((p) => p.tier === "SR");

      const randomSsr = ssrItems.length > 0 ? ssrItems[Math.floor(Math.random() * ssrItems.length)] : null;
      const featuredSsrId = randomSsr ? randomSsr.nameid : 0;

      // Shuffle and pick up to 3 SRs
      const shuffledSrs = [...srItems].sort(() => Math.random() - 0.5);
      const selectedSrs = shuffledSrs.slice(0, 3).map((s) => s.nameid);

      await primaryExecute(
        `INSERT INTO \`solo_gacha_rotation\` (\`banner_id\`, \`featured_ssr_id\`, \`featured_sr_ids\`, \`rotated_date\`)
         VALUES (?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE
           \`featured_ssr_id\` = VALUES(\`featured_ssr_id\`),
           \`featured_sr_ids\` = VALUES(\`featured_sr_ids\`),
           \`rotated_date\` = VALUES(\`rotated_date\`)`,
        [b.banner_id, featuredSsrId, JSON.stringify(selectedSrs)]
      );
    }
    console.log("[GachaService] Banners rotated successfully for today.");
  }

  /**
   * Execute 1x or 10x Gacha Pull for Active Character
   */
  static async pull(accountId: number, req: GachaPullRequest): Promise<GachaPullResult> {
    const { bannerId, count, charId } = req;
    if (count !== 1 && count !== 10) {
      return { success: false, bannerId, zenySpent: 0, remainingZeny: 0, pityCount: 0, pityThreshold: 0, rewards: [], error: "Invalid pull count." };
    }

    // 1. Validate character ownership & fetch liquid Zeny (ponytail: fast-fail if in-game)
    const charRow = await primaryQueryOne<{ char_id: number; zeny: number; name: string; online: number }>(
      "SELECT char_id, zeny, name, online FROM `char` WHERE `char_id` = ? AND `account_id` = ? LIMIT 1",
      [charId, accountId]
    );

    if (!charRow) {
      return { success: false, bannerId, zenySpent: 0, remainingZeny: 0, pityCount: 0, pityThreshold: 0, rewards: [], error: "Character not found or unowned." };
    }

    if (charRow.online === 1) {
      return {
        success: false,
        bannerId,
        zenySpent: 0,
        remainingZeny: Number(charRow.zeny),
        pityCount: 0,
        pityThreshold: 0,
        rewards: [],
        error: "Character is currently logged into the game. Please log out before pulling from Gacha to prevent state desync.",
      };
    }

    // 2. Fetch Banner and calculate effective price
    const bannerRow = await primaryQueryOne<RawBannerRow>(
      "SELECT * FROM `solo_gacha_banners` WHERE `banner_id` = ? AND `enabled` = 1 LIMIT 1",
      [bannerId]
    );

    if (!bannerRow) {
      return { success: false, bannerId, zenySpent: 0, remainingZeny: Number(charRow.zeny), pityCount: 0, pityThreshold: 0, rewards: [], error: "Banner not found or inactive." };
    }

    const discountPct = await this.getMarketDiscountPct();
    const effectivePrice = Math.max(100, Math.round(Number(bannerRow.base_price) * (1 - discountPct / 100)));
    const totalCost = count === 10 ? Math.round(effectivePrice * 10 * 0.9) : effectivePrice;

    if (Number(charRow.zeny) < totalCost) {
      return {
        success: false,
        bannerId,
        zenySpent: 0,
        remainingZeny: Number(charRow.zeny),
        pityCount: 0,
        pityThreshold: Number(bannerRow.pity_threshold),
        rewards: [],
        error: `Insufficient Zeny! Required: ${totalCost.toLocaleString()} Z, Available: ${Number(charRow.zeny).toLocaleString()} Z.`,
      };
    }

    // 3. Fetch Master Pool and Rotation
    const poolRows = await primaryQuery<RawPoolItemRow>(
      "SELECT * FROM `solo_gacha_pool` WHERE `banner_id` = ? AND `enabled` = 1",
      [bannerId]
    );

    if (poolRows.length === 0) {
      return { success: false, bannerId, zenySpent: 0, remainingZeny: Number(charRow.zeny), pityCount: 0, pityThreshold: Number(bannerRow.pity_threshold), rewards: [], error: "Item pool is empty." };
    }

    const ssrPool = poolRows.filter((p) => p.tier === "SSR");
    const srPool = poolRows.filter((p) => p.tier === "SR");
    const rPool = poolRows.filter((p) => p.tier === "R");

    const rotRow = await primaryQueryOne<RawRotationRow>(
      "SELECT * FROM `solo_gacha_rotation` WHERE `banner_id` = ? LIMIT 1",
      [bannerId]
    );

    const featuredSsrId = rotRow ? Number(rotRow.featured_ssr_id) : 0;
    let featuredSrIds: number[] = [];
    try {
      featuredSrIds = JSON.parse(rotRow?.featured_sr_ids || "[]");
    } catch {
      featuredSrIds = [];
    }

    // 4. Fetch Pity State
    const pityRow = await primaryQueryOne<{ pity_count: number }>(
      "SELECT pity_count FROM `solo_gacha_pity` WHERE `account_id` = ? AND `banner_id` = ? LIMIT 1",
      [accountId, bannerId]
    );
    let currentPity = pityRow ? Number(pityRow.pity_count) || 0 : 0;
    const pityThreshold = Number(bannerRow.pity_threshold);

    const ssrRate = Number(bannerRow.ssr_rate);
    const srRate = Number(bannerRow.sr_rate);

    // 5. RNG Pull Execution
    const rewards: GachaRewardItem[] = [];
    let hasSrOrBetter = false;

    for (let i = 0; i < count; i++) {
      currentPity++;
      let roll = Math.random() * 100;
      let tier: GachaTier = "R";

      // 10-Pull SR+ Guarantee on last item
      if (count === 10 && i === 9 && !hasSrOrBetter) {
        roll = Math.random() * (ssrRate + srRate); // Force SR or SSR
      }

      if (currentPity >= pityThreshold || roll < ssrRate) {
        tier = "SSR";
        currentPity = 0; // Pity Reset
        hasSrOrBetter = true;
      } else if (roll < (ssrRate + srRate)) {
        tier = "SR";
        hasSrOrBetter = true;
      } else {
        tier = "R";
      }

      // Pick item within tier using 50% spotlight rate-up
      let selectedItem: RawPoolItemRow | null = null;
      let isSpotlight = false;

      if (tier === "SSR" && ssrPool.length > 0) {
        const featuredItem = ssrPool.find((p) => p.nameid === featuredSsrId);
        if (featuredItem && Math.random() < 0.50) {
          selectedItem = featuredItem;
          isSpotlight = true;
        } else {
          selectedItem = this.weightedPick(ssrPool);
        }
      } else if (tier === "SR" && srPool.length > 0) {
        const spotlightSrs = srPool.filter((p) => featuredSrIds.includes(p.nameid));
        if (spotlightSrs.length > 0 && Math.random() < 0.50) {
          selectedItem = spotlightSrs[Math.floor(Math.random() * spotlightSrs.length)];
          isSpotlight = true;
        } else {
          selectedItem = this.weightedPick(srPool);
        }
      } else {
        selectedItem = this.weightedPick(rPool.length > 0 ? rPool : poolRows);
      }

      if (!selectedItem) {
        selectedItem = poolRows[0];
      }

      rewards.push({
        id: selectedItem.id,
        nameId: selectedItem.nameid,
        itemName: selectedItem.item_name,
        amount: Number(selectedItem.amount),
        refine: Number(selectedItem.refine),
        tier: selectedItem.tier,
        isSpotlight,
      });
    }

    // 6. Primary DB Atomic Mutations
    const newZeny = Number(charRow.zeny) - totalCost;

    // Deduct Zeny (ponytail: atomic mutation with online = 0 and balance verification)
    const zenyRes = await primaryExecute(
      "UPDATE `char` SET `zeny` = `zeny` - ? WHERE `char_id` = ? AND `online` = 0 AND `zeny` >= ?",
      [totalCost, charId, totalCost]
    );

    if (zenyRes.affectedRows === 0) {
      return {
        success: false,
        bannerId,
        zenySpent: 0,
        remainingZeny: Number(charRow.zeny),
        pityCount: 0,
        pityThreshold: Number(bannerRow.pity_threshold),
        rewards: [],
        error: "Gacha pull failed: Character is online in-game or has insufficient Zeny.",
      };
    }

    // Update Pity Counter
    await primaryExecute(
      `INSERT INTO \`solo_gacha_pity\` (\`account_id\`, \`banner_id\`, \`pity_count\`)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE \`pity_count\` = VALUES(\`pity_count\`)`,
      [accountId, bannerId, currentPity]
    );

    // Insert won items into Dedicated Web Stash and History Log
    for (const rew of rewards) {
      await primaryExecute(
        `INSERT INTO \`solo_gacha_stash\` (\`account_id\`, \`nameid\`, \`item_name\`, \`amount\`, \`refine\`, \`tier\`, \`status\`)
         VALUES (?, ?, ?, ?, ?, ?, 'STASHED')`,
        [accountId, rew.nameId, rew.itemName, rew.amount, rew.refine, rew.tier]
      );

      await primaryExecute(
        `INSERT INTO \`solo_gacha_log\` (\`account_id\`, \`char_id\`, \`banner_id\`, \`nameid\`, \`item_name\`, \`amount\`, \`refine\`, \`tier\`, \`zeny_spent\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [accountId, charId, bannerId, rew.nameId, rew.itemName, rew.amount, rew.refine, rew.tier, Math.round(totalCost / count)]
      );
    }

    return {
      success: true,
      bannerId,
      zenySpent: totalCost,
      remainingZeny: newZeny,
      pityCount: currentPity,
      pityThreshold,
      rewards,
    };
  }

  /**
   * Helper: Weighted Reservoir Picker
   */
  private static weightedPick(items: RawPoolItemRow[]): RawPoolItemRow {
    if (items.length === 0) return items[0];
    const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 10), 0);
    let rand = Math.random() * totalWeight;

    for (const item of items) {
      rand -= (Number(item.weight) || 10);
      if (rand <= 0) return item;
    }
    return items[items.length - 1];
  }

  /**
   * Get Web Gacha Stash items for an account
   */
  static async getStash(accountId: number): Promise<GachaStashItem[]> {
    const rows = await query<any>(
      "SELECT `id`, `account_id`, `nameid`, `item_name`, `amount`, `refine`, `tier`, `status`, `created_at` FROM `solo_gacha_stash` WHERE `account_id` = ? AND `status` = 'STASHED' ORDER BY `id` DESC",
      [accountId]
    );

    return rows.map((r) => ({
      id: Number(r.id),
      accountId: Number(r.account_id),
      nameId: Number(r.nameid),
      itemName: r.item_name,
      amount: Number(r.amount),
      refine: Number(r.refine),
      tier: r.tier,
      status: r.status,
      createdAt: String(r.created_at),
    }));
  }

  /**
   * Claim selected items from Web Stash and send directly to character's RO Mailbox
   */
  static async claimItemsToMail(accountId: number, charId: number, stashIds: number[]): Promise<{ success: boolean; mailedCount: number; error?: string }> {
    if (!stashIds || stashIds.length === 0) {
      return { success: false, mailedCount: 0, error: "No items selected." };
    }

    // 1. Verify character
    const charRow = await primaryQueryOne<{ char_id: number; name: string }>(
      "SELECT char_id, name FROM `char` WHERE `char_id` = ? AND `account_id` = ? LIMIT 1",
      [charId, accountId]
    );

    if (!charRow) {
      return { success: false, mailedCount: 0, error: "Target character not found." };
    }

    // 2. Fetch stashed items
    const placeholders = stashIds.map(() => "?").join(",");
    const items = await primaryQuery<any>(
      `SELECT * FROM \`solo_gacha_stash\` WHERE \`id\` IN (${placeholders}) AND \`account_id\` = ? AND \`status\` = 'STASHED'`,
      [...stashIds, accountId]
    );

    if (items.length === 0) {
      return { success: false, mailedCount: 0, error: "No valid stashed items found." };
    }

    // 3. Dispatch RO Mail in chunks of 5 attachments per parcel
    const CHUNK_SIZE = 5;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      const mailRes = await primaryExecute(
        `INSERT INTO \`mail\` (\`send_name\`, \`send_id\`, \`dest_name\`, \`dest_id\`, \`title\`, \`message\`, \`time\`, \`status\`, \`zeny\`, \`type\`)
         VALUES ('Midgard Gacha Altar', 0, ?, ?, 'Gacha Stash Delivery', 'Congratulations! Your gacha items have been dispatched from the Web Stash.', UNIX_TIMESTAMP(), 0, 0, 0)`,
        [charRow.name, charId]
      );

      const mailId = mailRes.insertId;

      for (let idx = 0; idx < chunk.length; idx++) {
        const item = chunk[idx];
        await primaryExecute(
          `INSERT INTO \`mail_attachments\` (\`id\`, \`index\`, \`nameid\`, \`amount\`, \`refine\`, \`attribute\`, \`identify\`)
           VALUES (?, ?, ?, ?, ?, 0, 1)`,
          [mailId, idx, Number(item.nameid), Number(item.amount), Number(item.refine)]
        );
      }
    }

    // 4. Update Stash status
    await primaryExecute(
      `UPDATE \`solo_gacha_stash\` SET \`status\` = 'MAILED' WHERE \`id\` IN (${placeholders}) AND \`account_id\` = ?`,
      [...stashIds, accountId]
    );

    return { success: true, mailedCount: items.length };
  }

  /**
   * Dismantle selected Stash items for Gacha Shards (SSR: 100, SR: 25, R: 5)
   */
  static async scrapItems(accountId: number, stashIds: number[]): Promise<{ success: boolean; shardsGained: number; totalShards: number; error?: string }> {
    if (!stashIds || stashIds.length === 0) {
      return { success: false, shardsGained: 0, totalShards: 0, error: "No items selected." };
    }

    const placeholders = stashIds.map(() => "?").join(",");
    const items = await primaryQuery<any>(
      `SELECT * FROM \`solo_gacha_stash\` WHERE \`id\` IN (${placeholders}) AND \`account_id\` = ? AND \`status\` = 'STASHED'`,
      [...stashIds, accountId]
    );

    if (items.length === 0) {
      return { success: false, shardsGained: 0, totalShards: 0, error: "No valid items to dismantle." };
    }

    let shardsGained = 0;
    for (const item of items) {
      if (item.tier === "SSR") shardsGained += 100;
      else if (item.tier === "SR") shardsGained += 25;
      else shardsGained += 5;
    }

    // Update #GACHA_SHARDS in acc_reg_num
    await primaryExecute(
      `INSERT INTO \`acc_reg_num\` (\`account_id\`, \`key\`, \`value\`)
       VALUES (?, '#GACHA_SHARDS', ?)
       ON DUPLICATE KEY UPDATE \`value\` = \`value\` + ?`,
      [accountId, shardsGained, shardsGained]
    );

    // Update Stash status
    await primaryExecute(
      `UPDATE \`solo_gacha_stash\` SET \`status\` = 'SCRAPPED' WHERE \`id\` IN (${placeholders}) AND \`account_id\` = ?`,
      [...stashIds, accountId]
    );

    const totalRow = await primaryQueryOne<{ value: number }>(
      "SELECT value FROM `acc_reg_num` WHERE `account_id` = ? AND `key` = '#GACHA_SHARDS' LIMIT 1",
      [accountId]
    );

    return {
      success: true,
      shardsGained,
      totalShards: totalRow ? Number(totalRow.value) : shardsGained,
    };
  }

  /**
   * Get Exclusives-Only Exchange Shop Catalog and player shard balance
   */
  static async getShop(accountId?: number): Promise<{ items: GachaShopItem[]; shardBalance: number }> {
    const rows = await query<any>(
      "SELECT * FROM `solo_gacha_shop` WHERE `enabled` = 1 ORDER BY `sort_order` ASC"
    );

    let shardBalance = 0;
    if (accountId) {
      const regRow = await queryOne<{ value: number }>(
        "SELECT value FROM `acc_reg_num` WHERE `account_id` = ? AND `key` = '#GACHA_SHARDS' LIMIT 1",
        [accountId]
      );
      shardBalance = regRow ? Number(regRow.value) : 0;
    }

    return {
      items: rows.map((r) => ({
        id: Number(r.id),
        nameId: Number(r.nameid),
        itemName: r.item_name,
        amount: Number(r.amount),
        refine: Number(r.refine),
        category: r.category,
        shardPrice: Number(r.shard_price),
        enabled: Boolean(r.enabled),
        sortOrder: Number(r.sort_order),
      })),
      shardBalance,
    };
  }

  /**
   * Purchase an exclusive item using Gacha Shards with direct in-game RO Mail dispatch
   */
  static async purchaseShopItem(accountId: number, charId: number, shopItemId: number): Promise<{ success: boolean; itemName: string; remainingShards: number; error?: string }> {
    // 1. Verify character
    const charRow = await primaryQueryOne<{ char_id: number; name: string }>(
      "SELECT char_id, name FROM `char` WHERE `char_id` = ? AND `account_id` = ? LIMIT 1",
      [charId, accountId]
    );

    if (!charRow) {
      return { success: false, itemName: "", remainingShards: 0, error: "Target character not found." };
    }

    // 2. Fetch Shop Item
    const itemRow = await primaryQueryOne<any>(
      "SELECT * FROM `solo_gacha_shop` WHERE `id` = ? AND `enabled` = 1 LIMIT 1",
      [shopItemId]
    );

    if (!itemRow) {
      return { success: false, itemName: "", remainingShards: 0, error: "Shop item not found or disabled." };
    }

    // 3. Verify Shard Balance
    const regRow = await primaryQueryOne<{ value: number }>(
      "SELECT value FROM `acc_reg_num` WHERE `account_id` = ? AND `key` = '#GACHA_SHARDS' LIMIT 1",
      [accountId]
    );
    const balance = regRow ? Number(regRow.value) : 0;
    const price = Number(itemRow.shard_price);

    if (balance < price) {
      return { success: false, itemName: itemRow.item_name, remainingShards: balance, error: `Insufficient Gacha Shards! Needed: ${price} 💎, Balance: ${balance} 💎.` };
    }

    // 4. Deduct Shards
    const newBalance = balance - price;
    await primaryExecute(
      "UPDATE `acc_reg_num` SET `value` = ? WHERE `account_id` = ? AND `key` = '#GACHA_SHARDS'",
      [newBalance, accountId]
    );

    // 5. Dispatch RO Mail directly
    const mailRes = await primaryExecute(
      `INSERT INTO \`mail\` (\`send_name\`, \`send_id\`, \`dest_name\`, \`dest_id\`, \`title\`, \`message\`, \`time\`, \`status\`, \`zeny\`, \`type\`)
       VALUES ('Gacha Shard Vault', 0, ?, ?, 'Exclusives Shop Exchange', 'Congratulations! Your exchanged item has arrived from the Gacha Shard Vault.', UNIX_TIMESTAMP(), 0, 0, 0)`,
      [charRow.name, charId]
    );

    await primaryExecute(
      `INSERT INTO \`mail_attachments\` (\`id\`, \`index\`, \`nameid\`, \`amount\`, \`refine\`, \`attribute\`, \`identify\`)
       VALUES (?, 0, ?, ?, ?, 0, 1)`,
      [mailRes.insertId, Number(itemRow.nameid), Number(itemRow.amount), Number(itemRow.refine)]
    );

    return {
      success: true,
      itemName: itemRow.item_name,
      remainingShards: newBalance,
    };
  }

  /**
   * Get recent pull history
   */
  static async getHistory(accountId: number, limit = 50): Promise<GachaHistoryLog[]> {
    const rows = await query<any>(
      `SELECT l.*, b.name as banner_name
       FROM \`solo_gacha_log\` l
       LEFT JOIN \`solo_gacha_banners\` b ON b.banner_id = l.banner_id
       WHERE l.account_id = ?
       ORDER BY l.id DESC LIMIT ?`,
      [accountId, limit]
    );

    return rows.map((r) => ({
      id: Number(r.id),
      bannerId: r.banner_id,
      bannerName: r.banner_name || r.banner_id,
      nameId: Number(r.nameid),
      itemName: r.item_name,
      amount: Number(r.amount),
      refine: Number(r.refine),
      tier: r.tier,
      zenySpent: Number(r.zeny_spent),
      createdAt: String(r.created_at),
    }));
  }

  /**
   * Admin API: Update Banner Configuration
   */
  static async adminUpdateBanner(payload: GachaAdminBannerPayload): Promise<boolean> {
    await primaryExecute(
      `UPDATE \`solo_gacha_banners\`
       SET \`name\` = ?, \`description\` = ?, \`icon\` = ?, \`base_price\` = ?, \`ssr_rate\` = ?, \`sr_rate\` = ?, \`r_rate\` = ?, \`pity_threshold\` = ?, \`enabled\` = ?
       WHERE \`banner_id\` = ?`,
      [
        payload.name,
        payload.description,
        payload.icon,
        payload.basePrice,
        payload.ssrRate,
        payload.srRate,
        payload.rRate,
        payload.pityThreshold,
        payload.enabled ? 1 : 0,
        payload.bannerId,
      ]
    );
    return true;
  }

  /**
   * Admin API: Add or Edit Pool Item
   */
  static async adminSavePoolItem(payload: GachaAdminItemPayload): Promise<boolean> {
    if (payload.id && payload.id > 0) {
      await primaryExecute(
        `UPDATE \`solo_gacha_pool\`
         SET \`banner_id\` = ?, \`nameid\` = ?, \`item_name\` = ?, \`amount\` = ?, \`refine\` = ?, \`tier\` = ?, \`weight\` = ?, \`enabled\` = ?
         WHERE \`id\` = ?`,
        [
          payload.bannerId,
          payload.nameId,
          payload.itemName,
          payload.amount,
          payload.refine,
          payload.tier,
          payload.weight,
          payload.enabled ? 1 : 0,
          payload.id,
        ]
      );
    } else {
      await primaryExecute(
        `INSERT INTO \`solo_gacha_pool\` (\`banner_id\`, \`nameid\`, \`item_name\`, \`amount\`, \`refine\`, \`tier\`, \`weight\`, \`enabled\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.bannerId,
          payload.nameId,
          payload.itemName,
          payload.amount,
          payload.refine,
          payload.tier,
          payload.weight,
          payload.enabled ? 1 : 0,
        ]
      );
    }
    return true;
  }

  /**
   * Admin API: Delete Pool Item
   */
  static async adminDeletePoolItem(id: number): Promise<boolean> {
    await primaryExecute("DELETE FROM `solo_gacha_pool` WHERE `id` = ?", [id]);
    return true;
  }

  /**
   * Admin API: Get all Pool Items for management
   */
  static async adminGetAllPoolItems(): Promise<GachaPoolItem[]> {
    const rows = await query<RawPoolItemRow>("SELECT * FROM `solo_gacha_pool` ORDER BY `banner_id`, `tier`, `weight` DESC");
    return rows.map((r) => ({
      id: Number(r.id),
      bannerId: r.banner_id,
      nameId: Number(r.nameid),
      itemName: r.item_name,
      amount: Number(r.amount),
      refine: Number(r.refine),
      tier: r.tier,
      weight: Number(r.weight),
      enabled: Boolean(r.enabled),
    }));
  }
}
