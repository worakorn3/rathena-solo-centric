import { query } from "../db/pool";
import { KillRecord, LootRecord, ProgressionSummary, ItemNames, MobNames, MobTypes } from "@rathena/shared";

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

