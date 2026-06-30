// authService — authentication, session and profile access via the backend API
// (JWT). UI/hooks talk to this service instead of any low-level client.

import { api, tokenStore, ApiError } from "@/lib/api";

export type Profile = {
  id: string;
  nome: string;
  avatar_url: string | null;
  bio: string | null;
  pontos: number;            // saldo disponível para troca
  pontos_globais?: number;   // total ganho na vida (nunca desce) — usado no ranking
  streak: number;
  concurso_id: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  blocked?: boolean;
  hidden?: boolean;
  email?: string | null;
  moedas?: number;
  iban?: string | null;
  friend_code?: string | null;
};

export type AuthUser = { id: string; email: string | null; created_at: string };

type AuthResponse = { token: string; profile: Profile; isAdmin: boolean };

const wrap = async (fn: () => Promise<any>): Promise<{ error: string | null }> => {
  try {
    await fn();
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || "error" };
  }
};

export const authService = {
  /** Current token (null if signed out). */
  hasSession() {
    return !!tokenStore.get();
  },

  /** Email + password sign in. */
  async signIn(email: string, password: string) {
    try {
      const r = await api.post<AuthResponse>("/auth/login", { email, password });
      tokenStore.set(r.token);
      return { error: null, profile: r.profile, isAdmin: r.isAdmin };
    } catch (e: any) {
      return { error: e?.message || "invalid_credentials" };
    }
  },

  /** Register a new account. */
  async signUp(email: string, password: string, nome?: string) {
    try {
      const r = await api.post<AuthResponse>("/auth/register", { email, password, nome });
      tokenStore.set(r.token);
      return { error: null, profile: r.profile, isAdmin: r.isAdmin };
    } catch (e: any) {
      return { error: e?.message || "error" };
    }
  },

  /** Google sign-in using a Google ID token from Google Identity Services. */
  async signInWithGoogleToken(idToken: string) {
    try {
      const r = await api.post<AuthResponse>("/auth/google", { idToken });
      tokenStore.set(r.token);
      return { error: null, profile: r.profile, isAdmin: r.isAdmin };
    } catch (e: any) {
      return { error: e?.message || "error" };
    }
  },

  signOut() {
    tokenStore.clear();
    return Promise.resolve();
  },

  /** Resolve the current user from the stored token, or null. */
  async me(): Promise<{ user: AuthUser; profile: Profile; isAdmin: boolean } | null> {
    if (!tokenStore.get()) return null;
    try {
      const r = await api.get<{ profile: Profile; isAdmin: boolean }>("/auth/me");
      if (!r?.profile) return null;
      return {
        user: { id: r.profile.id, email: r.profile.email ?? null, created_at: (r.profile as any).created_at ?? new Date().toISOString() },
        profile: r.profile,
        isAdmin: r.isAdmin,
      };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) tokenStore.clear();
      return null;
    }
  },

  async getProfile(uid: string): Promise<Profile | null> {
    try {
      return await api.get<Profile>(`/profile/${uid}`);
    } catch {
      return null;
    }
  },

  updateProfile(_uid: string, patch: Record<string, any>) {
    return wrap(() => api.patch("/profile", patch));
  },

  addPoints(_uid: string, _currentPoints: number, delta: number) {
    return wrap(() => api.post("/profile/points", { delta }));
  },

  setCategoria(_uid: string, concursoId: string, categoriaId: string, categoriaNome: string) {
    return wrap(() =>
      api.patch("/profile", {
        concurso_id: concursoId,
        categoria_id: categoriaId,
        categoria_nome: categoriaNome,
      }),
    );
  },

  hideAccount(hidden: boolean) {
    return api.post("/profile/hide", { hidden });
  },
};
