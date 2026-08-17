"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, logout as apiLogout, type AuthUser, type Salon } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  salon: Salon | null;
  loading: boolean;
  logout: () => Promise<void>;
  setSession: (data: { user: AuthUser; salon: Salon }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((data) => {
        setUser(data.user);
        setSalon(data.salon);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
    setSalon(null);
    router.replace("/login");
  }

  function setSession(data: { user: AuthUser; salon: Salon }) {
    setUser(data.user);
    setSalon(data.salon);
  }

  return (
    <AuthContext.Provider value={{ user, salon, loading, logout, setSession }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}
