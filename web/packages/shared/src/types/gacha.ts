export type GachaTier = "SSR" | "SR" | "R";

export interface GachaPoolItem {
  id: number;
  bannerId: string;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  weight: number;
  enabled: boolean;
}

export interface GachaRosterItem {
  id: number;
  bannerId: string;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  weight: number;
  isSpotlight: boolean;
  dropRatePct: number;
}

export interface GachaBanner {
  bannerId: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  effectivePrice: number;
  discountPct: number;
  ssrRate: number;
  srRate: number;
  rRate: number;
  pityThreshold: number;
  currentPity: number;
  enabled: boolean;
  sortOrder: number;
  featuredSsr?: GachaPoolItem | null;
  featuredSrs?: GachaPoolItem[];
  roster?: GachaRosterItem[];
  nextRotationInSeconds?: number;
}

export interface GachaPullRequest {
  bannerId: string;
  count: 1 | 10;
  charId: number;
}

export interface GachaRewardItem {
  id: number;
  stashId?: number;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  isSpotlight?: boolean;
}

export interface GachaPullResult {
  success: boolean;
  bannerId: string;
  zenySpent: number;
  remainingZeny: number;
  pityCount: number;
  pityThreshold: number;
  rewards: GachaRewardItem[];
  error?: string;
}

export interface GachaStashItem {
  id: number;
  accountId: number;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  status: "STASHED" | "MAILED" | "SCRAPPED";
  createdAt: string;
}

export interface GachaShopItem {
  id: number;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  category: string;
  shardPrice: number;
  enabled: boolean;
  sortOrder: number;
}

export interface GachaHistoryLog {
  id: number;
  bannerId: string;
  bannerName?: string;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  zenySpent: number;
  createdAt: string;
}

export interface GachaAdminItemPayload {
  id?: number;
  bannerId: string;
  nameId: number;
  itemName: string;
  amount: number;
  refine: number;
  tier: GachaTier;
  weight: number;
  enabled: boolean;
}

export interface GachaAdminBannerPayload {
  bannerId: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  ssrRate: number;
  srRate: number;
  rRate: number;
  pityThreshold: number;
  enabled: boolean;
}
