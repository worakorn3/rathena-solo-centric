// Ragnarok Online Job ID Constants and Name Mappings

export const JOB_NAMES: Record<number, string> = {
  // Novice
  0: "Novice",
  1: "Swordsman",
  2: "Mage",
  3: "Archer",
  4: "Acolyte",
  5: "Merchant",
  6: "Thief",
  
  // 2-1 Classes
  7: "Knight",
  8: "Priest",
  9: "Wizard",
  10: "Blacksmith",
  11: "Hunter",
  12: "Assassin",
  
  // 2-2 Classes
  14: "Crusader",
  15: "Monk",
  16: "Sage",
  17: "Rogue",
  18: "Alchemist",
  19: "Bard",
  20: "Dancer",
  
  // Special / Expanded 1st
  23: "Super Novice",
  24: "Gunslinger",
  25: "Ninja",
  4046: "Taekwon",
  4047: "Star Gladiator",
  4049: "Soul Linker",
  
  // High Novice / 1st High
  4001: "High Novice",
  4002: "High Swordsman",
  4003: "High Mage",
  4004: "High Archer",
  4005: "High Acolyte",
  4006: "High Merchant",
  4007: "High Thief",
  
  // Transcendent (2-1)
  4008: "Lord Knight",
  4009: "High Priest",
  4010: "High Wizard",
  4011: "Whitesmith",
  4012: "Sniper",
  4013: "Assassin Cross",
  
  // Transcendent (2-2)
  4015: "Paladin",
  4016: "Champion",
  4017: "Professor",
  4018: "Stalker",
  4019: "Creator",
  4020: "Clown",
  4021: "Gypsy",
  
  // 3rd Classes
  4054: "Rune Knight",
  4055: "Warlock",
  4056: "Ranger",
  4057: "Arch Bishop",
  4058: "Mechanic",
  4059: "Guillotine Cross",
  4060: "Royal Guard",
  4061: "Sorcerer",
  4062: "Minstrel",
  4063: "Wanderer",
  4064: "Sura",
  4065: "Geneticist",
  4066: "Shadow Chaser",
  
  // 3rd Transcendent Classes
  4067: "Rune Knight",
  4068: "Warlock",
  4069: "Ranger",
  4070: "Arch Bishop",
  4071: "Mechanic",
  4072: "Guillotine Cross",
  4073: "Royal Guard",
  4074: "Sorcerer",
  4075: "Minstrel",
  4076: "Wanderer",
  4077: "Sura",
  4078: "Geneticist",
  4079: "Shadow Chaser",

  // Expanded 2nd / 3rd
  4190: "Expanded Super Novice",
  4211: "Kagerou",
  4212: "Oboro",
  4215: "Rebellion",
  4218: "Star Emperor",
  4220: "Soul Reaper",
  4239: "Doram",

  // 4th Classes
  4252: "Dragon Knight",
  4253: "Meister",
  4254: "Shadow Cross",
  4255: "Arch Mage",
  4256: "Cardinal",
  4257: "Windhawk",
  4258: "Imperial Guard",
  4259: "Biolo",
  4260: "Abyss Chaser",
  4261: "Elemental Master",
  4262: "Inquisitor",
  4263: "Troubadour",
  4264: "Trouvere",
  4265: "Sky Emperor",
  4266: "Soul Ascetic",
  4267: "Shinkiro",
  4268: "Shiranui",
  4269: "Night Watch",
  4270: "Hyper Novice",
  4271: "Spirit Handler"
};

export function getJobName(jobId: number): string {
  return JOB_NAMES[jobId] || `Job #${jobId}`;
}

// Equip Slot Bitmask Constants (from rAthena src/common/mmo.hpp)
export const EQP_SLOTS = {
  HEAD_LOW: 1,         // 0x0001
  RIGHT_HAND: 2,       // 0x0002
  GARMENT: 4,          // 0x0004
  ACC_LEFT: 8,         // 0x0008
  ARMOR: 16,           // 0x0010
  LEFT_HAND: 32,       // 0x0020
  SHOES: 64,           // 0x0040
  ACC_RIGHT: 128,      // 0x0080
  HEAD_TOP: 256,       // 0x0100
  HEAD_MID: 512,       // 0x0200
  COSTUME_TOP: 1024,   // 0x0400
  COSTUME_MID: 2048,   // 0x0800
  COSTUME_LOW: 4096,   // 0x1000
  COSTUME_GARMENT: 8192,// 0x2000
  SHADOW_ARMOR: 16384, // 0x4000
  SHADOW_WEAPON: 32768,// 0x8000
  SHADOW_SHIELD: 65536,// 0x10000
  SHADOW_SHOES: 131072,// 0x20000
  SHADOW_ACC_R: 262144,// 0x40000
  SHADOW_ACC_L: 524288 // 0x80000
} as const;

export type EquipSlotName =
  | "head_top"
  | "head_mid"
  | "head_low"
  | "armor"
  | "right_hand"
  | "left_hand"
  | "garment"
  | "shoes"
  | "acc_left"
  | "acc_right"
  | "costume_top"
  | "costume_mid"
  | "costume_low"
  | "costume_garment"
  | "shadow_armor"
  | "shadow_weapon"
  | "shadow_shield"
  | "shadow_shoes"
  | "shadow_acc_r"
  | "shadow_acc_l";
