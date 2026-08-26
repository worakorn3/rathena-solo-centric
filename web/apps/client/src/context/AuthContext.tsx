import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser, LoginPayload, RegisterPayload } from "@rathena/shared";
import { api } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("rathena_token"));
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("rathena_token");
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; user: AuthUser }>("/api/auth/me");
      if (res.success && res.user) {
        setUser(res.user);
        setToken(storedToken);
      } else {
        localStorage.removeItem("rathena_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("rathena_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rathena_token") {
        if (!e.newValue) {
          setUser(null);
          setToken(null);
        } else {
          checkAuth();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuth]);

  const login = async (payload: LoginPayload) => {
    const res = await api.post<{ success: boolean; token: string; user: AuthUser }>(
      "/api/auth/login",
      payload
    );
    if (res.success && res.token) {
      localStorage.setItem("rathena_token", res.token);
      setToken(res.token);
      setUser(res.user);
      setIsLoginModalOpen(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.post<{ success: boolean; token: string; user: AuthUser }>(
      "/api/auth/register",
      payload
    );
    if (res.success && res.token) {
      localStorage.setItem("rathena_token", res.token);
      setToken(res.token);
      setUser(res.user);
      setIsLoginModalOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("rathena_token");
    setToken(null);
    setUser(null);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoginModalOpen,
        login,
        register,
        logout,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
