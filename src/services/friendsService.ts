// friendsService — friend connections (search, requests, friend code).

import { supabase } from "@/integrations/supabase/client";

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
    const { data } = await supabase
      .from("profiles")
      .select("friend_code")
      .eq("id", userId)
      .maybeSingle();
    return (data as any)?.friend_code ?? null;
  },

  async search(q: string): Promise<FoundUser[]> {
    const term = q.trim();
    if (term.length < 2) return [];
    const { data } = await supabase.rpc("search_users", { _q: term });
    return (data ?? []) as FoundUser[];
  },

  async list(): Promise<FriendRow[]> {
    const { data } = await supabase.rpc("get_friends");
    return (data ?? []) as FriendRow[];
  },

  async sendRequest(toUserId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
    const { data, error } = await supabase.rpc("send_friend_request", { _to: toUserId });
    if (error) return { ok: false, error: error.message };
    return (data ?? { ok: false }) as any;
  },

  async addByCode(code: string): Promise<{ ok: boolean; status?: string; error?: string }> {
    const { data, error } = await supabase.rpc("add_friend_by_code", { _code: code.trim() });
    if (error) return { ok: false, error: error.message };
    return (data ?? { ok: false }) as any;
  },

  async respond(friendshipId: string, accept: boolean): Promise<boolean> {
    const { error } = await supabase.rpc("respond_friend_request", {
      _id: friendshipId,
      _accept: accept,
    });
    return !error;
  },

  async remove(friendshipId: string): Promise<boolean> {
    const { error } = await supabase.rpc("respond_friend_request", {
      _id: friendshipId,
      _accept: false,
    });
    return !error;
  },
};
