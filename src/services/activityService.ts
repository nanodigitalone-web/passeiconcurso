// activityService — encapsulates the "last seen" heartbeat and the automatic
// "welcome back" notifications. Wraps localStorage + profile/notification access.

import { supabase } from "@/integrations/supabase/client";
import { notificationsService } from "./notificationsService";

const LAST_KEY = "passei.lastSeenLocal";
const RETURN_NOTIF_KEY = "passei.returnNotifiedAt";

export const activityService = {
  /** Throttled heartbeat: at most 1 write per minute (unless forced). */
  async heartbeat(userId: string, force = false) {
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    if (!force && Date.now() - last < 60 * 1000) return;
    localStorage.setItem(LAST_KEY, String(Date.now()));
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
  },

  /** Generate a "welcome back" notification once/day if absent for 3+ days. */
  async maybeNotifyReturn(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("last_seen, nome")
      .eq("id", userId)
      .maybeSingle();
    const last = data?.last_seen ? new Date(data.last_seen).getTime() : 0;
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
