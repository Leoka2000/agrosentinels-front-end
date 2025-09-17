// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser } from "@/types/AppUser"; // your user interface
import {
  getToken,        // read token from localStorage or cookie
  setToken as saveToken, // save token to localStorage or cookie
  clearToken,      // remove token from storage
  fetchCurrentUser, // fetch user info from backend using token
} from "@/lib/auth";

// shape of the auth context
interface AuthContextType {
  user: AppUser | null; // currently logged-in user, null if not logged in
  token: string | null; // current auth token
  loading: boolean; // whether auth info is still being loaded
  login: (token: string) => Promise<void>; // function to log in
  logout: () => void; // function to log out
  refreshUser: () => Promise<void>; // refresh current user data
}

// create context, default undefined for type safety
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// provider wraps app parts that need auth info
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null); // store current user
  const [token, setAuthToken] = useState<string | null>(null); // store current token
  const [loading, setLoading] = useState(true); // loading state while fetching user

  // ---------------- check for token and fetch user on mount ----------------
  useEffect(() => {
    const storedToken = getToken(); // try to get saved token
    if (storedToken) {
      setAuthToken(storedToken); // update state
      fetchCurrentUser()          // fetch user from backend
        .then((u) => setUser(u))  // save user in state
        .catch(() => {
          // if fetching fails, clear token & reset state
          clearToken();
          setUser(null);
          setAuthToken(null);
        })
        .finally(() => setLoading(false)); // done loading regardless
    } else {
      setLoading(false); // no token, no need to fetch
    }
  }, []);

  // ---------------- login ----------------
  const login = async (token: string) => {
    saveToken(token); // persist token
    setAuthToken(token); // update state
    try {
      const u = await fetchCurrentUser(); // fetch user info
      setUser(u); // store user
    } catch {
      logout(); // if fetching fails, log out completely
    }
  };

  // ---------------- logout ----------------
  const logout = () => {
    clearToken();      // remove token from storage
    setUser(null);     // clear user state
    setAuthToken(null); // clear token state
  };

  // ---------------- refresh current user ----------------
  const refreshUser = async () => {
    if (!token) return; // cant refresh without a token
    try {
      const u = await fetchCurrentUser(); // fetch latest user info
      setUser(u); 
    } catch {
      logout(); // if fetching fails, log out
    }
  };

  // ---------------- provide context values ----------------
  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------- custom hook to use auth context ----------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider"); // guard
  return ctx;
}
