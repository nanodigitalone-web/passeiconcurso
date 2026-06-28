// authService — encapsulates authentication, session and profile access.
// UI/hooks talk to this service instead of importing the Supabase client.

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  nome: string;
  avatar_url: string | null;
  bio: string | null;
  pontos: number;
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

export const authService = {
  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(cb: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(cb);
  },

  signOut() {
    return supabase.auth.signOut();
  },

  signInWithGoogle(redirectUri: string) {
    return lovable.auth.signInWithOAuth("google", { redirect_uri: redirectUri });
  },

  async getProfile(uid: string): Promise<Profile | null> {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    return (data as Profile) ?? null;
  },

  async isAdmin(uid: string): Promise<boolean> {
    const { data } = await supabase.from("user_roles" as any).select("role").eq("user_id", uid);
    return !!data?.some((r: any) => r.role === "admin");
  },

  updateProfile(uid: string, patch: Record<string, any>) {
    return supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", uid);
  },

  // Points are applied server-side via a SECURITY DEFINER RPC that validates
  // the delta, so clients cannot set an arbitrary pontos value.
  addPoints(_uid: string, _currentPoints: number, delta: number) {
    return (supabase.rpc as any)("add_points", { _delta: delta });
  },

  setCategoria(uid: string, concursoId: string, categoriaId: string, categoriaNome: string) {
    return this.updateProfile(uid, {
      concurso_id: concursoId,
      categoria_id: categoriaId,
      categoria_nome: categoriaNome,
    });
  },
};
