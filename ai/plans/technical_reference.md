# Technical Reference & Scripting Audits

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!IMPORTANT]  
> All custom solo features are designed to function strictly through NPC scripts, configuration files, and custom SQL migrations without core C++ source modification.

---

## 1. Script-Only Verification Audit

### Feature Implementation Matrix
| Feature | Implementation Method | Script-Only? |
|:---|:---|:---|
| **Living World NPCs** | NPC scripts with `OnTimer` / `OnClock` | ✅ Yes |
| **Wandering Merchants** | Duplicate NPCs + `enablenpc` / `disablenpc` | ✅ Yes |
| **Salvage System** | NPC script checking item IDs and granting materials | ✅ Yes |
| **Money Sinks** | Custom NPC shops with high Zeny costs | ✅ Yes |
| **Trade Quotas** | Account variable tracking (`#var`) | ✅ Yes |
| **Quest Premium Items** | Quest scripts with bound item rewards | ✅ Yes |
| **Support Mercenaries** | `mercenary_create` command | ✅ Yes |
| **Buff Scrolls** | Item scripts with `sc_start` | ✅ Yes |
| **Kill Recovery** | `OnNPCKillEvent` + `heal` | ✅ Yes |
| **Solo EXP Bonus** | `OnNPCKillEvent` + `getexp` | ✅ Yes |
| **MvP Solo Instance** | `instance_create` + runtime user check | ✅ Yes |
| **Gear Quality Prefix** | Name prefixes in `item_db.conf` / scripts | ✅ Yes (DB/Script) |
| **Transcend System** | Variable tracking + bonus scripts | ✅ Yes |
| **4th Class Respec** | NPC with `resetstatus` / `resetskill` | ✅ Yes |
| **Starter Kit** | `OnPCLoginEvent` + item check | ✅ Yes |

### Config-Only Features (No Script or Source Needed)
| Feature | Configuration File | Key Parameters |
|:---|:---|:---|
| **EXP Rates** | `conf/battle/exp.conf` | `base_exp_rate`, `job_exp_rate` |
| **Death Penalty** | `conf/battle/exp.conf` | `death_penalty_type`, `death_penalty_base` |
| **Drop Rates** | `conf/battle/drops.conf` | `item_rate_common`, `item_rate_card` |
| **Storage Slots** | `conf/char_athena.conf` | `max_storage` |
| **Dual Client** | `conf/subnet_athena.conf` | Allow 2 connections per IP |
| **Instance Cooldown** | `db/instance_db.yml` | `delay` field per instance |
| **Spawn Rates** | `npc/mob_spawn.txt` | Mob count and respawn delay timers |

### Workarounds for Source-Bound Mechanics
| Feature | Vanilla Limitation | Script-Only Workaround |
|:---|:---|:---|
| **Instance Scaling (HP/DMG)** | Dynamic mob stats require source modification | Spawn party-scaled clone mob IDs (e.g. `Baphomet_Solo`, `Baphomet_Duo`) |
| **Pet Auto-Loot** | Client-side pickup automation | Usable pet companion script or standard `@autoloot` |

---

## 2. Technical Appendices

### Appendix A: Wandering NPC System
Uses duplicate NPCs across towns toggled via `OnClock` triggers:

```c
// File: npc/custom/wandering_marcus.txt
// Monday, Wednesday, Friday: Prontera
prontera,155,180,4	script	Marcus the Merchant	4_M_03,{
    mes "[Marcus]";
    mes "Fresh goods from Payon! Take a look!";
    next;
    callshop "marcus_shop", 1;
    end;

OnClock0800:
    if (gettime(DT_DAYOFWEEK) == MONDAY || gettime(DT_DAYOFWEEK) == WEDNESDAY || gettime(DT_DAYOFWEEK) == FRIDAY) {
        enablenpc "Marcus the Merchant";
        announce "A traveling merchant has arrived in Prontera!", bc_all, 0x00FF00;
    }
    end;

OnClock1100:
    if (gettime(DT_DAYOFWEEK) == MONDAY || gettime(DT_DAYOFWEEK) == WEDNESDAY || gettime(DT_DAYOFWEEK) == FRIDAY) {
        disablenpc "Marcus the Merchant";
        announce "The traveling merchant has departed from Prontera.", bc_all, 0xFFFF00;
    }
    end;

OnInit:
    disablenpc "Marcus the Merchant";
    end;
}
```

### Appendix B: Ambient Life Layer (Town Crier)
```c
prontera,150,175,4	script	Town Crier	4_M_MINISTER,{
    mes "[Town Crier]";
    mes "Hear ye! Welcome to Prontera!";
    mes "Today's news:";
    next;
    .@news = rand(1, 5);
    switch(.@news) {
        case 1: mes "A merchant caravan arrived from Morroc!"; break;
        case 2: mes "Wolves have been spotted near the south gate!"; break;
        case 3: mes "The weather looks clear today."; break;
        case 4: mes "Adventurers report increased Poring activity."; break;
        case 5: mes "The King sends his regards to all citizens."; break;
    }
    close;

OnMinute30:
    announce "[Town Crier] " + callfunc("GetRandomNews"), bc_map, 0xFFFFAA;
    end;
}
```

### Appendix C: Summoned Helpers (Mercenaries & Buff Simulation)
```c
// Mercenary invocation
mercenary_create 6017, 1800000;  // 30 min Tank Mercenary

// Alternative: Buff-based simulation
sc_start SC_DEFENDER, 1800000, 5;
sc_start SC_AUTOGUARD, 1800000, 10;
sc_start SC_INCMHP, 1800000, 30;
```

### Appendix D: Trade Quota System
```c
// Quota reset check using day of year
if (#last_trade_date != gettime(DT_DAYOFYEAR)) {
    #elunium_sold_today = 0;
    #oridecon_sold_today = 0;
    #last_trade_date = gettime(DT_DAYOFYEAR);
}
```

---

## 3. Future Roadmap: External Web Admin Panel

### Purpose & Architecture
Monitor live server metrics, player economy distribution, and municipal stock trends via an external dashboard.

| Layer | Recommended Stack |
|:---|:---|
| **Frontend** | React / Vite + Tailwind CSS / shadcn/ui |
| **Backend** | Bun + Elysia.js (Decoupled Web Server) |
| **Database** | MariaDB Read-Replica (Port 3307) for analytics; Primary (Port 3306) for mutations |

### Target Metrics & Dashboards
- **Player Tracking:** Real-time online headcount, class distribution, level percentiles.
- **Economic Velocity:** Total Zeny in circulation, investment bank aggregate deposits (`#INVEST_BALANCE`), dividend harvests.
- **Stock Market Trends:** 30-day municipal price charts, active black swan mood modifiers.
