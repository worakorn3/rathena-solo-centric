# Immersion, Encyclopedia & Extra Systems Specification

🔗 **Backlink:** [Main Implementation Plan](../implementation_plan.md)

> [!IMPORTANT]  
> To preserve true MMORPG atmosphere and immersion, **no `@commands` are allowed for players**. All information queries, utilities, and diagnostics are integrated directly into in-game world lore, NPCs, and physical tools.

---

## 1. Immersive Alternatives (No @Commands Policy)

| Traditional `@command` | Immersive In-World Replacement | Implementation Mechanism |
|:---|:---|:---|
| `@whodrops` / `@mobinfo` | **Monster Librarian NPC** | Physical library in Prontera/Payon; kill unlock or Zeny fee |
| `@time` | **Pocket Watch Item** & Town Bells | Item ID `7029` usable + automated server-wide time announcements |
| `@rates` | **Town Notice Boards** | Interactive wooden bulletin board in central town squares |
| `@storage` | **Kafra Service Staff** | Physical Kafra locations |
| `@go` / `@warp` | **Kafra Teleport / Fly Wings** | In-world travel logistics |
| `@iteminfo` | **Item Appraiser NPC** | Blacksmith Guild appraiser revealing hidden item stats |
| `@autoloot` | **Companion Pet Looting** | Companion pets retrieve loot within 2 cells (Greed skill remains superior) |

---

## 2. Monster Intel System (Librarian NPC)

A hybrid unlock system rewarding both exploration/hunting and financial investment:

```c
prontera,155,180,4	script	Monster Librarian	4_F_SCHOLAR,{
    mes "[Monster Encyclopedia]";
    mes "Search our archives by monster name:";
    input .@query$;
    
    .@mob_id = mobid(.@query$);
    if (.@mob_id <= 0) { mes "No record found for '" + .@query$ + "'."; close; }
    
    .@kills = readparam(getd("#MOB_" + .@mob_id + "_KILLS"));
    
    if (.@kills >= 100) {
        callfunc "ShowFullInfo", .@mob_id;
    } else if (.@kills >= 10) {
        callfunc "ShowBasicInfo", .@mob_id;
    } else {
        mes "You haven't studied this monster yet (Kills: " + .@kills + "/10).";
        mes "Pay research fees to access archives now?";
        next;
        switch(select("Pay 10,000z (Basic Info):Pay 50,000z (Full Drops & Rates):Leave")) {
        case 1:
            if (Zeny < 10000) { mes "Insufficient Zeny."; close; }
            Zeny -= 10000;
            callfunc "ShowBasicInfo", .@mob_id;
            break;
        case 2:
            if (Zeny < 50000) { mes "Insufficient Zeny."; close; }
            Zeny -= 50000;
            callfunc "ShowFullInfo", .@mob_id;
            break;
        case 3:
            close;
        }
    }
    close;
}
```

---

## 3. Server Time & Environmental Announcements

### Pocket Watch Item (`item_db.yml` / Script)
```c
7029,Pocket_Watch,Pocket Watch,2,1000,500,10,,,,,,,,,,,{
    .@hour = gettime(3);
    .@min = gettime(2);
    mes "[Pocket Watch]";
    mes "Current Midgard Time: " + .@hour + ":" + (.@min < 10 ? "0" : "") + .@min;
    close;
},{}
```

### Server Bell Announcer
```c
-	script	TimeAnnouncer	FAKE_NPC,{
OnClock0000: announce "[Midnight] The clock strikes 12. Shadows lengthen across Midgard...", bc_all; end;
OnClock0600: announce "[Dawn] The sun rises over Prontera. A new day begins.", bc_all; end;
OnClock1200: announce "[Noon] The sun reaches its zenith.", bc_all; end;
OnClock1800: announce "[Dusk] The sun dips below the horizon. Torches are lit in town.", bc_all; end;
}
```

---

## 4. System Encyclopedia NPC

Located in every major capital next to the spawn point, providing an exhaustive guide without replacing feature NPCs:

```
[Server Encyclopedia]
├── 1. New Player Guide (Starter kit, controls, early leveling)
├── 2. Server Rules (Conduct, trade quotas, dual-client policy)
├── 3. Event Calendar (Current & upcoming seasonal events)
├── 4. Custom Solo Systems
│   ├── Solo Scaling & Instance difficulty
│   ├── Banking & Investment rules
│   ├── Midgard Stock Exchange & 27 Municipalities
│   ├── Bill Notes & 17-Carat Diamonds
│   ├── Trait System & Level 200+ progression
│   └── Daily Junk Sinks & Login Rewards
└── 5. About Photonic Singularity (Philosophy & credits)
```

---

## 5. Extra Solo-Adapted Game Systems

### Solo Castle Rush (GvG / WoE Adaptation)
- **Concept:** Enter an instanced castle alone or with 2 companions to assault waves of AI defenders and destroy the Emperium for guild rewards and weekly chests.

### AI Teammate Battlegrounds
- Queue solo for Battlegrounds (Tierra, Flavius) and receive coordinated NPC combat allies.

### Forgiving Crafting, Alchemy & Cooking
- **Demonstration / Acid Bombs:** Double yield on successful craft (1 craft \(\to\) 2 bombs) to compensate for rare materials.
- **Potions:** +20% base success rate for Alchemists.
- **Cooking Foods:** +30% success rate, 60-minute duration (up from 30 min).

### Personal Room & NPC Servants (Housing)
- Instanced private housing quarters where players can hire decorative servant NPCs and display trophy headgears.

### Sage Elemental Endow Scrolls
- Sages can craft tradeable Endow Scrolls (10/day) to sell to other solo players or buy via NPCs at 5,000z, preserving Sage class utility.

### Endless Tower Solo Checkpoints
- Floors 26–100 scale HP down (50% to 30%), with saved progression checkpoints every 25 floors.
