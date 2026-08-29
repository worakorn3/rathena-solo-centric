#!/usr/bin/env python3
"""
tools/generate_mob_milestones.py
--------------------------------
Deterministic Hunt Milestone & Reward Generator for rAthena Solo-Centric.
Filters out MVPs, Mini-Bosses, Minions/Slaves, Guild Clones, Props, and Dummies.
Calculates adaptive kill requirements, scaled Zeny rewards, curated item prizes,
and proportional MS500 ETF shares across 5 Level Tiers (Novice to 4th Class Lv 250+).

Outputs:
  - sql-files/custom/solo_mob_milestones.sql
  - db/custom/mob_milestones.json
"""

import os
import sys
import math
import json
from typing import Dict, List, Any, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
MOB_DB_PATH = os.path.join(PROJECT_ROOT, "db", "re", "mob_db.yml")
OUTPUT_SQL_PATH = os.path.join(PROJECT_ROOT, "sql-files", "custom", "solo_mob_milestones.sql")
OUTPUT_JSON_PATH = os.path.join(PROJECT_ROOT, "db", "custom", "mob_milestones.json")

# Tier Configurations aligned with server progression
TIERS = [
    {
        "tier_id": 1,
        "label": "Novice (Lv 1–40)",
        "min_lv": 1,
        "max_lv": 40,
        "zeny_mult": 1.0,
        "item_pool": [
            (501, 50, "Red Potion"),
            (502, 35, "Orange Potion"),
            (503, 25, "Yellow Potion"),
            (601, 40, "Fly Wing"),
            (602, 15, "Butterfly Wing"),
            (518, 10, "Honey"),
        ],
        "shares_range": (1, 3),
        "desc": "Starter monsters in Prontera, Geffen, Morroc, and Payon fields."
    },
    {
        "tier_id": 2,
        "label": "2nd Class (Lv 41–89)",
        "min_lv": 41,
        "max_lv": 89,
        "zeny_mult": 1.4,
        "item_pool": [
            (504, 40, "White Potion"),
            (505, 20, "Blue Potion"),
            (604, 5, "Dead Branch"),
            (999, 15, "Steel"),
            (984, 8, "Oridecon"),
            (985, 8, "Elunium"),
        ],
        "shares_range": (4, 12),
        "desc": "Mid-tier dungeon and field monsters (Orc Village, Pyramids, Glast Heim outskirts, etc.)."
    },
    {
        "tier_id": 3,
        "label": "Trans (Lv 90–99)",
        "min_lv": 90,
        "max_lv": 99,
        "zeny_mult": 2.0,
        "item_pool": [
            (603, 3, "Old Blue Box"),
            (984, 15, "Oridecon"),
            (985, 15, "Elunium"),
            (522, 25, "Mastela Fruit"),
            (526, 20, "Royal Jelly"),
            (608, 8, "Yggdrasil Seed"),
        ],
        "shares_range": (15, 25),
        "desc": "High-level Pre-Renewal dungeons (Glast Heim Castle, Magma Dungeon, Rachel Sanctuary)."
    },
    {
        "tier_id": 4,
        "label": "3rd Class (Lv 100–185)",
        "min_lv": 100,
        "max_lv": 185,
        "zeny_mult": 3.0,
        "item_pool": [
            (617, 3, "Old Purple Box"),
            (607, 12, "Yggdrasil Berry"),
            (7619, 2, "Enriched Elunium"),
            (7620, 2, "Enriched Oridecon"),
            (526, 35, "Royal Jelly"),
            (608, 15, "Yggdrasil Seed"),
        ],
        "shares_range": (30, 50),
        "desc": "Renewal expansion zones (Veins, Juperos, Abyss Lake, Bio Lab 3/4, Illusion Dungeons)."
    },
    {
        "tier_id": 5,
        "label": "4th Class (Lv 186–250+)",
        "min_lv": 186,
        "max_lv": 999,
        "zeny_mult": 5.0,
        "item_pool": [
            (616, 2, "Old Card Album"),
            (617, 5, "Old Purple Box"),
            (6635, 2, "Blacksmith Blessing"),
            (607, 30, "Yggdrasil Berry"),
            (12246, 1, "Mystical Card Album"),
        ],
        "shares_range": (60, 100),
        "desc": "Apex 4th Class frontiers (Nifflheim Dungeon, Amicitia, Tartaros, Clock Tower Unknown)."
    },
]


def get_tier(level: int) -> Dict[str, Any]:
    for t in TIERS:
        if t["min_lv"] <= level <= t["max_lv"]:
            return t
    return TIERS[-1]


def parse_mobs(db_path: str) -> List[Dict[str, Any]]:
    """Streaming parser for mob_db.yml."""
    if not os.path.exists(db_path):
        print(f"[Error] mob_db.yml not found at {db_path}")
        return []

    mobs = []
    current: Dict[str, Any] = {}
    in_modes = False
    in_racegroups = False
    in_mvp_drops = False
    in_drops = False

    with open(db_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            s = line.strip()
            if s.startswith("- Id:"):
                if current and "Id" in current:
                    mobs.append(current)
                current = {
                    "Id": int(s.split(":", 1)[1].strip()),
                    "Modes": {},
                    "RaceGroups": {},
                    "Drops": [],
                    "MvpDrops": [],
                    "Level": 1,
                    "Hp": 1,
                    "BaseExp": 0,
                    "JobExp": 0,
                    "MvpExp": 0,
                    "Class": "Normal",
                    "Ai": "06",
                }
                in_modes = False
                in_racegroups = False
                in_mvp_drops = False
                in_drops = False
            elif not current:
                continue
            elif s.startswith("AegisName:"):
                current["AegisName"] = s.split(":", 1)[1].strip()
            elif s.startswith("Name:"):
                current["Name"] = s.split(":", 1)[1].strip().strip('"')
            elif s.startswith("Level:"):
                try:
                    current["Level"] = int(s.split(":", 1)[1].strip())
                except ValueError:
                    current["Level"] = 1
            elif s.startswith("Hp:"):
                try:
                    current["Hp"] = int(s.split(":", 1)[1].strip())
                except ValueError:
                    current["Hp"] = 1
            elif s.startswith("BaseExp:"):
                try:
                    current["BaseExp"] = int(s.split(":", 1)[1].strip())
                except ValueError:
                    current["BaseExp"] = 0
            elif s.startswith("JobExp:"):
                try:
                    current["JobExp"] = int(s.split(":", 1)[1].strip())
                except ValueError:
                    current["JobExp"] = 0
            elif s.startswith("Class:"):
                current["Class"] = s.split(":", 1)[1].strip()
            elif s.startswith("Ai:"):
                current["Ai"] = s.split(":", 1)[1].strip().strip('"')
            elif s.startswith("MvpExp:"):
                try:
                    current["MvpExp"] = int(s.split(":", 1)[1].strip())
                except ValueError:
                    current["MvpExp"] = 0
            elif s.startswith("Modes:"):
                in_modes = True
                in_racegroups = False
                in_mvp_drops = False
                in_drops = False
            elif s.startswith("RaceGroups:"):
                in_racegroups = True
                in_modes = False
                in_mvp_drops = False
                in_drops = False
            elif s.startswith("MvpDrops:"):
                in_mvp_drops = True
                in_modes = False
                in_racegroups = False
                in_drops = False
            elif s.startswith("Drops:"):
                in_drops = True
                in_modes = False
                in_racegroups = False
                in_mvp_drops = False
            elif in_modes and line.startswith("    ") and ":" in s:
                k, v = s.split(":", 1)
                current["Modes"][k.strip()] = v.strip().lower() == "true"
            elif in_racegroups and line.startswith("    ") and ":" in s:
                k, v = s.split(":", 1)
                current["RaceGroups"][k.strip()] = v.strip().lower() == "true"
            elif (in_drops or in_mvp_drops) and s.startswith("- Item:"):
                item_name = s.split(":", 1)[1].strip()
                if in_mvp_drops:
                    current["MvpDrops"].append(item_name)
                else:
                    current["Drops"].append(item_name)

    if current and "Id" in current:
        mobs.append(current)

    return mobs


def is_normal_hunting_monster(m: Dict[str, Any]) -> bool:
    """Filter out Bosses, MVPs, Minions/Slaves, Guild Clones, Props, and Dummies."""
    # 1. MVP check
    if m.get("MvpExp", 0) > 0 or len(m.get("MvpDrops", [])) > 0:
        return False
    # 2. Boss class check
    if m.get("Class") == "Boss":
        return False
    # 3. Minion / Slave AI / Mode check
    if m.get("Modes", {}).get("Slave", False) or m.get("Ai") in ("19", 19, "20", 20):
        return False
    
    aegis = m.get("AegisName", "").upper()
    name = m.get("Name", "").upper()
    
    # 4. Guild Castle / Instance Duplicate / Event Clones
    if aegis.startswith("G_") or aegis.startswith("E_") or aegis.startswith("MD_") or aegis.startswith("EV_"):
        return False
    
    # 5. Non-combat entities / Dummies / Props
    if "DUMMY" in aegis or "DUMMY" in name:
        return False
    if "EMPERIUM" in aegis or "TREASURE" in aegis or "BARRICADE" in aegis or "GUARDIAN" in aegis:
        return False
    if "TRAP" in aegis or "HIDDEN" in aegis or "EFFECT" in aegis or "WARP" in aegis or "CONTROL" in aegis or "TEST" in aegis:
        return False
    if "PLANT" in aegis or "MUSHROOM" in aegis or "SOIL" in aegis or "ROCK" in aegis or "THICKET" in aegis:
        return False
    if "EGG" in aegis or "CRYSTAL" in aegis or "BALL" in aegis or "CHEST" in aegis or "BOX" in aegis:
        return False
        
    # 6. Minimum combat health & exp thresholds
    if m.get("Hp", 0) <= 10 or m.get("Level", 0) <= 0:
        return False
    if m.get("BaseExp", 0) == 0 and m.get("JobExp", 0) == 0 and m.get("Hp", 0) < 1000:
        return False

    return True


def calculate_milestone_values(mob: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate adaptive required kill count, Zeny reward, item reward, and MS500 ETF shares."""
    mob_id = mob["Id"]
    level = mob["Level"]
    hp = mob["Hp"]
    name = mob["Name"]
    tier = get_tier(level)

    # 1. Adaptive Kill Count Calculation
    # Scaled by HP & Level so swarming weak mobs require more kills, while tough end-game mobs require fewer.
    if level <= 40:
        base = 500 - int((level / 40.0) * 200)
        if hp > 1000:
            base -= 50
        count = max(150, min(500, base))
        count = max(100, round(count / 25) * 25)
    elif level <= 89:
        base = 300 - int(((level - 40) / 49.0) * 120)
        if hp > 15000:
            base -= 40
        count = max(100, min(300, base))
        count = max(75, round(count / 25) * 25)
    elif level <= 99:
        base = 200 - int((min(hp, 100000) / 100000.0) * 80)
        count = max(80, min(200, base))
        count = max(50, round(count / 10) * 10)
    elif level <= 185:
        base = 150 - int(((level - 100) / 85.0) * 60)
        if hp > 300000:
            base -= 30
        count = max(50, min(150, base))
        count = max(40, round(count / 10) * 10)
    else:  # 4th Class 186+
        base = 60 - int((min(hp, 5000000) / 5000000.0) * 30)
        count = max(25, min(60, base))
        count = max(20, round(count / 5) * 5)

    # 2. Zeny Reward Calculation
    effort = (level * 1200 + math.sqrt(max(1, hp)) * 75) * (count / 100.0) * tier["zeny_mult"]
    
    if level <= 40:
        zeny = max(15000, min(60000, round(effort / 5000) * 5000))
    elif level <= 89:
        zeny = max(60000, min(250000, round(effort / 10000) * 10000))
    elif level <= 99:
        zeny = max(250000, min(600000, round(effort / 25000) * 25000))
    elif level <= 185:
        zeny = max(600000, min(1800000, round(effort / 50000) * 50000))
    else:
        zeny = max(2000000, min(5000000, round(effort / 100000) * 100000))

    # 3. MS500 ETF Shares Calculation
    min_s, max_s = tier["shares_range"]
    calculated_shares = round(zeny / 40000)
    shares = max(min_s, min(max_s, calculated_shares))

    # 4. Item Reward Selection (deterministic rotation based on mob_id)
    item_pool = tier["item_pool"]
    selected_item = item_pool[mob_id % len(item_pool)]
    item_id, item_amount, item_name = selected_item

    # 5. Metadata formatting
    m_id = f"mob_{mob_id}_{count}"
    title = f"{name} Hunt"
    desc = f"Exterminate {count:,} {name}s across Midgard"
    reward_desc = f"{zeny:,} Zeny + {item_amount}x {item_name} + {shares}x MS500 ETF"

    return {
        "id": m_id,
        "category": "SPECIFIC_MOB",
        "prev_milestone_id": None,
        "target_mob_id": mob_id,
        "required_count": count,
        "title": title,
        "description": desc,
        "reward_zeny": zeny,
        "reward_item_id": item_id,
        "reward_item_amount": item_amount,
        "reward_stock_ticker": "MS500",
        "reward_stock_shares": shares,
        "reward_desc": reward_desc,
        "tier_label": tier["label"],
        "is_active": 1,
        "mob_name": name,
        "mob_level": level,
        "mob_hp": hp,
    }


def main():
    print("[*] Parsing mob_db.yml...")
    all_mobs = parse_mobs(MOB_DB_PATH)
    print(f"[+] Loaded {len(all_mobs)} raw monster entries.")

    normal_mobs = [m for m in all_mobs if is_normal_hunting_monster(m)]
    # Sort by Level ascending, then ID ascending
    normal_mobs.sort(key=lambda m: (m["Level"], m["Id"]))
    print(f"[+] Identified {len(normal_mobs)} valid normal hunting monsters (excluded MVPs, Bosses, Slaves, Clones, Props, Dummies).")

    milestones = []
    sort_order = 10  # Leave room for global/system milestones at top

    for mob in normal_mobs:
        data = calculate_milestone_values(mob)
        data["sort_order"] = sort_order
        sort_order += 1
        milestones.append(data)

    # Statistics by tier
    tier_counts = {}
    for m in milestones:
        t = m["tier_label"]
        tier_counts[t] = tier_counts.get(t, 0) + 1

    print("\n--- Milestone Tier Breakdown ---")
    for t in TIERS:
        t_name = t["label"]
        count = tier_counts.get(t_name, 0)
        print(f"  Tier {t['tier_id']} - {t_name}: {count} milestones")

    # Generate SQL file
    print(f"\n[*] Writing SQL output to {OUTPUT_SQL_PATH}...")
    os.makedirs(os.path.dirname(OUTPUT_SQL_PATH), exist_ok=True)
    
    with open(OUTPUT_SQL_PATH, "w", encoding="utf-8") as f:
        f.write("-- --------------------------------------------------------\n")
        f.write("-- Master Normal Monster Hunt Milestones (Automated Batch Seed)\n")
        f.write(f"-- Total Milestones: {len(milestones)}\n")
        f.write("-- Generated via tools/generate_mob_milestones.py\n")
        f.write("-- --------------------------------------------------------\n\n")
        f.write("INSERT INTO `solo_milestones`\n")
        f.write("(`id`, `category`, `prev_milestone_id`, `target_mob_id`, `required_count`, `title`, `description`, `reward_zeny`, `reward_item_id`, `reward_item_amount`, `reward_stock_ticker`, `reward_stock_shares`, `reward_desc`, `tier_label`, `is_active`, `sort_order`)\nVALUES\n")

        values_list = []
        for m in milestones:
            # Escape strings for SQL safety
            title_escaped = m["title"].replace("'", "''")
            desc_escaped = m["description"].replace("'", "''")
            rdesc_escaped = m["reward_desc"].replace("'", "''")
            tier_escaped = m["tier_label"].replace("'", "''")

            row_str = f"('{m['id']}', '{m['category']}', NULL, {m['target_mob_id']}, {m['required_count']}, '{title_escaped}', '{desc_escaped}', {m['reward_zeny']}, {m['reward_item_id']}, {m['reward_item_amount']}, '{m['reward_stock_ticker']}', {m['reward_stock_shares']}, '{rdesc_escaped}', '{tier_escaped}', {m['is_active']}, {m['sort_order']})"
            values_list.append(row_str)

        f.write(",\n".join(values_list))
        f.write("\nON DUPLICATE KEY UPDATE\n")
        f.write("`target_mob_id` = VALUES(`target_mob_id`),\n")
        f.write("`required_count` = VALUES(`required_count`),\n")
        f.write("`title` = VALUES(`title`),\n")
        f.write("`description` = VALUES(`description`),\n")
        f.write("`reward_zeny` = VALUES(`reward_zeny`),\n")
        f.write("`reward_item_id` = VALUES(`reward_item_id`),\n")
        f.write("`reward_item_amount` = VALUES(`reward_item_amount`),\n")
        f.write("`reward_stock_ticker` = VALUES(`reward_stock_ticker`),\n")
        f.write("`reward_stock_shares` = VALUES(`reward_stock_shares`),\n")
        f.write("`reward_desc` = VALUES(`reward_desc`),\n")
        f.write("`tier_label` = VALUES(`tier_label`),\n")
        f.write("`is_active` = VALUES(`is_active`),\n")
        f.write("`sort_order` = VALUES(`sort_order`);\n")

    print(f"[+] Successfully generated {OUTPUT_SQL_PATH} ({len(milestones)} milestones).")

    # Generate JSON file for fast web/offline referencing
    print(f"[*] Writing JSON catalog to {OUTPUT_JSON_PATH}...")
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(milestones, f, indent=2)

    print(f"[+] Successfully generated {OUTPUT_JSON_PATH}.")


if __name__ == "__main__":
    main()
