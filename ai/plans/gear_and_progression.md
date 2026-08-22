# Gear, Progression & Longevity Specification

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!WARNING]  
> "I have all the gear I want" = game over. This specification ensures character and gear progression have infinite depth, diminishing returns, and meaningful pacing without vertical power creep or instant resets.

---

## 1. Gear Progression Longevity

### Anti-Ceiling Enhancement Layers
Rather than capping out at a single refine level, gear progression unfolds across 5 distinct vertical and horizontal layers:

| Layer | System Description | Max Level | Effort Horizon |
|:---|:---|:---|:---|
| **Refine** | Flat ATK / MATK / DEF scaling | +12 | Hours / Days |
| **Enchant** | Random bonus secondary stats & elemental affinities | Tier 4 | Days / Weeks |
| **Socket** | Socketing NPCs to unlock additional card slots | +2 slots | Weeks |
| **Awaken** | Special passive set bonuses triggered by synergies | Stage 5 | Months |
| **Transcend** | Cosmetic prestige glow + micro-stat bonuses | Infinite | Endless progression |

### Gear Quality Tiers (Server-Side Naming)
Items drop with randomized quality tiers. To eliminate any requirement for custom client side patches, tiers are rendered strictly server-side via item name prefixes in `item_db.conf` / scripts:

| Quality | Prefix Display | Stat Modifier | Drop Frequency | Visual Identity |
|:---|:---|:---|:---|:---|
| **Common** | `Claymore` | Base Stats | 70% | Standard item |
| **Uncommon** | `Sturdy Claymore` | +5% Base Stats | 20% | Faint item rank |
| **Rare** | `Reinforced Claymore` | +10% Base Stats | 8% | Rare identifier |
| **Epic** | `Masterwork Claymore` | +15% Base Stats | 1.9% | Mastercraft |
| **Legendary**| `Perfect Claymore` | +20% Base Stats | 0.1% | Pinnacle drop |

```c
// Script grant example
getitem2 1101, 1, 1, 0, 0, 0, 0, 0, 0;
```

### Transcendence Diminishing Returns (Anti-Godhood Safeguard)
Transcendence levels provide visible long-term prestige while strictly preventing 1000-hour players from breaking game math:

```
Transcend Level → Bonus Formula:
  Lvl 1-10:   +0.5% stat per level (Total +5%)
  Lvl 11-50:  +0.2% stat per level (Total +8% more)
  Lvl 51-100: +0.1% stat per level (Total +5% more)
  Lvl 100+:   +0.01% per level (Cosmetic / prestige bragging rights)

Total at Transcend 100:  ~18% stat bonus
Total at Transcend 1000: ~27% stat bonus (Only 9% gain for 900 levels!)
```

### QoL Focus Over Pure Power Multipliers
Solo-specific gear provides convenience and uptime (less downtime, increased movement speed, extended buff durations) rather than raw damage multipliers, ensuring encounters still demand active player skill.

---

## 2. 4th Class Stats (Trait System Lv200+)

At Level 200, characters unlock 6 new trait stats that supplement standard attributes:

| Trait Stat | Full Name | Core Derived Property | Strategic Focus |
|:---|:---|:---|:---|
| **POW** | Power | **P.ATK** (Physical Attack Power) | Physical DPS & skill burst |
| **STA** | Stamina | **RES** (Physical Resistance) | Physical damage mitigation & survivability |
| **WIS** | Wisdom | **MRES** (Magic Resistance) | Magical damage mitigation |
| **SPL** | Spell | **S.MATK** (Spell Magic Attack) | Magic DPS & elemental scaling |
| **CON** | Concentration | **H.PLUS** / **P.ATK** / **S.MATK** | Healing effectiveness & hybrid output |
| **CRT** | Creative | **C.RATE** (Critical Rate) | Trait critical hit chance |

### Stat Caps & Point Gains
- **Original Stats Cap (STR/AGI/VIT/INT/DEX/LUK):** 130
- **Trait Stats Cap (POW/STA/WIS/SPL/CON/CRT):** 130
- **Standard Levels:** 3 Trait points per level.
- **Milestone Levels (Multiples of 5):** 7 Trait points per level.

### Solo Build Architectures
| Build Archetype | Primary Trait Focus | Secondary Trait Focus | Solo Application |
|:---|:---|:---|:---|
| **Solo Physical DPS** | POW | STA | High clear speed with survivability |
| **Solo Magical DPS** | SPL | STA / WIS | Spell nuking without getting one-shot |
| **Solo Tank** | STA | WIS | Surviving MvP heavy physical and magic phases |
| **Solo Healer** | CON | SPL | High-potency solo heals + holy spell damage |
| **Balanced Hybrid** | Even 6-way distribution | — | Broad adaptability across various dungeon types |

### Respec & Reset Flexibility
- **Weekly Reset:** 1 Free Trait / Skill reset per week via NPC.
- **On-Demand Reset:** Available at any time for 50,000 Zeny to encourage experimentation.

---

## 3. Respectful Leveling Design

> [!CAUTION]  
> The #1 cause of MMORPG burnout is grinding 5 hours for 0.5% EXP. This design guarantees meaningful, visible progress every single play session.

### Progression Experience Targets
```
Session Length    │ EXP Gained    │ Player Feeling
──────────────────┼───────────────┼─────────────────────────────
30 minutes        │ 3–5%          │ 😊 "Quick session win!"
1 hour            │ 8–15%         │ 😄 "Good, solid progress!"
2 hours           │ 20–30%        │ 🎉 "Level up achieved!"
```

### Tiered EXP Curve Pacing
| Level Range | EXP Rate | Progression Experience |
|:---|:---|:---|
| **1–30** | **1x (Vanilla)** | Nostalgic early game; appreciate Prontera fields & Poring BGM |
| **31–60** | **2x** | Culvert and Payon Dungeon feel substantial, not a speedrun |
| **61–99** | **3x** | Mid-game picks up momentum toward rebirth |
| **100–150** | **4x** | 3rd class specialization development |
| **151–185+** | **5x** | Endgame preparation; max level reachable in ~100 hours total |

### Leveling Acceleration Mechanisms
- **Flattened EXP Curves:** Modified high-level curves in `db/exp_group_db.conf`.
- **Quest EXP Bonuses:** Story and local quest completion grants 5–10% of current level EXP.
- **First Kill of the Day:** First monster of each unique species slain daily grants a 10x EXP burst.
- **Rest Bonus:** Accumulates up to +200% EXP bonus during offline hours for active return.
