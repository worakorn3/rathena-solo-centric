import { query, queryOne } from "../db/pool";
import {
  CharacterDetail,
  CharacterItem,
  CharacterSummary,
  EQP_SLOTS,
  PaperdollData,
  getJobName
} from "@rathena/shared";

interface RawCharRow {
  char_id: number;
  account_id: number;
  char_num: number;
  name: string;
  class: number;
  base_level: number;
  job_level: number;
  base_exp: number;
  job_exp: number;
  zeny: number;
  max_hp: number;
  hp: number;
  max_sp: number;
  sp: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
  status_point: number;
  skill_point: number;
  last_map: string;
  last_x: number;
  last_y: number;
  online: number;
  sex: "M" | "F";
}

interface RawInventoryRow {
  id: number;
  char_id: number;
  nameid: number;
  amount: number;
  equip: number;
  identify: number;
  refine: number;
  attribute: number;
  card0: number;
  card1: number;
  card2: number;
  card3: number;
}

function mapCharRowToSummary(row: RawCharRow): CharacterSummary {
  return {
    charId: row.char_id,
    accountId: row.account_id,
    charNum: row.char_num,
    name: row.name,
    classId: row.class,
    className: getJobName(row.class),
    baseLevel: row.base_level,
    jobLevel: row.job_level,
    baseExp: Number(row.base_exp) || 0,
    jobExp: Number(row.job_exp) || 0,
    zeny: Number(row.zeny) || 0,
    maxHp: row.max_hp,
    hp: row.hp,
    maxSp: row.max_sp,
    sp: row.sp,
    str: row.str,
    agi: row.agi,
    vit: row.vit,
    int: row.int,
    dex: row.dex,
    luk: row.luk,
    statusPoint: row.status_point,
    skillPoint: row.skill_point,
    lastMap: row.last_map,
    lastX: row.last_x,
    lastY: row.last_y,
    online: Boolean(row.online),
    sex: row.sex || "M",
  };
}

const CHAR_COLUMNS = `
  \`char_id\`, \`account_id\`, \`char_num\`, \`name\`, \`class\`, \`base_level\`, \`job_level\`,
  \`base_exp\`, \`job_exp\`, \`zeny\`, \`max_hp\`, \`hp\`, \`max_sp\`, \`sp\`, \`str\`, \`agi\`, \`vit\`,
  \`int\`, \`dex\`, \`luk\`, \`status_point\`, \`skill_point\`, \`last_map\`, \`last_x\`, \`last_y\`, \`online\`, \`sex\`
`;

export class CharacterService {
  static async getCharactersByAccount(accountId: number): Promise<CharacterSummary[]> {
    const rows = await query<RawCharRow>(
      `SELECT ${CHAR_COLUMNS} FROM \`char\` WHERE \`account_id\` = ? ORDER BY \`char_num\` ASC`,
      [accountId]
    );

    return rows.map(mapCharRowToSummary);
  }

  static async getCharacterDetail(charId: number): Promise<CharacterDetail | null> {
    const charRow = await queryOne<RawCharRow>(
      `SELECT ${CHAR_COLUMNS} FROM \`char\` WHERE \`char_id\` = ? LIMIT 1`,
      [charId]
    );

    if (!charRow) return null;

    const summary = mapCharRowToSummary(charRow);

    const invRows = await query<RawInventoryRow>(
      `SELECT \`id\`, \`char_id\`, \`nameid\`, \`amount\`, \`equip\`, \`identify\`, \`refine\`, \`attribute\`, \`card0\`, \`card1\`, \`card2\`, \`card3\`
       FROM \`inventory\`
       WHERE \`char_id\` = ? AND \`equip\` > 0`,
      [charId]
    );

    const paperdoll: PaperdollData = {};
    const equippedItems: CharacterItem[] = [];

    for (const inv of invRows) {
      const item: CharacterItem = {
        id: inv.id,
        charId: inv.char_id,
        nameId: inv.nameid,
        amount: inv.amount,
        equip: inv.equip,
        identify: inv.identify,
        refine: inv.refine,
        attribute: inv.attribute,
        card0: inv.card0,
        card1: inv.card1,
        card2: inv.card2,
        card3: inv.card3,
      };

      const eq = inv.equip;

      if (eq & EQP_SLOTS.HEAD_TOP) {
        item.slotName = "head_top";
        paperdoll.headTop = item;
      }
      if (eq & EQP_SLOTS.HEAD_MID) {
        item.slotName = "head_mid";
        paperdoll.headMid = item;
      }
      if (eq & EQP_SLOTS.HEAD_LOW) {
        item.slotName = "head_low";
        paperdoll.headLow = item;
      }
      if (eq & EQP_SLOTS.ARMOR) {
        item.slotName = "armor";
        paperdoll.armor = item;
      }
      if (eq & EQP_SLOTS.RIGHT_HAND) {
        item.slotName = "right_hand";
        paperdoll.rightHand = item;
      }
      if (eq & EQP_SLOTS.LEFT_HAND) {
        item.slotName = "left_hand";
        paperdoll.leftHand = item;
      }
      if (eq & EQP_SLOTS.GARMENT) {
        item.slotName = "garment";
        paperdoll.garment = item;
      }
      if (eq & EQP_SLOTS.SHOES) {
        item.slotName = "shoes";
        paperdoll.shoes = item;
      }
      if (eq & EQP_SLOTS.ACC_LEFT) {
        item.slotName = "acc_left";
        paperdoll.accLeft = item;
      }
      if (eq & EQP_SLOTS.ACC_RIGHT) {
        item.slotName = "acc_right";
        paperdoll.accRight = item;
      }
      if (eq & EQP_SLOTS.COSTUME_TOP) {
        item.slotName = "costume_top";
        paperdoll.costumeTop = item;
      }
      if (eq & EQP_SLOTS.COSTUME_MID) {
        item.slotName = "costume_mid";
        paperdoll.costumeMid = item;
      }
      if (eq & EQP_SLOTS.COSTUME_LOW) {
        item.slotName = "costume_low";
        paperdoll.costumeLow = item;
      }
      if (eq & EQP_SLOTS.COSTUME_GARMENT) {
        item.slotName = "costume_garment";
        paperdoll.costumeGarment = item;
      }
      if (eq & EQP_SLOTS.SHADOW_ARMOR) {
        item.slotName = "shadow_armor";
        paperdoll.shadowArmor = item;
      }
      if (eq & EQP_SLOTS.SHADOW_WEAPON) {
        item.slotName = "shadow_weapon";
        paperdoll.shadowWeapon = item;
      }
      if (eq & EQP_SLOTS.SHADOW_SHIELD) {
        item.slotName = "shadow_shield";
        paperdoll.shadowShield = item;
      }
      if (eq & EQP_SLOTS.SHADOW_SHOES) {
        item.slotName = "shadow_shoes";
        paperdoll.shadowShoes = item;
      }
      if (eq & EQP_SLOTS.SHADOW_ACC_R) {
        item.slotName = "shadow_acc_r";
        paperdoll.shadowAccR = item;
      }
      if (eq & EQP_SLOTS.SHADOW_ACC_L) {
        item.slotName = "shadow_acc_l";
        paperdoll.shadowAccL = item;
      }

      equippedItems.push(item);
    }

    return {
      ...summary,
      paperdoll,
      equippedItems,
    };
  }

  static async searchPublicArmory(searchQuery: string): Promise<CharacterSummary[]> {
    const q = `%${searchQuery.trim()}%`;
    const rows = await query<RawCharRow>(
      `SELECT ${CHAR_COLUMNS} FROM \`char\` WHERE \`name\` LIKE ? ORDER BY \`base_level\` DESC, \`zeny\` DESC LIMIT 20`,
      [q]
    );

    return rows.map(mapCharRowToSummary);
  }

  static async getTopRanked(): Promise<CharacterSummary[]> {
    const rows = await query<RawCharRow>(
      `SELECT ${CHAR_COLUMNS} FROM \`char\` ORDER BY \`base_level\` DESC, \`base_exp\` DESC, \`zeny\` DESC LIMIT 10`
    );

    return rows.map(mapCharRowToSummary);
  }
}
