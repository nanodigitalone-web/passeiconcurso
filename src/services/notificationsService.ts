// notificationsService — encapsulates notifications data + realtime subscriptions.

import { supabase } from "@/integrations/supabase/client";
import type { NotificationInput } from "./types";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  user_id: string | null;
  created_at: string;
};

export const notificationsService = {
  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from("notifications" as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    return count ?? 0;
  },

  async listForUser(userId: string, limit = 100): Promise<NotificationRow[]> {
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as any) ?? []) as NotificationRow[];
  },

  async markAllRead(userId: string) {
    return supabase
      .from("notifications" as any)
      .update({ read: true } as any)
      .eq("user_id", userId)
      .eq("read", false);
  },

  create(input: NotificationInput) {
    return supabase.from("notifications" as any).insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      ...(input.createdBy !== undefined ? { created_by: input.createdBy } : {}),
    } as any);
  },

  /** Subscribe to realtime changes for a single user. Returns an unsubscribe fn. */
  subscribeForUser(
    userId: string,
    onChange: (payload: any) => void,
    opts?: { tag?: string; event?: "INSERT" | "UPDATE" | "DELETE" | "*" }
  ) {
    const ch = supabase
      .channel(`notif-${opts?.tag ?? "sub"}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: opts?.event ?? "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  },

  /** Subscribe to all notification changes (used by the notifications page). */
  subscribeAll(tag: string, onChange: (payload: any) => void) {
    const ch = supabase
      .channel(`notif-${tag}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  },
};
