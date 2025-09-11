// context/AuthContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser } from "@/types/AppUser"; // your interface
import {
  getToken,
  setToken as saveToken,
  clearToken,
  fetchCurrentUser,
} from "@/lib/auth";

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for token and fetch user
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setAuthToken(storedToken);
      fetchCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {
          clearToken();
          setUser(null);
          setAuthToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    saveToken(token);
    setAuthToken(token);
    try {
      const u = await fetchCurrentUser();
      setUser(u);
    } catch {
      logout();
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setAuthToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const u = await fetchCurrentUser();
      setUser(u);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
