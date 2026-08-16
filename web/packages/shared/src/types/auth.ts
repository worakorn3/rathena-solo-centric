export interface LoginPayload {
  userid: string;
  user_pass: string;
}

export interface AuthUser {
  accountId: number;
  userid: string;
  email: string;
  sex: "M" | "F";
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
  iat?: number;
  exp?: number;
}
