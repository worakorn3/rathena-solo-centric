#!/usr/bin/env python3
"""
tools/generate_junk_pool.py
---------------------------
Purely Script-Driven Drop Harvester & Junk Pool Generator for rAthena Solo-Centric.
No external AI/API dependency. 100% deterministic, offline, and free.

Scans db/re/mob_db.yml and db/re/item_db_etc.yml to produce the full master pool
of tradeable mob drops across 6 Level Tiers (Novice to 4th Class Lv 250).
Exports to db/custom/junk_pool.yml and sql-files/custom_junk_pool.sql.
"""

import os
import sys
import argparse
from typing import Dict, List, Any, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ITEM_DB_PATH = os.path.join(PROJECT_ROOT, "db", "re", "item_db_etc.yml")
MOB_DB_PATH = os.path.join(PROJECT_ROOT, "db", "re", "mob_db.yml")
OUTPUT_YML_PATH = os.path.join(PROJECT_ROOT, "db", "custom", "junk_pool.yml")
OUTPUT_SQL_PATH = os.path.join(PROJECT_ROOT, "sql-files", "custom_junk_pool.sql")

TIER_CONFIG = {
    1: {"name": "Novice & 1st Class (Lv 1 - 50)", "min_lv": 1, "max_lv": 50, "mult_min": 10, "mult_max": 18, "floor": 500},
    2: {"name": "2nd Class & Trans (Lv 51 - 99)", "min_lv": 51, "max_lv": 99, "mult_min": 12, "mult_max": 20, "floor": 1000},
    3: {"name": "3rd Class Early (Lv 100 - 140)", "min_lv": 100, "max_lv": 140, "mult_min": 14, "mult_max": 22, "floor": 2000},
    4: {"name": "3rd Class Mid/High (Lv 141 - 175)", "min_lv": 141, "max_lv": 175, "mult_min": 16, "mult_max": 24, "floor": 4000},
    5: {"name": "3rd Class End & Illusion (Lv 176 - 200)", "min_lv": 176, "max_lv": 200, "mult_min": 18, "mult_max": 26, "floor": 6000},
    6: {"name": "4th Class Master (Lv 201 - 250)", "min_lv": 201, "max_lv": 250, "mult_min": 20, "mult_max": 30, "floor": 10000},
}


def get_tier_for_level(level: int) -> Optional[int]:
    """Maps a monster level to its corresponding level tier (1-6)."""
    for tier, cfg in TIER_CONFIG.items():
        if cfg["min_lv"] <= level <= cfg["max_lv"]:
            return tier
    return None


def index_etc_items(db_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Fast streaming parser for item_db_etc.yml.
    Ignores untradeable, unsellable, or bound items (Trade: NoSell/NoTrade/NoDrop).
    Returns: { "AegisName": {"id": int, "name": str, "sell": int, "aegis": str} }
    """
    if not os.path.exists(db_path):
        print(f"[Warning] Item DB not found at: {db_path}")
        return {}

    print(f"[*] Pass 1: Indexing tradeable ETC items from {db_path}...")
    etc_items = {}
    current_id = None
    current_name = None
    current_aegis = None
    current_buy = None
    current_sell = None
    is_untradeable = False

    def commit_item():
        nonlocal current_id, current_name, current_aegis, current_buy, current_sell, is_untradeable
        if current_id and current_aegis and not is_untradeable:
            sell_price = current_sell
            if sell_price is None:
                sell_price = (current_buy // 2) if current_buy is not None else 10
            etc_items[current_aegis] = {
                "id": current_id,
                "name": current_name or current_aegis,
                "sell": max(1, sell_price),
                "aegis": current_aegis
            }

    with open(db_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_str = line.strip()
            if line_str.startswith("- Id:"):
                commit_item()
                try:
                    current_id = int(line_str.split(":", 1)[1].strip())
                except ValueError:
                    current_id = None
                current_name = None
                current_aegis = None
                current_buy = None
                current_sell = None
                is_untradeable = False
            elif current_id is not None:
                if line_str.startswith("AegisName:"):
                    current_aegis = line_str.split(":", 1)[1].strip()
                elif line_str.startswith("Name:"):
                    current_name = line_str.split(":", 1)[1].strip().strip('"')
                elif line_str.startswith("Buy:"):
                    try:
                        current_buy = int(line_str.split(":", 1)[1].strip())
                    except ValueError:
                        pass
                elif line_str.startswith("Sell:"):
                    try:
                        current_sell = int(line_str.split(":", 1)[1].strip())
                    except ValueError:
                        pass
                elif line_str.startswith("NoSell: true") or line_str.startswith("NoTrade: true") or line_str.startswith("NoDrop: true"):
                    is_untradeable = True

        commit_item()

    print(f"[+] Indexed {len(etc_items)} tradeable ETC items.")
    return etc_items


def harvest_mob_drops(mob_db_path: str, etc_items: Dict[str, Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
    """
    Fast streaming parser for mob_db.yml.
    Matches non-MVP monsters with their dropped ETC items and categorizes them into 6 Tiers.
    Keeps ALL valid drops without arbitrary limits.
    """
    if not os.path.exists(mob_db_path):
        print(f"[Warning] Mob DB not found at: {mob_db_path}")
        return {t: [] for t in TIER_CONFIG}

    print(f"[*] Pass 2: Scanning monster drop tables from {mob_db_path}...")
    tier_candidates: Dict[int, Dict[int, Dict[str, Any]]] = {t: {} for t in TIER_CONFIG}

    current_mob_name = None
    current_mob_lv = 1
    is_mvp = False
    in_drops = False
    current_drop_item = None

    def process_drop(drop_item: str, drop_rate: int):
        nonlocal current_mob_name, current_mob_lv, is_mvp
        if is_mvp or not drop_item:
            return
        
        tier = get_tier_for_level(current_mob_lv)
        if not tier:
            return

        if drop_item in etc_items:
            item_info = etc_items[drop_item]
            item_id = item_info["id"]
            drop_pct = drop_rate / 100.0

            # Filter for farmable rate (>= 10%)
            if drop_pct >= 10.0:
                if item_id not in tier_candidates[tier] or drop_pct > tier_candidates[tier][item_id]["drop_pct"]:
                    tier_candidates[tier][item_id] = {
                        "id": item_id,
                        "name": item_info["name"],
                        "aegis": item_info["aegis"],
                        "mob": current_mob_name or "Unknown Mob",
                        "mob_lv": current_mob_lv,
                        "drop_pct": int(drop_pct),
                        "npc_sell": item_info["sell"]
                    }

    with open(mob_db_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_str = line.strip()

            if line_str.startswith("- Id:"):
                current_mob_name = None
                current_mob_lv = 1
                is_mvp = False
                in_drops = False
                current_drop_item = None
            elif line_str.startswith("Name:"):
                current_mob_name = line_str.split(":", 1)[1].strip().strip('"')
            elif line_str.startswith("Level:"):
                try:
                    current_mob_lv = int(line_str.split(":", 1)[1].strip())
                except ValueError:
                    current_mob_lv = 1
            elif line_str.startswith("MvpExp:") or "Class: Boss" in line_str:
                is_mvp = True
            elif line_str.startswith("Drops:"):
                in_drops = True
                current_drop_item = None
            elif in_drops:
                if line_str.startswith("- Item:"):
                    current_drop_item = line_str.split(":", 1)[1].strip()
                elif line_str.startswith("Rate:") and current_drop_item:
                    try:
                        rate_val = int(line_str.split(":", 1)[1].strip())
                        process_drop(current_drop_item, rate_val)
                    except ValueError:
                        pass
                    current_drop_item = None
                elif line_str.startswith("- Id:") or (line_str and not line_str.startswith(" ") and not line_str.startswith("-")):
                    in_drops = False

    # Convert dictionaries to lists sorted by drop percentage
    sorted_tiers: Dict[int, List[Dict[str, Any]]] = {}
    total_items = 0
    for tier, items in tier_candidates.items():
        sorted_list = sorted(items.values(), key=lambda x: x["drop_pct"], reverse=True)
        sorted_tiers[tier] = sorted_list
        total_items += len(sorted_list)
        print(f"    - Tier {tier} ({TIER_CONFIG[tier]['name']}): Harvested {len(sorted_list)} farmable drops.")

    print(f"[+] Total farmable monster drop items harvested across all tiers: {total_items}")
    return sorted_tiers


def build_pure_script_pool(tier_candidates: Dict[int, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Builds the master pool using deterministic mathematical formulas.
    Guarantees balanced, scaled economy bounties for every tier.
    """
    pool = {}

    for tier_num, cfg in TIER_CONFIG.items():
        tier_key = f"tier_{tier_num}"
        tier_data = {
            "name": cfg["name"],
            "min_level": cfg["min_lv"],
            "max_level": cfg["max_lv"],
            "items": []
        }

        candidates = tier_candidates.get(tier_num, [])
        for cand in candidates:
            min_price = max(cfg["floor"], int(cand["npc_sell"] * cfg["mult_min"]))
            max_price = max(int(min_price * 1.5), int(cand["npc_sell"] * cfg["mult_max"]))

            tier_data["items"].append({
                "id": cand["id"],
                "name": cand["name"],
                "min_price": min_price,
                "max_price": max_price,
                "mobs": f"{cand['mob']} (Lv {cand['mob_lv']})",
                "mob_name": cand["mob"],
                "mob_lv": cand["mob_lv"],
                "drop_pct": cand["drop_pct"],
                "npc_sell": cand["npc_sell"]
            })

        pool[tier_key] = tier_data

    return pool


def export_yaml(pool: Dict[str, Any], output_path: str):
    """Exports master pool to YAML file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# ==========================================================\n")
        f.write("# rAthena Solo-Centric: Daily Junk Buyer Master Pool\n")
        f.write("# Purely Script-Driven (Harvested from mob_db.yml & item_db_etc.yml)\n")
        f.write("# ==========================================================\n\n")

        for tier_key, tier_data in pool.items():
            f.write(f"{tier_key}:\n")
            f.write(f"  name: \"{tier_data['name']}\"\n")
            f.write(f"  min_level: {tier_data['min_level']}\n")
            f.write(f"  max_level: {tier_data['max_level']}\n")
            f.write("  items:\n")
            for item in tier_data["items"]:
                f.write(f"    - id: {item['id']}\n")
                f.write(f"      name: \"{item['name']}\"\n")
                f.write(f"      min_price: {item['min_price']}\n")
                f.write(f"      max_price: {item['max_price']}\n")
                f.write(f"      mobs: \"{item.get('mobs', 'Various Mobs')}\"\n")
            f.write("\n")

    print(f"[+] Master Junk Pool exported successfully to YAML: {output_path}")


def export_sql(pool: Dict[str, Any], output_path: str):
    """Exports master pool to SQL table creation and seed file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- ==========================================================\n")
        f.write("-- rAthena Solo-Centric: Daily Junk Buyer Master Table\n")
        f.write("-- Harvested automatically from mob_db.yml & item_db_etc.yml\n")
        f.write("-- ==========================================================\n\n")
        f.write("CREATE TABLE IF NOT EXISTS `custom_junk_pool` (\n")
        f.write("  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n")
        f.write("  `tier` tinyint(2) unsigned NOT NULL,\n")
        f.write("  `item_id` int(11) unsigned NOT NULL,\n")
        f.write("  `item_name` varchar(100) NOT NULL,\n")
        f.write("  `min_price` int(11) unsigned NOT NULL,\n")
        f.write("  `max_price` int(11) unsigned NOT NULL,\n")
        f.write("  `mob_name` varchar(100) NOT NULL,\n")
        f.write("  `mob_lv` smallint(4) unsigned NOT NULL,\n")
        f.write("  `drop_pct` smallint(4) unsigned NOT NULL,\n")
        f.write("  `npc_sell` int(11) unsigned NOT NULL,\n")
        f.write("  PRIMARY KEY (`id`),\n")
        f.write("  UNIQUE KEY `tier_item` (`tier`, `item_id`),\n")
        f.write("  KEY `tier_idx` (`tier`)\n")
        f.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n")

        f.write("TRUNCATE TABLE `custom_junk_pool`;\n\n")
        f.write("INSERT INTO `custom_junk_pool` (`tier`, `item_id`, `item_name`, `min_price`, `max_price`, `mob_name`, `mob_lv`, `drop_pct`, `npc_sell`) VALUES\n")

        rows = []
        for tier_num in range(1, 7):
            tier_key = f"tier_{tier_num}"
            tier_items = pool.get(tier_key, {}).get("items", [])
            for it in tier_items:
                clean_item_name = it["name"].replace("'", "''")
                clean_mob_name = it["mob_name"].replace("'", "''")
                rows.append(
                    f"({tier_num}, {it['id']}, '{clean_item_name}', {it['min_price']}, {it['max_price']}, '{clean_mob_name}', {it['mob_lv']}, {it['drop_pct']}, {it['npc_sell']})"
                )

        f.write(",\n".join(rows) + ";\n")

    print(f"[+] Master Junk Pool exported successfully to SQL: {output_path} ({len(rows)} entries)")


def main():
    parser = argparse.ArgumentParser(description="Script-driven monster drop harvester and Junk Pool generator.")
    parser.add_argument("--yml-output", type=str, default=OUTPUT_YML_PATH, help="Output YAML file path.")
    parser.add_argument("--sql-output", type=str, default=OUTPUT_SQL_PATH, help="Output SQL file path.")
    args = parser.parse_args()

    print("[*] Running Purely Script-Driven Junk Pool Harvester...")
    etc_items = index_etc_items(ITEM_DB_PATH)
    tier_candidates = harvest_mob_drops(MOB_DB_PATH, etc_items)
    pool = build_pure_script_pool(tier_candidates)
    export_yaml(pool, args.yml_output)
    export_sql(pool, args.sql_output)
    print("[+] Done! Database tables generated. Zero AI tokens used.")


if __name__ == "__main__":
    main()
