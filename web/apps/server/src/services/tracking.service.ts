import { query } from "../db/pool";
import { KillRecord, LootRecord, ProgressionSummary } from "@rathena/shared";

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

const KNOWN_MOBS: Record<number, string> = {
  1002: "Poring",
  1007: "Fabre",
  1008: "Pupa",
  1010: "Condor",
  1011: "Willow",
  1012: "Rocker",
  1013: "Spore",
  1014: "Zombie",
  1015: "Thief Bug",
  1019: "Poporing",
  1023: "Mandragora",
  1026: "Flora",
  1031: "Smokie",
  1038: "Osiris",
  1039: "Baphomet",
  1046: "Doppelganger",
  1049: "Whisper",
  1059: "Mistress",
  1063: "Lunatic",
  1086: "Golden Thief Bug",
  1087: "Orc Hero",
  1112: "Drake",
  1115: "Eddga",
  1147: "Maya",
  1150: "Moonlight Flower",
  1157: "Pharaoh",
  1159: "Phreeoni",
  1190: "Orc Lord",
  1251: "Knight of Windstorm",
  1252: "Garm",
  1272: "Dark Lord",
  1312: "Turtle General",
  1373: "Lord of Death",
  1389: "Dracula",
  1418: "Evil Snake Lord",
  1492: "Incantation Samurai",
  1511: "Amon Ra",
  1623: "RSX-0806",
  1630: "Bacsojin",
  1685: "Valkyrie",
  1719: "Gloom Under Night",
  1768: "Valkyrie Randgris",
  1779: "Ktullanux",
  1785: "Atroce",
  1874: "Beelzebub",
  1885: "Fallen Bishop",
  1917: "Ifrit"
};

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
        mobName: KNOWN_MOBS[mobId] || `Monster #${mobId}`,
        count,
        category,
        lastKilled: r.tstamp ? new Date(r.tstamp).toLocaleString() : undefined,
      };
    });

    const lootRecords: LootRecord[] = lootRows.map((r) => ({
      itemId: Number(r.target_id),
      itemName: `Item #${r.target_id}`,
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
