import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

const TRIAL_DAYS = 2;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export type GateState = {
  loading: boolean;
  hasAccess: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
};

// Cache em memória do resultado de category_access por user+concurso+categoria.
// Evita chamadas duplicadas/repetidas ao backend (ex.: página + <AccessGate>),
// fetch loops em re-render e navegação entre ecrãs.
type CacheEntry = { ts: number; expiresAt: number | null };
const accessCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

const keyOf = (u: string, c: string, cat: string) => `${u}:${c}:${cat}`;

/** Limpa o cache (chamar após ativar/comprar acesso). */
export const clearAccessCache = (user?: string) => {
  if (!user) return accessCache.clear();
  for (const k of accessCache.keys()) if (k.startsWith(user + ":")) accessCache.delete(k);
};

const fetchAccess = (user: string, conc: string, cat: string): Promise<CacheEntry> => {
  const key = keyOf(user, conc, cat);
  const cached = accessCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return Promise.resolve(cached);
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async () => {
    const { data } = await supabase
      .from("category_access")
      .select("expires_at")
      .eq("user_id", user)
      .eq("concurso_id", conc)
      .eq("categoria_id", cat)
      .maybeSingle();
    const entry: CacheEntry = {
      ts: Date.now(),
      expiresAt: data ? ((data as any).expires_at ? new Date((data as any).expires_at).getTime() : Infinity) : null,
    };
    accessCache.set(key, entry);
    inflight.delete(key);
    return entry;
  })();
  inflight.set(key, p);
  return p;
};

export const useAccessGate = (concursoId?: string, categoriaId?: string): GateState => {
  const { user } = useAuth();
  const [state, setState] = useState<GateState>({
    loading: true, hasAccess: false, isTrial: false, trialDaysLeft: 0, trialExpired: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !concursoId || !categoriaId) {
        setState({ loading: false, hasAccess: false, isTrial: false, trialDaysLeft: 0, trialExpired: false });
        return;
      }
      const created = new Date(user.created_at).getTime();
      const trialEnd = created + TRIAL_DAYS * 86400000;
      const now = Date.now();
      const trialDaysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
      const isTrial = now < trialEnd;

      const entry = await fetchAccess(user.id, concursoId, categoriaId);
      const paid = entry.expiresAt !== null && entry.expiresAt > Date.now();

      if (!active) return;
      setState({
        loading: false,
        hasAccess: isTrial || paid,
        isTrial: isTrial && !paid,
        trialDaysLeft,
        trialExpired: !isTrial && !paid,
      });
    })();
    return () => { active = false; };
  }, [user, concursoId, categoriaId]);

  return state;
};
