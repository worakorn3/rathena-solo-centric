import { query, primaryQuery, primaryQueryOne, primaryExecute } from "../db/pool";
import {
  KillRecord,
  LootRecord,
  ProgressionSummary,
  EvaluatedMilestone,
  HuntMilestone,
  HuntMilestoneCategory,
  ItemNames,
  MobNames,
  MobTypes,
} from "@rathena/shared";

interface PersistenceRow {
  target_id: number;
  value: number;
  tstamp: string;
}

interface MilestoneDbRow {
  id: string;
  category: HuntMilestoneCategory;
  prev_milestone_id?: string | null;
  target_mob_id: number;
  required_count: number;
  title: string;
  description: string;
  reward_zeny: number;
  reward_item_id: number;
  reward_item_amount: number;
  reward_stock_ticker?: string | null;
  reward_stock_shares?: number;
  reward_desc: string;
  tier_label: string;
  is_active: number | boolean;
  sort_order: number;
}

interface ClaimRow {
  milestone_id: string;
}

export class TrackingService {
  /**
   * Retrieves player progression summary including dynamically evaluated hunt milestones
   */
  static async getProgressionSummary(accountId: number): Promise<ProgressionSummary> {
    let killRows: PersistenceRow[] = [];
    let lootRows: PersistenceRow[] = [];
    let milestoneRows: MilestoneDbRow[] = [];
    let claimRows: ClaimRow[] = [];

    // 1. Fetch kills from solo_persistence_log
    try {
      killRows = await query<PersistenceRow>(
        "SELECT target_id, value, tstamp FROM `solo_persistence_log` WHERE account_id = ? AND category = 'KILL' ORDER BY value DESC",
        [accountId]
      );
    } catch {
      killRows = [];
    }

    // 2. Fetch recent loots from solo_persistence_log
    try {
      lootRows = await query<PersistenceRow>(
        "SELECT target_id, value, tstamp FROM `solo_persistence_log` WHERE account_id = ? AND category = 'LOOT' ORDER BY tstamp DESC LIMIT 50",
        [accountId]
      );
    } catch {
      lootRows = [];
    }

    // 3. Fetch active milestones from solo_milestones
    try {
      milestoneRows = await query<MilestoneDbRow>(
        "SELECT * FROM `solo_milestones` WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
      );
    } catch {
      milestoneRows = [];
    }

    // 4. Fetch claimed milestones for this account
    try {
      claimRows = await query<ClaimRow>(
        "SELECT milestone_id FROM `solo_milestone_claims` WHERE account_id = ?",
        [accountId]
      );
    } catch {
      claimRows = [];
    }

    const claimedSet = new Set(claimRows.map((c) => c.milestone_id));
    const killMap = new Map<number, number>();

    let totalKills = 0;
    let mvpKills = 0;
    let miniBossKills = 0;
    let normalKills = 0;

    const killRecords: KillRecord[] = killRows.map((r) => {
      const mobId = Number(r.target_id);
      const count = Number(r.value) || 0;
      killMap.set(mobId, count);
      totalKills += count;

      const category = MobTypes[mobId] || "NORMAL";
      if (category === "MVP") {
        mvpKills += count;
      } else if (category === "MINI_BOSS") {
        miniBossKills += count;
      } else {
        normalKills += count;
      }

      return {
        mobId,
        mobName: MobNames[mobId] || `Monster #${mobId}`,
        count,
        category,
        lastKilled: r.tstamp ? new Date(r.tstamp).toLocaleString() : undefined,
      };
    });

    const lootRecords: LootRecord[] = lootRows.map((r) => ({
      itemId: Number(r.target_id),
      itemName: ItemNames[Number(r.target_id)] || `Item #${r.target_id}`,
      count: Number(r.value) || 0,
      lastLooted: r.tstamp ? new Date(r.tstamp).toLocaleString() : undefined,
    }));

    // ponytail: map milestone id to title for fast prerequisite label resolution
    const milestoneTitleMap = new Map(milestoneRows.map((r) => [r.id, r.title]));

    // 5. Evaluate milestones dynamically against kill counts
    const evaluatedMilestones: EvaluatedMilestone[] = milestoneRows.map((m) => {
      let currentCount = 0;
      const targetMobId = Number(m.target_mob_id) || 0;

      if (m.category === "MVP") {
        currentCount = mvpKills;
      } else if (m.category === "MINI_BOSS") {
        currentCount = miniBossKills;
      } else if (m.category === "NORMAL") {
        currentCount = normalKills;
      } else if (m.category === "TOTAL") {
        currentCount = totalKills;
      } else if (m.category === "SPECIFIC_MOB") {
        currentCount = killMap.get(targetMobId) || 0;
      }

      const reqCount = Number(m.required_count) || 1;
      const isClaimed = claimedSet.has(m.id);
      // ponytail: locked if prerequisite exists and is not yet claimed
      const isLocked = Boolean(m.prev_milestone_id && !claimedSet.has(m.prev_milestone_id));
      const prevMilestoneTitle = m.prev_milestone_id
        ? milestoneTitleMap.get(m.prev_milestone_id) || m.prev_milestone_id
        : undefined;
      const isCompleted = !isLocked && currentCount >= reqCount;

      return {
        id: m.id,
        category: m.category,
        prevMilestoneId: m.prev_milestone_id || null,
        prevMilestoneTitle,
        isLocked,
        targetMobId,
        targetMobName: targetMobId > 0 ? MobNames[targetMobId] || `Mob #${targetMobId}` : undefined,
        requiredCount: reqCount,
        currentCount,
        title: m.title,
        description: m.description,
        rewardZeny: Number(m.reward_zeny) || 0,
        rewardItemId: Number(m.reward_item_id) || 0,
        rewardItemAmount: Number(m.reward_item_amount) || 0,
        rewardStockTicker: m.reward_stock_ticker || null,
        rewardStockShares: Number(m.reward_stock_shares) || 0,
        rewardDesc: m.reward_desc || "",
        tierLabel: m.tier_label || "Global / Boss",
        isCompleted,
        isClaimed,
        isActive: Boolean(m.is_active),
        sortOrder: Number(m.sort_order) || 0,
      };
    });

    return {
      totalKills,
      mvpKills,
      miniBossKills,
      normalKills,
      killRecords,
      lootRecords,
      milestones: evaluatedMilestones,
    };
  }

  /**
   * Claim a completed hunt milestone and dispatch rewards directly to character's RODEX (RO Mail) & Portfolio
   */
  static async claimMilestoneToRodex(
    accountId: number,
    charId: number,
    milestoneId: string
  ): Promise<{ success: boolean; rewardDesc?: string; recipientChar?: string; error?: string }> {
    // 1. Verify character belongs to account
    const charRow = await primaryQueryOne<{ char_id: number; name: string }>(
      "SELECT `char_id`, `name` FROM `char` WHERE `char_id` = ? AND `account_id` = ? LIMIT 1",
      [charId, accountId]
    );

    if (!charRow) {
      return { success: false, error: "Target character not found or does not belong to your account." };
    }

    // 2. Fetch milestone definition
    const milestone = await primaryQueryOne<MilestoneDbRow>(
      "SELECT * FROM `solo_milestones` WHERE `id` = ? AND `is_active` = 1 LIMIT 1",
      [milestoneId]
    );

    if (!milestone) {
      return { success: false, error: "Hunt milestone not found or is currently inactive." };
    }

    // ponytail: check prerequisite milestone requirement
    if (milestone.prev_milestone_id) {
      const prevClaim = await primaryQueryOne<ClaimRow>(
        "SELECT `milestone_id` FROM `solo_milestone_claims` WHERE `account_id` = ? AND `milestone_id` = ? LIMIT 1",
        [accountId, milestone.prev_milestone_id]
      );
      if (!prevClaim) {
        return { success: false, error: "Prerequisite milestone has not been claimed yet." };
      }
    }

    // 3. Check if already claimed
    const existingClaim = await primaryQueryOne<ClaimRow>(
      "SELECT `milestone_id` FROM `solo_milestone_claims` WHERE `account_id` = ? AND `milestone_id` = ? LIMIT 1",
      [accountId, milestoneId]
    );

    if (existingClaim) {
      return { success: false, error: "This milestone reward has already been claimed." };
    }

    // 4. Verify progress requirement
    let killRows: PersistenceRow[] = [];
    try {
      killRows = await primaryQuery<PersistenceRow>(
        "SELECT target_id, value FROM `solo_persistence_log` WHERE account_id = ? AND category = 'KILL'",
        [accountId]
      );
    } catch {
      killRows = [];
    }

    let currentCount = 0;
    const targetMobId = Number(milestone.target_mob_id) || 0;

    if (milestone.category === "TOTAL") {
      currentCount = killRows.reduce((acc, r) => acc + (Number(r.value) || 0), 0);
    } else if (milestone.category === "MVP") {
      currentCount = killRows
        .filter((r) => MobTypes[Number(r.target_id)] === "MVP")
        .reduce((acc, r) => acc + (Number(r.value) || 0), 0);
    } else if (milestone.category === "MINI_BOSS") {
      currentCount = killRows
        .filter((r) => MobTypes[Number(r.target_id)] === "MINI_BOSS")
        .reduce((acc, r) => acc + (Number(r.value) || 0), 0);
    } else if (milestone.category === "NORMAL") {
      currentCount = killRows
        .filter((r) => !MobTypes[Number(r.target_id)] || MobTypes[Number(r.target_id)] === "NORMAL")
        .reduce((acc, r) => acc + (Number(r.value) || 0), 0);
    } else if (milestone.category === "SPECIFIC_MOB") {
      const match = killRows.find((r) => Number(r.target_id) === targetMobId);
      currentCount = match ? Number(match.value) || 0 : 0;
    }

    const reqCount = Number(milestone.required_count) || 1;
    if (currentCount < reqCount) {
      return {
        success: false,
        error: `Requirements not met. Current progress: ${currentCount}/${reqCount} kills.`,
      };
    }

    // 5. Record claim in solo_milestone_claims
    await primaryExecute(
      "INSERT INTO `solo_milestone_claims` (`account_id`, `milestone_id`, `char_id`) VALUES (?, ?, ?)",
      [accountId, milestoneId, charId]
    );

    // 6. Dispatch Stock / ETF Endowment Rewards directly to Account Portfolio
    const stockTickerReward = milestone.reward_stock_ticker ? String(milestone.reward_stock_ticker).trim().toUpperCase() : null;
    const stockSharesReward = Number(milestone.reward_stock_shares) || 0;

    if (stockTickerReward && stockSharesReward > 0) {
      await primaryExecute(
        "INSERT INTO `solo_stock_player` (account_id, ticker, shares, total_cost) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE shares = shares + VALUES(shares)",
        [accountId, stockTickerReward, stockSharesReward]
      );
      await primaryExecute(
        "INSERT INTO `solo_stock_transactions` (account_id, char_id, ticker, action, shares, price, total_amount, fee, destination) VALUES (?, ?, ?, 'DIVIDEND', ?, 0, 0, 0, 'WALLET')",
        [accountId, charId, stockTickerReward, stockSharesReward]
      );
    }

    // 7. Dispatch in-game RODEX mail parcel to recipient character
    const zenyReward = Number(milestone.reward_zeny) || 0;
    const itemIdReward = Number(milestone.reward_item_id) || 0;
    const itemAmountReward = Number(milestone.reward_item_amount) || 0;

    const mailTitle = `Bounty: ${milestone.title}`.substring(0, 40);
    const mailMsg = `Congratulations! You have completed the hunt bounty for [${milestone.title}]. Reward: ${milestone.reward_desc}`.substring(0, 255);

    const mailInsertRes: any = await primaryExecute(
      `INSERT INTO \`mail\` 
       (\`send_name\`, \`send_id\`, \`dest_name\`, \`dest_id\`, \`title\`, \`message\`, \`time\`, \`status\`, \`zeny\`, \`type\`)
       VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), 0, ?, 0)`,
      ["Eden Hunt Guild", 0, charRow.name, charRow.char_id, mailTitle, mailMsg, zenyReward]
    );

    const mailId = mailInsertRes?.insertId;

    if (mailId && itemIdReward > 0 && itemAmountReward > 0) {
      await primaryExecute(
        `INSERT INTO \`mail_attachments\` 
         (\`id\`, \`index\`, \`nameid\`, \`amount\`, \`refine\`, \`attribute\`, \`identify\`)
         VALUES (?, 0, ?, ?, 0, 0, 1)`,
        [mailId, itemIdReward, itemAmountReward]
      );
    }

    return {
      success: true,
      rewardDesc: milestone.reward_desc,
      recipientChar: charRow.name,
    };
  }

  /**
   * Admin: Get all hunt milestones (both active and inactive)
   */
  static async getAllMilestonesAdmin(): Promise<HuntMilestone[]> {
    const rows = await primaryQuery<MilestoneDbRow>(
      "SELECT * FROM `solo_milestones` ORDER BY `sort_order` ASC, `id` ASC"
    );
    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      prev_milestone_id: r.prev_milestone_id || null,
      target_mob_id: Number(r.target_mob_id) || 0,
      required_count: Number(r.required_count) || 100,
      title: r.title,
      description: r.description || "",
      reward_zeny: Number(r.reward_zeny) || 0,
      reward_item_id: Number(r.reward_item_id) || 0,
      reward_item_amount: Number(r.reward_item_amount) || 0,
      reward_stock_ticker: r.reward_stock_ticker || null,
      reward_stock_shares: Number(r.reward_stock_shares) || 0,
      reward_desc: r.reward_desc || "",
      tier_label: r.tier_label || "Global / Boss",
      is_active: Boolean(r.is_active),
      sort_order: Number(r.sort_order) || 0,
    }));
  }

  /**
   * Admin: Create or update a hunt milestone
   */
  static async saveMilestoneAdmin(data: Partial<HuntMilestone>): Promise<void> {
    const milestoneId = data.id && data.id.trim() ? data.id.trim() : `m_${Date.now()}`;
    if (!data.title || !data.title.trim()) {
      throw new Error("Milestone Title is required.");
    }

    let sortOrder = Number(data.sort_order);
    if (isNaN(sortOrder) || sortOrder <= 0) {
      try {
        const maxRow = await primaryQueryOne<{ max_order: number }>(
          "SELECT COALESCE(MAX(`sort_order`), 0) AS max_order FROM `solo_milestones`"
        );
        sortOrder = (maxRow?.max_order || 0) + 1;
      } catch {
        sortOrder = 1;
      }
    }

    await primaryExecute(
      `INSERT INTO \`solo_milestones\` 
       (\`id\`, \`category\`, \`prev_milestone_id\`, \`target_mob_id\`, \`required_count\`, \`title\`, \`description\`, \`reward_zeny\`, \`reward_item_id\`, \`reward_item_amount\`, \`reward_stock_ticker\`, \`reward_stock_shares\`, \`reward_desc\`, \`tier_label\`, \`is_active\`, \`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       \`category\` = VALUES(\`category\`),
       \`prev_milestone_id\` = VALUES(\`prev_milestone_id\`),
       \`target_mob_id\` = VALUES(\`target_mob_id\`),
       \`required_count\` = VALUES(\`required_count\`),
       \`title\` = VALUES(\`title\`),
       \`description\` = VALUES(\`description\`),
       \`reward_zeny\` = VALUES(\`reward_zeny\`),
       \`reward_item_id\` = VALUES(\`reward_item_id\`),
       \`reward_item_amount\` = VALUES(\`reward_item_amount\`),
       \`reward_stock_ticker\` = VALUES(\`reward_stock_ticker\`),
       \`reward_stock_shares\` = VALUES(\`reward_stock_shares\`),
       \`reward_desc\` = VALUES(\`reward_desc\`),
       \`tier_label\` = VALUES(\`tier_label\`),
       \`is_active\` = VALUES(\`is_active\`),
       \`sort_order\` = VALUES(\`sort_order\`)`,
      [
        milestoneId,
        data.category || "SPECIFIC_MOB",
        data.prev_milestone_id && String(data.prev_milestone_id).trim() ? String(data.prev_milestone_id).trim() : null,
        Number(data.target_mob_id) || 0,
        Number(data.required_count) || 100,
        data.title.trim(),
        data.description || "",
        Number(data.reward_zeny) || 0,
        Number(data.reward_item_id) || 0,
        Number(data.reward_item_amount) || 0,
        data.reward_stock_ticker && String(data.reward_stock_ticker).trim() ? String(data.reward_stock_ticker).trim().toUpperCase() : null,
        Number(data.reward_stock_shares) || 0,
        data.reward_desc || "",
        data.tier_label || "Global / Boss",
        data.is_active ? 1 : 0,
        sortOrder,
      ]
    );
  }

  /**
   * Admin: Batch reorder milestones
   */
  static async reorderMilestonesAdmin(orderedIds: string[]): Promise<void> {
    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) return;
    for (let i = 0; i < orderedIds.length; i++) {
      await primaryExecute(
        "UPDATE `solo_milestones` SET `sort_order` = ? WHERE `id` = ?",
        [i + 1, orderedIds[i]]
      );
    }
  }

  /**
   * Admin: Delete a hunt milestone
   */
  static async deleteMilestoneAdmin(id: string): Promise<void> {
    await primaryExecute("DELETE FROM `solo_milestones` WHERE `id` = ?", [id]);
  }
}
