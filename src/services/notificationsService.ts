// notificationsService — notifications data via backend API.
// Realtime is replaced with lightweight polling (no Supabase channels).

import { api } from "@/lib/api";
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
    const list = await this.listForUser(userId);
    return list.filter((n) => !n.read).length;
  },

  async listForUser(_userId: string, _limit = 100): Promise<NotificationRow[]> {
    try {
      return await api.get<NotificationRow[]>("/notifications");
    } catch {
      return [];
    }
  },

  async markAllRead(_userId: string) {
    try {
      await api.post("/notifications/read-all");
    } catch {
      /* ignore */
    }
  },

  async markRead(id: string) {
    try {
      await api.post("/notifications/read", { id });
    } catch {
      /* ignore */
    }
  },

  async create(input: NotificationInput) {
    try {
      await api.post("/notifications", {
        userId: input.userId,
        title: input.title,
        body: input.body,
      });
    } catch {
      /* ignore */
    }
  },

  /** Poll for changes for a single user. Returns an unsubscribe fn. */
  subscribeForUser(userId: string, onChange: (payload: any) => void, _opts?: any) {
    const interval = setInterval(() => onChange({ userId }), 30000);
    return () => clearInterval(interval);
  },

  /** Poll for all notification changes (used by the notifications page). */
  subscribeAll(_tag: string, onChange: (payload: any) => void) {
    const interval = setInterval(() => onChange({}), 30000);
    return () => clearInterval(interval);
  },
};
