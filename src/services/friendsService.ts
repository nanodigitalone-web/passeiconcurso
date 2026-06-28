// friendsService — friend connections (search, requests, friend code).

import { api } from "@/lib/api";

export type FoundUser = {
  id: string;
  nome: string;
  avatar_url: string | null;
  categoria_nome: string | null;
  friend_code: string | null;
};

export type FriendRow = {
  friendship_id: string;
  friend_id: string;
  nome: string;
  avatar_url: string | null;
  categoria_nome: string | null;
  pontos: number;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
};

export const friendsService = {
  /** The signed-in user's own friend code. */
  async getMyCode(userId: string): Promise<string | null> {
    try {
      const p = await api.get<{ friend_code: string | null }>(`/profile/${userId}`);
      return p?.friend_code ?? null;
    } catch {
      return null;
    }
  },

  async search(q: string): Promise<FoundUser[]> {
    const term = q.trim();
    if (term.length < 2) return [];
    try {
      return await api.get<FoundUser[]>(`/friends/search?q=${encodeURIComponent(term)}`);
    } catch {
      return [];
    }
  },

  async list(): Promise<FriendRow[]> {
    try {
      return await api.get<FriendRow[]>("/friends");
    } catch {
      return [];
    }
  },

  async sendRequest(toUserId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
    try {
      return await api.post("/friends/request", { to: toUserId });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async addByCode(code: string): Promise<{ ok: boolean; status?: string; error?: string }> {
    try {
      return await api.post("/friends/code", { code: code.trim() });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async respond(friendshipId: string, accept: boolean): Promise<boolean> {
    try {
      await api.post("/friends/respond", { id: friendshipId, accept });
      return true;
    } catch {
      return false;
    }
  },

  async remove(friendshipId: string): Promise<boolean> {
    return this.respond(friendshipId, false);
  },
};
