import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authService, type Profile, type AuthUser } from "@/services";

export type { Profile };

type AuthCtx = {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await authService.me();
    if (r) {
      setUser(r.user);
      setProfile(r.profile);
      setIsAdmin(r.isAdmin);
    } else {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await authService.getProfile(user.id);
    if (p) setProfile(p);
  }, [user]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ user, profile, isAdmin, loading, refresh, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
