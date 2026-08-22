/**
 * E2E Test Suite Helpers & Reference Oracle
 * Derived from PROJECT.md and ORIGINAL_REQUEST.md interface contracts & game mechanics
 */

export interface CharacterSummary {
  charId: number;
  accountId: number;
  charNum: number;
  name: string;
  classId: number;
  className: string;
  baseLevel: number;
  jobLevel: number;
  baseExp: number;
  jobExp: number;
  zeny: number;
  maxHp: number;
  hp: number;
  maxSp: number;
  sp: number;
  maxAp?: number;
  ap?: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
  pow?: number;
  sta?: number;
  wis?: number;
  spl?: number;
  con?: number;
  crt?: number;
  statusPoint: number;
  skillPoint: number;
  traitPoint?: number;
  lastMap: string;
  lastX: number;
  lastY: number;
  online: boolean;
  sex: "M" | "F";
  dispatchStart: number | null;
  unclaimedRestMin?: number;
}

export interface CharacterDetail extends CharacterSummary {
  paperdoll?: Record<string, any>;
  equippedItems?: any[];
}

export interface DispatchYieldSummary {
  effectiveSeconds: number;
  baseExpYield: number;
  jobExpYield: number;
  zenyYield: number;
  progressPercent: number;
  formattedElapsed: string;
  formattedCap: string;
  isCapped: boolean;
}

export type DispatchState = "ONLINE_DISABLED" | "AVAILABLE" | "ACTIVE";

export const MAX_DISPATCH_SECONDS = 172800; // 48 Hours in seconds

/**
 * Authoritative Yield Calculation Engine (48h Ceiling, Base & Job EXP only, Zero Zeny):
 * - effectiveSeconds = Math.min(Math.max(0, currentTimestamp - dispatchStart), 172800)
 * - baseExpYield = Math.floor((base_level * 15000 * effectiveSeconds) / 3600)
 * - jobExpYield = Math.floor((job_level * 10000 * effectiveSeconds) / 3600)
 * - zenyYield = 0 (Zero Zeny)
 */
export function calculateDispatchYield(
  baseLevel: number,
  jobLevel: number,
  dispatchStart: number | null,
  currentTimestamp: number
): DispatchYieldSummary {
  if (!dispatchStart || dispatchStart <= 0) {
    return {
      effectiveSeconds: 0,
      baseExpYield: 0,
      jobExpYield: 0,
      zenyYield: 0,
      progressPercent: 0,
      formattedElapsed: "00:00:00",
      formattedCap: "00:00 / 48h Cap",
      isCapped: false,
    };
  }

  const rawElapsed = Math.max(0, currentTimestamp - dispatchStart);
  const effectiveSeconds = Math.min(rawElapsed, MAX_DISPATCH_SECONDS);
  const isCapped = rawElapsed >= MAX_DISPATCH_SECONDS;

  const baseExpYield = Math.floor((baseLevel * 15000 * effectiveSeconds) / 3600);
  const jobExpYield = Math.floor((jobLevel * 10000 * effectiveSeconds) / 3600);
  const zenyYield = 0; // Zero Zeny Clean Rewards

  const progressPercent = Math.min(100, (effectiveSeconds / MAX_DISPATCH_SECONDS) * 100);

  // Format Elapsed Time HH:MM:SS
  const hrs = Math.floor(rawElapsed / 3600);
  const mins = Math.floor((rawElapsed % 3600) / 60);
  const secs = rawElapsed % 60;
  const formattedElapsed = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Format Cap Time HH:MM / 48h Cap
  const effHrs = Math.floor(effectiveSeconds / 3600);
  const effMins = Math.floor((effectiveSeconds % 3600) / 60);
  const formattedCap = `${String(effHrs).padStart(2, "0")}:${String(effMins).padStart(2, "0")} / 48h Cap`;

  return {
    effectiveSeconds,
    baseExpYield,
    jobExpYield,
    zenyYield,
    progressPercent,
    formattedElapsed,
    formattedCap,
    isCapped,
  };
}

/**
 * Hourly Rate Preview Formula
 */
export function calculateHourlyRatePreview(baseLevel: number, jobLevel: number) {
  return {
    baseExpPerHour: baseLevel * 15000,
    jobExpPerHour: jobLevel * 10000,
    zenyPerHour: baseLevel * 2500,
    rateBadge: `Lv.${baseLevel} Rate`,
  };
}

/**
 * 3-State Interactive Machine Determination
 */
export function determineDispatchState(char: {
  online: boolean | number;
  dispatchStart?: number | null;
}): DispatchState {
  const isOnline = Boolean(char.online);
  if (isOnline) {
    return "ONLINE_DISABLED";
  }
  if (char.dispatchStart && Number(char.dispatchStart) > 0) {
    return "ACTIVE";
  }
  return "AVAILABLE";
}

/**
 * Comprehensive Unicode Emoji Detection Pattern
 * Detects generic emojis, symbols, pictographs, flags, etc.
 */
export const UNICODE_EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F\u200D]/u;

export function containsUnicodeEmoji(text: string): boolean {
  return UNICODE_EMOJI_REGEX.test(text);
}

/**
 * Mock Character Factory
 */
export function createMockCharacter(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    charId: 150001,
    accountId: 2000001,
    charNum: 0,
    name: "SoloKnight",
    classId: 7, // Knight
    className: "Knight",
    baseLevel: 85,
    jobLevel: 50,
    baseExp: 15000000,
    jobExp: 8000000,
    zeny: 2500000,
    maxHp: 12500,
    hp: 12500,
    maxSp: 620,
    sp: 620,
    str: 82,
    agi: 70,
    vit: 60,
    int: 20,
    dex: 45,
    luk: 15,
    statusPoint: 12,
    skillPoint: 4,
    lastMap: "prontera",
    lastX: 150,
    lastY: 150,
    online: false,
    sex: "M",
    dispatchStart: null,
    ...overrides,
  };
}

export function createMockCharacterDetail(overrides: Partial<CharacterDetail> = {}): CharacterDetail {
  const summary = createMockCharacter(overrides);
  return {
    ...summary,
    paperdoll: {},
    equippedItems: [],
    ...overrides,
  };
}
