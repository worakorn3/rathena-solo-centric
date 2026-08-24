export interface LoginPayload {
  userid: string;
  user_pass: string;
}

export type UserRole = "ADMIN" | "GM" | "PLAYER";

export interface AuthUser {
  accountId: number;
  userid: string;
  email: string;
  sex: "M" | "F";
  groupId: number;
  role: UserRole;
  lastLogin: string;
  logincount: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

export interface JWTPayload {
  accountId: number;
  userid: string;
  sex: string;
  groupId: number;
  role: UserRole;
  iat?: number;
  exp?: number;
}
