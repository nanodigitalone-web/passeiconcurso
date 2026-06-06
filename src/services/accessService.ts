// accessService — encapsulates category access checks with an in-memory cache.
// Prevents duplicate/repeated backend calls (page + <AccessGate>), fetch loops
// on re-render, and amplification across navigation.

import { supabase } from "@/integrations/supabase/client";
import type { AccessInfo } from "./types";

const CACHE_TTL = 5 * 60 * 1000; // 5 min

type CacheEntry = { ts: number; expiresAt: number | null };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

const keyOf = (u: string, c: string, cat: string) => `${u}:${c}:${cat}`;

/** Clear the access cache (call after activating/purchasing access). */
export const clearAccessCache = (user?: string) => {
  if (!user) return cache.clear();
  for (const k of cache.keys()) if (k.startsWith(user + ":")) cache.delete(k);
};

export const accessService = {
  clearCache: clearAccessCache,

  /** Active paid plans of a user, with their expiry date (null = lifetime). */
  async getMyPlans(userId: string): Promise<
    { concursoId: string; categoriaId: string; expiresAt: number | null }[]
  > {
    const { data } = await supabase
      .from("category_access")
      .select("concurso_id, categoria_id, expires_at")
      .eq("user_id", userId);
    if (!data) return [];
    const now = Date.now();
    return (data as any[])
      .map((r) => ({
        concursoId: r.concurso_id,
        categoriaId: r.categoria_id,
        expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null,
      }))
      .filter((r) => r.expiresAt === null || r.expiresAt > now)
      .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
  },

  /** Whether the user has at least one active paid category access. */
  async hasAnyPaidAccess(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("category_access")
      .select("expires_at")
      .eq("user_id", userId);
    if (!data) return false;
    const now = Date.now();
    return (data as any[]).some(
      (r) => !r.expires_at || new Date(r.expires_at).getTime() > now
    );
  },

  async getAccess(userId: string, concursoId: string, categoriaId: string): Promise<AccessInfo> {
    const key = keyOf(userId, concursoId, categoriaId);
    const cached = cache.get(key);
    let entry: CacheEntry;

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      entry = cached;
    } else if (inflight.has(key)) {
      entry = await inflight.get(key)!;
    } else {
      const p = (async () => {
        const { data } = await supabase
          .from("category_access")
          .select("expires_at")
          .eq("user_id", userId)
          .eq("concurso_id", concursoId)
          .eq("categoria_id", categoriaId)
          .maybeSingle();
        const result: CacheEntry = {
          ts: Date.now(),
          expiresAt: data
            ? (data as any).expires_at
              ? new Date((data as any).expires_at).getTime()
              : Infinity
            : null,
        };
        cache.set(key, result);
        inflight.delete(key);
        return result;
      })();
      inflight.set(key, p);
      entry = await p;
    }

    return {
      hasPaidAccess: entry.expiresAt !== null && entry.expiresAt > Date.now(),
      expiresAt: entry.expiresAt,
    };
  },
};
