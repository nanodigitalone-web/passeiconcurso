// accessService — encapsulates category access checks with an in-memory cache.
// Talks to the backend API (Render) instead of Supabase.

import { api } from "@/lib/api";
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

type PlanRow = { concursoId: string; categoriaId: string; expiresAt: number | null };

export const accessService = {
  clearCache: clearAccessCache,

  /** Active paid plans of a user, with their expiry date (null = lifetime). */
  async getMyPlans(_userId: string): Promise<PlanRow[]> {
    try {
      const r = await api.get<{ plans: PlanRow[] }>("/access/plans");
      return r.plans ?? [];
    } catch {
      return [];
    }
  },

  /** Whether the user has at least one active paid category access. */
  async hasAnyPaidAccess(userId: string): Promise<boolean> {
    const plans = await this.getMyPlans(userId);
    const now = Date.now();
    return plans.some((p) => p.expiresAt === null || p.expiresAt > now);
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
        let expiresAt: number | null = null;
        try {
          const r = await api.get<{ hasPaidAccess: boolean; expiresAt: number | null }>(
            `/access/check?conc=${encodeURIComponent(concursoId)}&cat=${encodeURIComponent(categoriaId)}`,
          );
          expiresAt = r.expiresAt;
        } catch {
          expiresAt = null;
        }
        const result: CacheEntry = { ts: Date.now(), expiresAt };
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
