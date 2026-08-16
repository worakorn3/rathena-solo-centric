import crypto from "crypto";
import { queryOne } from "../db/pool";
import { AuthUser, LoginPayload } from "@rathena/shared";

interface LoginRow {
  account_id: number;
  userid: string;
  user_pass: string;
  sex: "M" | "F";
  email: string;
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
      "SELECT account_id, userid, user_pass, sex, email, lastlogin, logincount, state FROM `login` WHERE userid = ? LIMIT 1",
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

    const user: AuthUser = {
      accountId: row.account_id,
      userid: row.userid,
      email: row.email || "",
      sex: row.sex || "M",
      lastLogin: row.lastlogin ? new Date(row.lastlogin).toISOString() : new Date().toISOString(),
      logincount: row.logincount || 0,
    };

    return { user };
  }

  static async getAccountById(accountId: number): Promise<AuthUser | null> {
    const row = await queryOne<LoginRow>(
      "SELECT account_id, userid, user_pass, sex, email, lastlogin, logincount, state FROM `login` WHERE account_id = ? LIMIT 1",
      [accountId]
    );

    if (!row) return null;

    return {
      accountId: row.account_id,
      userid: row.userid,
      email: row.email || "",
      sex: row.sex || "M",
      lastLogin: row.lastlogin ? new Date(row.lastlogin).toISOString() : new Date().toISOString(),
      logincount: row.logincount || 0,
    };
  }
}
