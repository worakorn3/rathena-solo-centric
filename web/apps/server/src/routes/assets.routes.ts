import { Elysia } from "elysia";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.resolve(__dirname, "../../.cache/assets");

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDir(path.join(CACHE_DIR, "items"));
ensureDir(path.join(CACHE_DIR, "mobs"));

export const assetsRoutes = new Elysia()
  .group("/api/assets", (app) =>
    app
      .get("/item/:id", async ({ params: { id }, set }) => {
        const idNum = parseInt(id, 10);
        if (isNaN(idNum) || idNum <= 0) {
          set.status = 400;
          return "Invalid ID";
        }
        
        const filename = `${idNum}.gif`;
        const filePath = path.join(CACHE_DIR, "items", filename);

        if (fs.existsSync(filePath)) {
          return Bun.file(filePath);
        }

        try {
          const url = `https://file5.ratemyserver.net/items/small/${filename}`;
          const response = await fetch(url);
          if (!response.ok) {
            set.status = response.status;
            return "Asset not found";
          }
          const arrayBuffer = await response.arrayBuffer();
          await Bun.write(filePath, arrayBuffer);
          return Bun.file(filePath);
        } catch (error) {
          set.status = 500;
          return "Error fetching asset";
        }
      })
      .get("/mob/:id", async ({ params: { id }, set }) => {
        const idNum = parseInt(id, 10);
        if (isNaN(idNum) || idNum <= 0) {
          set.status = 400;
          return "Invalid ID";
        }
        
        const filename = `${idNum}.gif`;
        const filePath = path.join(CACHE_DIR, "mobs", filename);

        if (fs.existsSync(filePath)) {
          return Bun.file(filePath);
        }

        try {
          const url = `https://file5.ratemyserver.net/mobs/${filename}`;
          const response = await fetch(url);
          if (!response.ok) {
            set.status = response.status;
            return "Asset not found";
          }
          const arrayBuffer = await response.arrayBuffer();
          await Bun.write(filePath, arrayBuffer);
          return Bun.file(filePath);
        } catch (error) {
          set.status = 500;
          return "Error fetching asset";
        }
      })
  );
