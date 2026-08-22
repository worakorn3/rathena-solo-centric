import { EquipSlotName } from "../constants/jobs";

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
  lastLogoutTime?: number;
  unclaimedRestMin?: number;
}

export interface CharacterItem {
  id: number;
  charId: number;
  nameId: number;
  amount: number;
  equip: number;
  identify: number;
  refine: number;
  attribute: number;
  card0: number;
  card1: number;
  card2: number;
  card3: number;
  slotName?: EquipSlotName;
  customName?: string;
  iconUrl?: string;
}

export interface PaperdollData {
  headTop?: CharacterItem;
  headMid?: CharacterItem;
  headLow?: CharacterItem;
  armor?: CharacterItem;
  rightHand?: CharacterItem;
  leftHand?: CharacterItem;
  garment?: CharacterItem;
  shoes?: CharacterItem;
  accLeft?: CharacterItem;
  accRight?: CharacterItem;
  costumeTop?: CharacterItem;
  costumeMid?: CharacterItem;
  costumeLow?: CharacterItem;
  costumeGarment?: CharacterItem;
  shadowArmor?: CharacterItem;
  shadowWeapon?: CharacterItem;
  shadowShield?: CharacterItem;
  shadowShoes?: CharacterItem;
  shadowAccR?: CharacterItem;
  shadowAccL?: CharacterItem;
}

export interface CharacterDetail extends CharacterSummary {
  paperdoll: PaperdollData;
  equippedItems: CharacterItem[];
}
