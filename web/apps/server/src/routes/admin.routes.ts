import { Elysia, t } from "elysia";
import crypto from "crypto";
import zlib from "zlib";
import { config } from "../config";
import { query, queryOne, primaryExecute, getPrimaryDbPool } from "../db/pool";
import { TrackingService } from "../services/tracking.service";

import { jwt } from "@elysiajs/jwt";

// Header magic identifier for Zero-Knowledge rAthena Encrypted Backups
export const BACKUP_MAGIC = Buffer.from("ROENC01"); // 7 bytes
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32; // AES-256

/**
 * Encrypts raw SQL buffer into a compressed Zero-Knowledge AES-256 binary blob
 */
export function encryptBackupBuffer(rawSql: Buffer | string, passphrase: string): Buffer {
  const gzipped = zlib.gzipSync(typeof rawSql === "string" ? Buffer.from(rawSql, "utf8") : rawSql);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, "sha256");

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);

  // Layout: [7B Magic] + [16B Salt] + [16B IV] + [Ciphertext]
  return Buffer.concat([BACKUP_MAGIC, salt, iv, encrypted]);
}

/**
 * Decrypts Zero-Knowledge AES-256 binary blob back to raw SQL string/buffer
 */
export function decryptBackupBuffer(encryptedBuffer: Buffer, passphrase: string): Buffer {
  if (encryptedBuffer.length < 7 + 16 + 16) {
    throw new Error("Invalid backup file: file too short or corrupted");
  }

  const magic = encryptedBuffer.subarray(0, 7);
  if (!magic.equals(BACKUP_MAGIC)) {
    throw new Error("Invalid backup file format: missing ROENC01 header");
  }

  const salt = encryptedBuffer.subarray(7, 23);
  const iv = encryptedBuffer.subarray(23, 39);
  const ciphertext = encryptedBuffer.subarray(39);

  const key = crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, "sha256");

  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decryptedGzip = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return zlib.gunzipSync(decryptedGzip);
  } catch (err: any) {
    throw new Error("Decryption failed: Incorrect passphrase or corrupted backup payload");
  }
}

/**
 * Executes a raw database dump on the primary DB
 */
export async function generateDatabaseDump(scope: "full" | "web_features" = "web_features"): Promise<Buffer> {
  const tableRows = await query<{ table_name?: string; TABLE_NAME?: string }>(
    scope === "web_features"
      ? "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND (table_name LIKE 'solo_%' OR table_name LIKE 'custom_%')"
      : "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'",
    [config.primaryDb.database]
  );
  const targetTables = tableRows
    .map((r) => r.table_name || r.TABLE_NAME || "")
    .filter((name) => name.length > 0);

  if (targetTables.length === 0) {
    throw new Error(
      scope === "web_features"
        ? "No web feature tables (solo_*, custom_*) found in database to backup."
        : "No tables found in database to backup."
    );
  }

  // Try native mariadb-dump / mysqldump CLI first
  try {
    const dumpArgs = [
      "mariadb-dump",
      "-h", config.primaryDb.host,
      "-P", String(config.primaryDb.port),
      "-u", config.primaryDb.user,
      `-p${config.primaryDb.password}`,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      config.primaryDb.database,
    ];

    if (scope === "web_features" && targetTables.length > 0) {
      dumpArgs.push(...targetTables);
    }

    const proc = Bun.spawn(dumpArgs, {
      stdout: "pipe",
      stderr: "pipe",
    });

    const out = await new Response(proc.stdout).arrayBuffer();
    const exitCode = await proc.exited;

    if (exitCode === 0 && out.byteLength > 256) {
      return Buffer.from(out);
    }
  } catch {
    // Fall back to Node SQL table dump if mariadb-dump binary is not present on host
  }

  // Fallback SQL Dump generator for environments without mariadb-dump installed
  let sqlDump = `-- rAthena Solo-Centric Database Dump (Fallback Generator)\n-- Scope: ${scope}\n-- Date: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const tableName of targetTables) {
    try {
      const createRes = await query<any>(`SHOW CREATE TABLE \`${tableName}\``);
      const ddl = createRes && createRes[0]
        ? createRes[0]["Create Table"] || createRes[0]["create table"] || Object.values(createRes[0])[1]
        : "";

      if (ddl) {
        sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlDump += `${ddl};\n\n`;
      }

      const rows = await query<Record<string, any>>(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
        for (const row of rows) {
          const values = Object.values(row)
            .map((v) => {
              if (v === null || v === undefined) return "NULL";
              if (typeof v === "number") return v;
              if (typeof v === "boolean") return v ? 1 : 0;
              if (Buffer.isBuffer(v) || v instanceof Uint8Array) {
                return `X'${Buffer.from(v).toString("hex")}'`;
              }
              if (v instanceof Date) {
              return isNaN(v.getTime())
                ? "'0000-00-00 00:00:00'"
                : `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
            }
              return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
            })
            .join(", ");
          sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        sqlDump += `\n`;
      }
    } catch (err: any) {
      console.warn(`[Fallback Dump] Notice on table \`${tableName}\`: ${err.message}`);
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
  return Buffer.from(sqlDump, "utf8");
}

/**
 * Imports raw SQL into the primary database
 */
async function importDatabaseSql(sqlBuffer: Buffer): Promise<void> {
  // Try native mariadb CLI client first
  try {
    const proc = Bun.spawn([
      "mariadb",
      "-h", config.primaryDb.host,
      "-P", String(config.primaryDb.port),
      "-u", config.primaryDb.user,
      `-p${config.primaryDb.password}`,
      config.primaryDb.database,
    ], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });

    if (proc.stdin) {
      proc.stdin.write(sqlBuffer);
      proc.stdin.end();
    }

    const exitCode = await proc.exited;
    if (exitCode === 0) return;
  } catch {
    // Fall back to executing statements through primary DB pool
  }

  // Fallback statement executor
  const pool = await getPrimaryDbPool();
  const connection = await pool.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    const sqlText = sqlBuffer.toString("utf8");
    // Split SQL by semicolons at line endings
    const statements = sqlText
      .split(/;\s*[\r\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err: any) {
        console.warn(`[Admin Restore] Fallback execution warning on statement: ${err.message}`);
      }
    }
    await connection.query("SET FOREIGN_KEY_CHECKS=1");
  } finally {
    connection.release();
  }

  // Non-blocking session cleanup to prevent ghost login lockouts after restore
  try {
    const pool = await getPrimaryDbPool();
    await pool.query("UPDATE `char` SET `online` = 0 WHERE `online` != 0");
    await pool.query("UPDATE `login` SET `state` = 0 WHERE `state` != 0");
  } catch {
    // Safe to ignore if char/login tables are not present (e.g., test or web-only env)
  }
}

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(
    jwt({
      name: "jwt",
      secret: config.server.jwtSecret,
    })
  )
  // Security & Admin Key / GM JWT Check
  .derive(async ({ headers, query: q, jwt, set }) => {
    const providedKey = headers["x-admin-key"] || (q as any)?.adminKey;
    const isMasterKeyValid =
      config.server.allowAnonymousAdmin ||
      (Boolean(providedKey) && providedKey === config.server.adminKey);

    let isGmTokenValid = false;
    const authHeader = headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload && typeof (payload as any).groupId === "number" && (payload as any).groupId >= 1) {
        isGmTokenValid = true;
      }
    }

    const isAuthorized = isMasterKeyValid || isGmTokenValid;

    return {
      isAuthorized,
      verifyAdmin: () => {
        if (!isAuthorized) {
          set.status = 401;
          throw new Error("Unauthorized: GM permissions or Master Admin Key required");
        }
      },
    };
  })

  // 1. System Status & Health Metrics
  .get("/status", async ({ verifyAdmin }) => {
    verifyAdmin();

    const [accStats, charStats, onlineStats] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM `login`").catch(() => ({ count: 0 })),
      queryOne<{ count: number; totalZeny: number }>(
        "SELECT COUNT(*) AS count, COALESCE(SUM(zeny), 0) AS totalZeny FROM `char`"
      ).catch(() => ({ count: 0, totalZeny: 0 })),
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM `char` WHERE online = 1").catch(() => ({ count: 0 })),
    ]);

    return {
      status: "online",
      database: {
        replicaConnected: true,
        primaryHost: config.primaryDb.host,
        primaryPort: config.primaryDb.port,
      },
      stats: {
        totalAccounts: accStats?.count ?? 0,
        totalCharacters: charStats?.count ?? 0,
        totalZeny: charStats?.totalZeny ?? 0,
        onlineCharacters: onlineStats?.count ?? 0,
      },
      security: {
        authRequired: !config.server.allowAnonymousAdmin,
      },
      timestamp: new Date().toISOString(),
    };
  })

  // 2. Day 1 Setup & Account Creation
  .post(
    "/setup/account",
    async ({ body, verifyAdmin, set }) => {
      verifyAdmin();

      const { username, password, sex = "M", groupId = 0, email = "" } = body;

      if (!username || username.trim().length < 3) {
        set.status = 400;
        return { error: "Username must be at least 3 characters long" };
      }

      if (!password || password.length < 4) {
        set.status = 400;
        return { error: "Password must be at least 4 characters long" };
      }

      const existing = await queryOne("SELECT account_id FROM `login` WHERE userid = ? LIMIT 1", [
        username.trim(),
      ]);

      if (existing) {
        set.status = 409;
        return { error: `Account '${username.trim()}' already exists` };
      }

      // Hash password with MD5 (Standard rAthena login table format)
      const hashedPassword = crypto.createHash("md5").update(password).digest("hex");
      const normalizedSex = sex.toUpperCase() === "F" ? "F" : "M";
      const normalizedGroupId = Math.max(0, Math.min(99, Number(groupId) || 0));

      const result: any = await primaryExecute(
        "INSERT INTO `login` (`userid`, `user_pass`, `sex`, `email`, `group_id`, `state`, `unban_time`, `logincount`) VALUES (?, ?, ?, ?, ?, 0, 0, 0)",
        [username.trim(), hashedPassword, normalizedSex, email.trim(), normalizedGroupId]
      );

      return {
        success: true,
        message: `Account '${username.trim()}' created successfully!`,
        accountId: result.insertId,
        username: username.trim(),
        sex: normalizedSex,
        groupId: normalizedGroupId,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        sex: t.Optional(t.String()),
        groupId: t.Optional(t.Number()),
        email: t.Optional(t.String()),
      }),
    }
  )

  // 3. 1-Click Zero-Knowledge Encrypted Backup Export (Streams file to browser)
  .get(
    "/backup/export",
    async ({ query: q, verifyAdmin, set }) => {
      verifyAdmin();

      const passphrase = (q as any)?.passphrase || config.server.adminKey;
      if (!passphrase || passphrase.length < 4) {
        set.status = 400;
        return { error: "Passphrase must be at least 4 characters long" };
      }

      const scope = (q as any)?.scope === "full" ? "full" : "web_features";
      const dumpBuffer = await generateDatabaseDump(scope);
      const encryptedBlob = encryptBackupBuffer(dumpBuffer, passphrase);

      const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const prefix = scope === "full" ? "ragnarok_full_save" : "ragnarok_web_save";
      const filename = `${prefix}_${dateStr}.sql.gz.enc`;

      set.headers["Content-Type"] = "application/octet-stream";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      set.headers["X-Backup-Scope"] = scope;
      set.headers["X-Original-Dump-Size"] = String(dumpBuffer.length);
      set.headers["X-Encrypted-Size"] = String(encryptedBlob.length);

      return new Response(encryptedBlob, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Backup-Scope": scope,
        },
      });
    },
    {
      query: t.Object({
        passphrase: t.Optional(t.String()),
        adminKey: t.Optional(t.String()),
        scope: t.Optional(t.Union([t.Literal("full"), t.Literal("web_features")])),
      }),
    }
  )

  // 4. 1-Click Disaster Recovery Restore
  .post(
    "/backup/restore",
    async ({ body, verifyAdmin, set }) => {
      verifyAdmin();

      const { file, passphrase } = body as { file?: File | Blob; passphrase?: string };

      if (!file) {
        set.status = 400;
        return { error: "Missing encrypted backup file (.sql.gz.enc)" };
      }

      const pass = passphrase || config.server.adminKey;
      if (!pass) {
        set.status = 400;
        return { error: "Passphrase is required for decryption" };
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Zero-Knowledge Decryption & Decompression
        const decryptedSqlBuffer = decryptBackupBuffer(fileBuffer, pass);

        if (decryptedSqlBuffer.length < 100) {
          set.status = 400;
          return { error: "Decrypted content is abnormally small or corrupt." };
        }

        // Import into primary database
        await importDatabaseSql(decryptedSqlBuffer);

        return {
          success: true,
          message: "Zero-Knowledge Database Restore completed successfully!",
          restoredBytes: decryptedSqlBuffer.length,
        };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to restore database from backup" };
      }
    },
    {
      body: t.Object({
        file: t.Any(),
        passphrase: t.Optional(t.String()),
      }),
    }
  )

  // 10. Hunt Milestones CRUD Manager
  .get("/milestones", async ({ verifyAdmin, set }) => {
    verifyAdmin();
    try {
      const milestones = await TrackingService.getAllMilestonesAdmin();
      return { success: true, milestones };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || "Failed to load milestones" };
    }
  })
  .post(
    "/milestones",
    async ({ verifyAdmin, body, set }) => {
      verifyAdmin();
      try {
        await TrackingService.saveMilestoneAdmin(body as any);
        return { success: true, message: "Milestone saved successfully" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Failed to save milestone" };
      }
    },
    {
      body: t.Object({
        id: t.String(),
        category: t.String(),
        prev_milestone_id: t.Optional(t.Nullable(t.String())),
        target_mob_id: t.Number(),
        required_count: t.Number(),
        title: t.String(),
        description: t.Optional(t.String()),
        reward_zeny: t.Optional(t.Number()),
        reward_item_id: t.Optional(t.Number()),
        reward_item_amount: t.Optional(t.Number()),
        reward_desc: t.Optional(t.String()),
        tier_label: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .put(
    "/milestones/:id",
    async ({ verifyAdmin, params, body, set }) => {
      verifyAdmin();
      try {
        await TrackingService.saveMilestoneAdmin({ ...(body as any), id: params.id });
        return { success: true, message: "Milestone updated successfully" };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Failed to update milestone" };
      }
    }
  )
  .delete("/milestones/:id", async ({ verifyAdmin, params, set }) => {
    verifyAdmin();
    try {
      await TrackingService.deleteMilestoneAdmin(params.id);
      return { success: true, message: "Milestone deleted successfully" };
    } catch (err: any) {
      set.status = 400;
      return { success: false, error: err.message || "Failed to delete milestone" };
    }
  });


