// activityService — "last seen" heartbeat and "welcome back" notifications.

import { api } from "@/lib/api";
import { notificationsService } from "./notificationsService";

const LAST_KEY = "passei.lastSeenLocal";
const RETURN_NOTIF_KEY = "passei.returnNotifiedAt";

export const activityService = {
  /** Throttled heartbeat: at most 1 write per minute (unless forced). */
  async heartbeat(_userId: string, force = false) {
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    if (!force && Date.now() - last < 60 * 1000) return;
    localStorage.setItem(LAST_KEY, String(Date.now()));
    try {
      await api.post("/profile/heartbeat");
    } catch {
      /* ignore */
    }
  },

  /** Generate a "welcome back" notification once/day if absent for 3+ days. */
  async maybeNotifyReturn(userId: string) {
    let last = 0;
    let _nome: string | null = null;
    try {
      const p = await api.get<{ last_seen: string | null; nome: string | null }>(
        `/profile/${userId}`,
      );
      last = p?.last_seen ? new Date(p.last_seen).getTime() : 0;
      _nome = p?.nome ?? null;
    } catch {
      return;
    }
    const days = last ? (Date.now() - last) / 86400000 : 0;
    const lastNotif = Number(localStorage.getItem(RETURN_NOTIF_KEY) || 0);
    const notifiedRecently = Date.now() - lastNotif < 86400000;
    if (last && days >= 3 && !notifiedRecently) {
      const isLong = days >= 7;
      await notificationsService.create({
        userId,
        title: isLong ? "Sentimos a sua falta 💙" : "Bem-vindo de volta!",
        body: isLong
          ? `Já passaram ${Math.floor(days)} dias. Volte a praticar com um simulado rápido para manter o ritmo.`
          : "Bom ter-te de volta. Que tal completar um simulado hoje?",
      });
      localStorage.setItem(RETURN_NOTIF_KEY, String(Date.now()));
    }
  },
};
