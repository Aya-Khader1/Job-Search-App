import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, userApi } from "./endpoints";
import { tokenStore } from "./api";
import type { User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  const reload = useCallback(async () => {
    setUser(await userApi.me());
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    reload().catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, [reload]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { credentials } = await authApi.login({ email, password });
    tokenStore.set(credentials);
    await reload();
  }, [reload]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    let res = await authApi.google(idToken);
    // First-time Google users are created without credentials; signing in again returns them.
    if (!res.data.credentials) res = await authApi.google(idToken);
    if (!res.data.credentials) throw new Error("Google sign-in did not return a session. Try again.");
    tokenStore.set(res.data.credentials);
    await reload();
  }, [reload]);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, isAdmin: user?.role === "ADMIN", login, loginWithGoogle, logout, reload }),
    [user, loading, login, loginWithGoogle, logout, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
