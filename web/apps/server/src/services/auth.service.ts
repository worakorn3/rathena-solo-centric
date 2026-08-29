import crypto from "crypto";
import { queryOne, primaryExecute } from "../db/pool";
import { AuthUser, LoginPayload, RegisterPayload } from "@rathena/shared";

interface LoginRow {
  account_id: number;
  userid: string;
  user_pass: string;
  sex: "M" | "F";
  email: string;
  group_id: number;
  lastlogin: string | null;
  logincount: number;
  state: number;
}

export class AuthService {
  static async login(payload: LoginPayload): Promise<{ user: AuthUser } | { error: string }> {
    const { userid, user_pass } = payload;
    if (!userid || !user_pass) {
      return { error: "Username and password are required" };
    }

    const row = await queryOne<LoginRow>(
      "SELECT account_id, userid, user_pass, sex, email, group_id, lastlogin, logincount, state FROM `login` WHERE userid = ? LIMIT 1",
      [userid]
    );

    if (!row) {
      return { error: "Invalid username or password" };
    }

    if (row.state !== 0) {
      return { error: "Account is blocked or banned" };
    }

    const inputMd5 = crypto.createHash("md5").update(user_pass).digest("hex");
    const isPlainMatch = row.user_pass === user_pass;
    const isMd5Match = row.user_pass.toLowerCase() === inputMd5.toLowerCase();

    if (!isPlainMatch && !isMd5Match) {
      return { error: "Invalid username or password" };
    }

    const groupId = Number(row.group_id) || 0;
    const role = groupId === 99 ? "ADMIN" : groupId >= 1 ? "GM" : "PLAYER";

    const user: AuthUser = {
      accountId: row.account_id,
      userid: row.userid,
      email: row.email || "",
      sex: row.sex || "M",
      groupId,
      role,
      lastLogin: row.lastlogin ? new Date(row.lastlogin).toISOString() : new Date().toISOString(),
      logincount: row.logincount || 0,
    };

    return { user };
  }

  static async register(payload: RegisterPayload): Promise<{ user: AuthUser } | { error: string }> {
    const { userid, user_pass, confirm_pass, email, sex } = payload;
    const trimmedUser = userid ? userid.trim() : "";
    const trimmedEmail = email ? email.trim() : "";

    if (!trimmedUser || !user_pass) {
      return { error: "Username and password are required" };
    }

    if (trimmedUser.length < 4 || trimmedUser.length > 23) {
      return { error: "Username must be between 4 and 23 characters" };
    }

    const userRegex = /^[a-zA-Z0-9_]+$/;
    if (!userRegex.test(trimmedUser)) {
      return { error: "Username can only contain letters, numbers, and underscores" };
    }

    if (user_pass.length < 6 || user_pass.length > 32) {
      return { error: "Password must be between 6 and 32 characters" };
    }

    if (confirm_pass !== undefined && confirm_pass !== user_pass) {
      return { error: "Passwords do not match" };
    }

    if (sex !== "M" && sex !== "F") {
      return { error: "Invalid gender selection" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      return { error: "Invalid email format" };
    }

    // Check if username already exists
    const existing = await queryOne<LoginRow>(
      "SELECT account_id FROM `login` WHERE userid = ? LIMIT 1",
      [trimmedUser]
    );

    if (existing) {
      return { error: "Username is already taken" };
    }

    // Hash password with MD5
    const md5Pass = crypto.createHash("md5").update(user_pass).digest("hex");

    // Insert into login table using primaryExecute (:3306)
    const result = await primaryExecute(
      "INSERT INTO `login` (`userid`, `user_pass`, `sex`, `email`, `group_id`, `state`, `character_slots`, `lastlogin`) VALUES (?, ?, ?, ?, 0, 0, 9, NOW())",
      [trimmedUser, md5Pass, sex, trimmedEmail || ""]
    );

    const newAccountId = result.insertId;
    if (!newAccountId) {
      return { error: "Failed to create account" };
    }

    // Seed initial citizen starter MS500 ETF shares (500 shares, DRIP enabled)
    try {
      await primaryExecute(
        "INSERT INTO `solo_stock_player` (`account_id`, `ticker`, `shares`, `total_cost`, `pending_div`, `drip_enabled`, `drip_carryover`) VALUES (?, 'MS500', 500, 0, 0, 1, 0)",
        [newAccountId]
      );
    } catch (e) {
      console.warn("[AuthService] Failed to seed initial MS500 ETF grant for account:", newAccountId, e);
    }

    const user: AuthUser = {
      accountId: newAccountId,
      userid: trimmedUser,
      email: trimmedEmail || "",
      sex: sex || "M",
      groupId: 0,
      role: "PLAYER",
      lastLogin: new Date().toISOString(),
      logincount: 0,
    };

    return { user };
  }

  static async getAccountById(accountId: number): Promise<AuthUser | null> {
    const row = await queryOne<LoginRow>(
      "SELECT account_id, userid, user_pass, sex, email, group_id, lastlogin, logincount, state FROM `login` WHERE account_id = ? LIMIT 1",
      [accountId]
    );

    if (!row) return null;

    const groupId = Number(row.group_id) || 0;
    const role = groupId === 99 ? "ADMIN" : groupId >= 1 ? "GM" : "PLAYER";

    return {
      accountId: row.account_id,
      userid: row.userid,
      email: row.email || "",
      sex: row.sex || "M",
      groupId,
      role,
      lastLogin: row.lastlogin ? new Date(row.lastlogin).toISOString() : new Date().toISOString(),
      logincount: row.logincount || 0,
    };
  }
}
