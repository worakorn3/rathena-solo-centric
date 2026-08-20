import { query } from "../db/pool";
import { KillRecord, LootRecord, ProgressionSummary, ItemNames, MobNames } from "@rathena/shared";

// Standard Ragnarok MvP & Mini-Boss ID Sets
const MVP_MOB_IDS = new Set([
  1038, 1039, 1046, 1059, 1086, 1087, 1112, 1115, 1147, 1150, 1157, 1159,
  1190, 1251, 1252, 1272, 1312, 1373, 1389, 1418, 1492, 1511, 1583, 1623,
  1630, 1646, 1647, 1648, 1649, 1650, 1651, 1658, 1685, 1688, 1708, 1719,
  1734, 1751, 1768, 1779, 1785, 1832, 1871, 1874, 1885, 1917, 1980, 2022
]);

const MINI_BOSS_IDS = new Set([
  1096, 1120, 1158, 1262, 1289, 1307, 1404, 1494, 1518, 1582, 1681, 1731
]);



interface PersistenceRow {
  target_id: number;
  value: number;
  tstamp: string;
}

export class TrackingService {
  static async getProgressionSummary(accountId: number): Promise<ProgressionSummary> {
    let killRows: PersistenceRow[] = [];
    let lootRows: PersistenceRow[] = [];

    try {
      killRows = await query<PersistenceRow>(
        "SELECT target_id, value, tstamp FROM `solo_persistence_log` WHERE account_id = ? AND category = 'KILL' ORDER BY value DESC",
        [accountId]
      );
    } catch {
      killRows = [];
    }

    try {
      lootRows = await query<PersistenceRow>(
        "SELECT target_id, value, tstamp FROM `solo_persistence_log` WHERE account_id = ? AND category = 'LOOT' ORDER BY tstamp DESC LIMIT 50",
        [accountId]
      );
    } catch {
      lootRows = [];
    }

    let totalKills = 0;
    let mvpKills = 0;
    let miniBossKills = 0;
    let normalKills = 0;

    const killRecords: KillRecord[] = killRows.map((r) => {
      const mobId = Number(r.target_id);
      const count = Number(r.value) || 0;
      totalKills += count;

      let category: "NORMAL" | "MINI_BOSS" | "MVP" = "NORMAL";
      if (MVP_MOB_IDS.has(mobId)) {
        category = "MVP";
        mvpKills += count;
      } else if (MINI_BOSS_IDS.has(mobId)) {
        category = "MINI_BOSS";
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

    return {
      totalKills,
      mvpKills,
      miniBossKills,
      normalKills,
      killRecords,
      lootRecords,
    };
  }
}
