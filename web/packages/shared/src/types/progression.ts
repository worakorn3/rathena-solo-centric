export type TrackingCategory =
  | "KILL"
  | "LOOT"
  | "ECONOMY"
  | "ACHIEVEMENT"
  | "COLLECTION"
  | "REPUTATION"
  | "INSTANCE"
  | "MASTERY"
  | "DISCOVERY";

export interface KillRecord {
  mobId: number;
  mobName: string;
  count: number;
  category: "NORMAL" | "MINI_BOSS" | "MVP";
  lastKilled?: string;
}

export interface LootRecord {
  itemId: number;
  itemName: string;
  count: number;
  lastLooted?: string;
}

export interface ProgressionSummary {
  totalKills: number;
  mvpKills: number;
  miniBossKills: number;
  normalKills: number;
  killRecords: KillRecord[];
  lootRecords: LootRecord[];
}
