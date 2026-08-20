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

console.log(`Extracting IDs and Names from ${dbPath}...`);

for (const file of files) {
  const filePath = resolve(dbPath, file);
  if (!existsSync(filePath)) {
    console.warn(`[Warn] ${file} not found at ${filePath}`);
    continue;
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  let currentId = 0;
  const isMob = file === "mob_db.yml";
  const targetDict = isMob ? mobNames : itemNames;
  
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
        // Remove quotes if any
        if (name.startsWith("'") && name.endsWith("'")) name = name.slice(1, -1);
        if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
        
        targetDict[currentId] = name;
        currentId = 0; // Reset after finding name
      }
    }
  }
}

const outDir = resolve(webDir, "packages/shared/src/data");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const output = `export const ItemNames: Record<number, string> = ${JSON.stringify(itemNames, null, 2)};\n` +
               `export const MobNames: Record<number, string> = ${JSON.stringify(mobNames, null, 2)};\n`;

writeFileSync(resolve(outDir, "names.ts"), output);
console.log(`Extracted ${Object.keys(itemNames).length} item names and ${Object.keys(mobNames).length} mob names to packages/shared/src/data/names.ts`);
