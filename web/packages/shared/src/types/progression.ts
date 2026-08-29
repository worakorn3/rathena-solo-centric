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

export type HuntMilestoneCategory =
  | "MVP"
  | "MINI_BOSS"
  | "NORMAL"
  | "TOTAL"
  | "SPECIFIC_MOB";

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

export interface HuntMilestone {
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
  reward_desc: string;
  tier_label: string;
  is_active: boolean | number;
  sort_order: number;
}

export interface EvaluatedMilestone {
  id: string;
  category: HuntMilestoneCategory;
  prevMilestoneId?: string | null;
  prevMilestoneTitle?: string;
  isLocked: boolean;
  targetMobId: number;
  targetMobName?: string;
  requiredCount: number;
  currentCount: number;
  title: string;
  description: string;
  rewardZeny: number;
  rewardItemId: number;
  rewardItemAmount: number;
  rewardDesc: string;
  tierLabel: string;
  isCompleted: boolean;
  isClaimed: boolean;
  isActive: boolean;
  sortOrder: number;
}


export interface ProgressionSummary {
  totalKills: number;
  mvpKills: number;
  miniBossKills: number;
  normalKills: number;
  killRecords: KillRecord[];
  lootRecords: LootRecord[];
  milestones: EvaluatedMilestone[];
}

