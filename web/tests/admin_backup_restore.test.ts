import { describe, expect, it } from "bun:test";
import { app } from "../apps/server/src";
import {
  encryptBackupBuffer,
  decryptBackupBuffer,
  BACKUP_MAGIC,
} from "../apps/server/src/routes/admin.routes";

describe("Admin & Zero-Knowledge Backup Suite", () => {
  const testPassphrase = "TestPassphraseSecret2026!";
  const sampleSql = `-- Ragnarok Backup Test
CREATE TABLE IF NOT EXISTS \`test_save\` (\`id\` INT PRIMARY KEY, \`val\` VARCHAR(50));
INSERT INTO \`test_save\` VALUES (1, 'HeroCharacter'), (2, 'SoloCentricProgress');
`;

  // ----------------------------------------------------------------------------
  // 1. Pure Cryptographic Functions (Zero-Knowledge AES-256 + PBKDF2)
  // ----------------------------------------------------------------------------
  describe("Cryptographic Engine (AES-256-CBC + PBKDF2)", () => {
    it("successfully encrypts and decrypts SQL payloads with correct passphrase", () => {
      const encrypted = encryptBackupBuffer(sampleSql, testPassphrase);

      // Verify Magic Header
      expect(encrypted.subarray(0, 7).equals(BACKUP_MAGIC)).toBe(true);
      expect(encrypted.length).toBeGreaterThan(7 + 16 + 16);

      // Decrypt and verify exact SQL match
      const decrypted = decryptBackupBuffer(encrypted, testPassphrase);
      expect(decrypted.toString("utf8")).toBe(sampleSql);
    });

    it("fails decryption when an incorrect passphrase is provided", () => {
      const encrypted = encryptBackupBuffer(sampleSql, testPassphrase);
      expect(() => {
        decryptBackupBuffer(encrypted, "WrongPassword!");
      }).toThrow(/Decryption failed/);
    });

    it("rejects corrupt or tampered binary payloads", () => {
      const corrupt = Buffer.from("NOT_ROENC01_INVALID_HEADER_BLOB_CORRUPT");
      expect(() => {
        decryptBackupBuffer(corrupt, testPassphrase);
      }).toThrow(/missing ROENC01 header/);
    });
  });

  // ----------------------------------------------------------------------------
  // 2. Admin Security Guard & Status Endpoints
  // ----------------------------------------------------------------------------
  describe("Admin Routes Security & Guard", () => {
    it("rejects status request with invalid admin key when authentication is required", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/admin/status", {
          headers: { "x-admin-key": "invalid-secret" },
        })
      );
      expect(res.status).toBe(401);
    });

    it("allows status request when valid admin key is provided", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/admin/status", {
          headers: { "x-admin-key": "SoloCentricKey2026!" },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("online");
      expect(json).toHaveProperty("database");
      expect(json).toHaveProperty("stats");
    });
  });

  // ----------------------------------------------------------------------------
  // 3. Day 1 Account Setup Validation
  // ----------------------------------------------------------------------------
  describe("Day 1 Setup Validation", () => {
    it("rejects account creation with short username", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/admin/setup/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": "SoloCentricKey2026!",
          },
          body: JSON.stringify({
            username: "ab",
            password: "validpassword123",
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("at least 3 characters");
    });

    it("rejects account creation with short password", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/admin/setup/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": "SoloCentricKey2026!",
          },
          body: JSON.stringify({
            username: "validuser",
            password: "123",
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("at least 4 characters");
    });
  });

  // ----------------------------------------------------------------------------
  // 4. Backup & Restore Endpoints
  // ----------------------------------------------------------------------------
  describe("Backup Export & Restore Endpoints", () => {
    it("rejects restore without a backup file", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/admin/backup/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": "SoloCentricKey2026!",
          },
          body: JSON.stringify({
            passphrase: "SecretKey123!",
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing encrypted backup file");
    });
  });
});
