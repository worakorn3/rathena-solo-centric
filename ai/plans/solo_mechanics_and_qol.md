# Solo Mechanics & Quality of Life (QoL) Specification

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!IMPORTANT]  
> Ragnarok Online vanilla heavily favors large parties. This server flips the balance: **solo-first, party-welcome**, without destroying the economy or invalidating healer classes.

---

## 1. Solo-Tilt Redesign

### Party-Favored Vanilla vs Solo-Centric
| Mechanic | Vanilla Behavior | Problem for Solo | Solo-Tilt Server Redesign |
|:---|:---|:---|:---|
| **EXP Sharing** | +25% EXP per party member | Solo = 0% bonus | Solo = **125% baseline EXP** (never punished) |
| **Instance Scaling** | Tuned for 3-12 players | Solo dies or cannot enter | Instances scale down: **30% HP / 50% DMG** for solo |
| **MvP Hunting** | Groups dominate spawns | Unfair competition | Low-pop runtime check spawns instanced MvPs |
| **Support Skills** | Requires 2nd player | Missing buffs | Buff scrolls, mercenary helpers, dual-clienting |
| **Class Trinity** | Tank / Healer / DPS | Forced 3 roles | Gear flexibility & helper mercenaries enable solo clears |

### EXP Formula & Logic
```
Vanilla:
  Solo = 100% EXP
  2 players = 125% EXP (total divided)
  3 players = 150% EXP (total divided)

Our Server:
  Solo = 125% EXP (baseline bonus)
  2 players = 150% EXP (still worth it)
  3 players = 175% EXP (diminishing returns)
```

```c
// Script implementation hook
OnNPCKillEvent:
    .@party_size = getpartysize();
    if (.@party_size <= 1) {
        // Solo bonus: +25% EXP
        getexp killedexp * 25 / 100, killedjobexp * 25 / 100;
    }
```

### Instance Difficulty Scaling
| Party Size | Monster HP | Monster Damage | Loot Multiplier |
|:---|:---|:---|:---|
| **1 (Solo)** | 30% | 50% | 100% (No reduction!) |
| **2 (Duo)** | 60% | 75% | 100% |
| **3 (Trio)** | 100% | 100% | 100% |

### MvP Solo Spawns (Runtime Population Gating)
```c
OnMvPSpawn:
    .@online = getusers(1);  // Total online players
    if (.@online <= 10) {
        // Low pop = spawn instanced solo MvP
        instance_create "Solo_MVP_Baphomet";
        announce "A solo MvP instance is available!", bc_all;
    } else {
        // Normal pop = field spawn
        monster "prt_maze03",0,0,"Baphomet",1039,1;
    }
```

| Server Population | MvP Behavior |
|:---|:---|
| **\(\le 10\) players** | Solo-instanced MvP spawns |
| **11–30 players** | Field spawn + 1-hour personal lockout |
| **31+ players** | Normal competitive field spawn |

---

## 2. Support Follower System (Dual-Client & Mercenaries)

> [!NOTE]  
> Solo-centric design allows second clients or support bots under strict ethical boundaries.

### Dual-Client Policy
- **Max Clients:** Allowed **2 clients per IP** (`conf/subnet_athena.conf`).
- **Party EXP / Loot Share:** Enabled between own accounts.

### Support Bot Policy ("Support OK, Kill Steal NOT OK")
```
Allowed Bot Behaviors:
├── Follow main character
├── Cast support skills (Heal, Blessing, Agi Up)
├── Use consumables on party
└── Passive defense (no aggression)

Forbidden Bot Behaviors:
├── Auto-attacking or auto-targeting monsters
├── Offensive skill casting
├── Independent / AFK farming
└── MvP hunting without main player
```

### Smart Mercenary Script Alternative
```c
prontera,145,170,4	script	Advanced Mercenary Guild	4_M_BARMUND,{
    mes "[Guild Master]";
    mes "Our advanced mercenaries can:";
    mes "• Follow you anywhere";
    mes "• Heal when you're hurt";
    mes "• Buff you automatically";
    mes "• Stay out of combat";
    next;
    menu "Hire Smart Healer (100k/hour)", L_HEALER,
         "Hire Smart Buffer (80k/hour)", L_BUFFER,
         "Cancel", -;
    close;

L_HEALER:
    if (Zeny < 100000) { mes "Not enough Zeny."; close; }
    Zeny -= 100000;
    mercenary_create 6037, 3600000;  // 1 hour
    mes "Your healer will keep you alive!";
    close;
}
```

---

## 3. Support Class Solo Viability

### 1. Free Daily DPS Mercenaries for Support Classes
Priests, Bards, and Dancers receive 3 free daily 1-hour mercenary scrolls (Lancer/Bowman) on login:
```c
OnPCJobChangeEvent:
    switch(Class) {
        case Job_Priest:
        case Job_High_Priest:
        case Job_Arch_Bishop:
        case Job_Bard:
        case Job_Clown:
        case Job_Minstrel:
        case Job_Dancer:
        case Job_Gypsy:
        case Job_Wanderer:
            if (#support_class_merc_today < 3) {
                getitem Lancer_Scroll_10, 1;
                #support_class_merc_today++;
            }
            break;
    }
```

### 2. Solo Damage Amplification
When playing solo (`getpartysize() <= 1`):
- **Priest / Arch Bishop:** `bMatkRate +300%` (Holy Light becomes viable for solo farming).
- **Bard / Dancer:** `bAtkRate +200%` (Arrow Vulcan / basic attacks viable solo).

### 3. Dedicated Support EXP Quests
Support classes can earn EXP through support activities:
| Quest Type | Task | Reward |
|:---|:---|:---|
| **Hospital Healing** | Heal wounded NPC patients in Prontera Hospital | 5% Level EXP |
| **Blessing Runs** | Buff 50 wandering town NPCs | 3% Level EXP |
| **Resurrection** | Revive fallen adventurer NPCs in dungeons | 10% Level EXP |
| **Monster Research** | Analyze (non-lethal) 20 monsters | 5% Level EXP |

### 4. Support-to-Damage Custom Gear
- **Offensive Rosary:** Converts `Heal` cast on monsters to holy damage.
- **Warrior's Mace:** +500% damage when wielded by Acolyte/Priest jobs.

---

## 4. Resource Sustainability (Rebalanced)

> [!WARNING]  
> Free 100% passive regen kills potions and renders Healers useless. Our balanced model maintains potion markets and healer prestige.

### Rebalanced Sustain Model
1. **No Passive HP/SP Regen Multiplier:** Standing regen remains vanilla (slow). Sitting bonus remains 2x.
2. **Kill Recovery (Flat, Not %):**
   - Weak Mob (\(<\text{Lv } 50\)): **+50 HP / +10 SP**
   - Mid Mob (\(\text{Lv } 50\text{--}99\)): **+100 HP / +20 SP**
   - Strong Mob (\(100+\)): **+150 HP / +30 SP**
   - Mini-Boss: **+500 HP / +100 SP**
   - MvP: **+1000 HP + Full SP restore**
3. **Potion NPC Prices:** Maintained at standard vanilla NPC rates (Red 50z, Orange 200z, Yellow 550z, White 1200z, Blue 5000z) to preserve economy and Alchemist crafting.
4. **Emergency Kit Skill:** 30-minute cooldown quest skill; restores 50% HP/SP. Mutually exclusive with Yggdrasil Berries.
5. **Town Rest Spots:** Sitting at designated benches/inns grants +50% regen boost (total 3x), non-abusable near warp portals.

---

## 5. Monster Spawn Rates & Tuning (Solo-Centric)

### Map Density & Respawns
| Map Type | Default Density | Solo Adjustment | Respawn Delays |
|:---|:---|:---|:---|
| **Leveling Fields** (Prontera, Payon) | 30–50 mobs | **50–70 mobs (+50%)** | 3–10 sec (-30%) |
| **Dungeons** (Culvert, Orc Dungeon) | 50–80 mobs | **70–100 mobs (+30%)** | 5–15 sec |
| **Endgame Maps** | 60–100 mobs | Default (Preserve challenge) | Default |
| **MvP & Rare Bosses** | Vanilla | Vanilla (Scarcity = Prestige) | Vanilla |

### Spawn Distribution: Zone-Based Coordinates
To prevent mobs getting trapped in corners or unpathable map edges, spawns use coordinate boxes:
```c
// Bounded rectangle spawn avoiding outer 20 cells
prt_fild08,20,20,280,280	monster	Poring	1002,50,3000,0,0
```

---

## 6. Micro-Level Solo Quality of Life

| System | Vanilla | Solo Server Adjustment | Rationale |
|:---|:---|:---|:---|
| **Death Penalty** | 1% Base EXP loss | **0.5% Base EXP loss** (0% Job) | Solo has no instant res; less punishing |
| **Card Drop Rates** | 0.01% (1/10,000) | **0.02% (1/5,000)** | Cuts solo card grind from 50h to 25h; MvP cards remain 1x |
| **Storage Capacity** | 600 slots | **800 slots** | Solo players hoard materials for multiple crafting trees |
| **Shared Storage** | Standard Kafra | **Full Account Storage Enabled** | Seamless item transfer across alts |
| **Kafra Warp Fee** | Full price | **50% Discount** | Solo players bear 100% of travel costs |
| **Wings Availability** | Consumable | Cheap Butterfly (500z) & Fly Wings (50z) | High mobility without `@go` immersion breaks |
| **Instance Cooldowns**| 24 hours | **18 hours** | Flexible daily schedule across shifting player hours |
| **Refine Safety** | Fail = break | **Insurance system & Blacksmith Blessings** | Prevents devastating gear loss for solo players |

---

## 7. Early Game Bootstrap (Starter Kit System)

New characters receive a one-time starter package on first login to eliminate empty-handed frustration:

```c
OnPCLoginEvent:
    if (getcharid(0) == 1 && #STARTER_KIT == 0) {
        #STARTER_KIT = 1;
        
        getitem 501, 50;    // Red Potion x50
        getitem 602, 10;    // Butterfly Wing x10
        getitem 601, 20;    // Fly Wing x20
        getitem 517, 30;    // Meat x30
        getitem 7029, 1;    // Pocket Watch
        Zeny += 5000;
        
        // Novice class weapon grant
        if (Class == Job_Swordman) getitem 1108, 1;  // Blade
        if (Class == Job_Mage) getitem 1601, 1;      // Rod
        if (Class == Job_Archer) getitem 1704, 1;    // Crossbow
        
        announce "Welcome! You received a Starter Kit.", bc_self;
    }
    end;
```

### Early Game Flow Math
```
Level 1-10 Sustain:
├── Starter Kit (50 Red Potions, 5000z, Food)
├── Kill Recovery (+50 HP / +10 SP per kill)
├── Early drops (Jellopy, Feathers, Clover) sold to NPC (~7,000z)
└── By Level 10: Player is 100% financially self-sustaining
```
