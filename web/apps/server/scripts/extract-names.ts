import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

// Note: Bun executes this file, so __dirname works but we can also use process.cwd() if called from root.
const webDir = resolve(__dirname, "../../..");
const rAthenaPath = resolve(webDir, "..");
const dbPath = resolve(rAthenaPath, "db/re");

const files = [
  "item_db_equip.yml",
  "item_db_etc.yml",
  "item_db_usable.yml",
  "mob_db.yml",
];

const itemNames: Record<number, string> = {};
const mobNames: Record<number, string> = {};
const mobTypes: Record<number, "MVP" | "MINI_BOSS" | "NORMAL"> = {};

console.log(`Extracting IDs, Names, and Mob Types from ${dbPath}...`);

for (const file of files) {
  const filePath = resolve(dbPath, file);
  if (!existsSync(filePath)) {
    console.warn(`[Warn] ${file} not found at ${filePath}`);
    continue;
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  if (file === "mob_db.yml") {
    let currentId = 0;
    let currentName = "";
    let isMvp = false;
    let isBoss = false;

    const commitCurrentMob = () => {
      if (currentId > 0 && currentName) {
        mobNames[currentId] = currentName;
        mobTypes[currentId] = isMvp ? "MVP" : (isBoss ? "MINI_BOSS" : "NORMAL");
      }
      currentId = 0;
      currentName = "";
      isMvp = false;
      isBoss = false;
    };

    for (const line of lines) {
      const idMatch = line.match(/^\s*-\s*Id:\s*(\d+)/);
      if (idMatch) {
        commitCurrentMob();
        currentId = parseInt(idMatch[1], 10);
        continue;
      }

      if (currentId > 0) {
        const nameMatch = line.match(/^\s*Name:\s*(.+)$/);
        if (nameMatch) {
          let name = nameMatch[1].trim();
          if (name.startsWith("'") && name.endsWith("'")) name = name.slice(1, -1);
          if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
          currentName = name;
          continue;
        }

        const mvpExpMatch = line.match(/^\s*MvpExp:\s*(\d+)/);
        if (mvpExpMatch && parseInt(mvpExpMatch[1], 10) > 0) {
          isMvp = true;
          continue;
        }

        if (/^\s*Mvp:\s*true/i.test(line)) {
          isMvp = true;
          continue;
        }

        if (/^\s*Class:\s*Boss/i.test(line) || /^\s*Boss:\s*true/i.test(line)) {
          isBoss = true;
          continue;
        }
      }
    }
    commitCurrentMob();
  } else {
    let currentId = 0;
    for (const line of lines) {
      const idMatch = line.match(/^\s*-\s*Id:\s*(\d+)/);
      if (idMatch) {
        currentId = parseInt(idMatch[1], 10);
        continue;
      }
      
      if (currentId > 0) {
        const nameMatch = line.match(/^\s*Name:\s*(.+)$/);
        if (nameMatch) {
          let name = nameMatch[1].trim();
          if (name.startsWith("'") && name.endsWith("'")) name = name.slice(1, -1);
          if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
          
          itemNames[currentId] = name;
          currentId = 0;
        }
      }
    }
  }
}

const outDir = resolve(webDir, "packages/shared/src/data");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const output = `export type MonsterCategory = "MVP" | "MINI_BOSS" | "NORMAL";\n\n` +
               `export const ItemNames: Record<number, string> = ${JSON.stringify(itemNames, null, 2)};\n\n` +
               `export const MobNames: Record<number, string> = ${JSON.stringify(mobNames, null, 2)};\n\n` +
               `export const MobTypes: Record<number, MonsterCategory> = ${JSON.stringify(mobTypes, null, 2)};\n`;

writeFileSync(resolve(outDir, "names.ts"), output);
console.log(`Extracted ${Object.keys(itemNames).length} item names, ${Object.keys(mobNames).length} mob names and classifications to packages/shared/src/data/names.ts`);

