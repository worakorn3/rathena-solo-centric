## Solo-Centric Features
This fork includes several modifications to enhance the experience for individual players:
- **EXP Scaling:** Native 5x EXP/Job EXP boost automatically applied at Level 30+ (managed via `npc/custom/solo_mechanics.txt`).
- **Auto-Heal on Kill:** Players receive HP/SP restoration upon defeating monsters, scaling with monster difficulty.
- **System Tablet:** A custom in-game utility (`npc/custom/system_tablet.txt`) providing:
    - Progression guides and global enhancement summaries.
    - **Monster Intel App:** Unlockable monster database for Zeny.
    - **Market Pulse App:** Economic sentiment and yield recommendations.
- **Quality of Life:**
    - Storage capacity increased to **800 slots** (`src/common/mmo.hpp`).
    - Card drop rates are flat 2x (excluding MvPs).
    - Kafra warp fees reduced by 50%.
    - Death penalty reduced to 0.5%.
