import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

const LAST_KEY = "passei.lastSeenLocal";
const RETURN_NOTIF_KEY = "passei.returnNotifiedAt";

/**
 * Mantém o `last_seen` actualizado (heartbeat de 2 min) e gera notificações
 * automáticas locais quando o utilizador regressa após muitos dias sem entrar.
 */
export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const beat = async (force = false) => {
      const last = Number(localStorage.getItem(LAST_KEY) || 0);
      // Throttle: no máximo 1 escrita por minuto (evita spam ao alternar abas).
      if (!force && Date.now() - last < 60 * 1000) return;
      localStorage.setItem(LAST_KEY, String(Date.now()));
      await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
    };
    beat(true);
    const t = setInterval(() => beat(), 2 * 60 * 1000);
    const onVis = () => { if (!document.hidden) beat(); };
    document.addEventListener("visibilitychange", onVis);

    // Notificação de regresso (uma vez por dia, se >3 dias sem entrar)
    (async () => {
      const { data } = await supabase.from("profiles").select("last_seen, nome").eq("id", user.id).maybeSingle();
      const last = data?.last_seen ? new Date(data.last_seen).getTime() : 0;
      const days = last ? (Date.now() - last) / 86400000 : 0;
      const lastNotif = Number(localStorage.getItem(RETURN_NOTIF_KEY) || 0);
      const notifiedRecently = Date.now() - lastNotif < 86400000;
      if (last && days >= 3 && !notifiedRecently) {
        const isLong = days >= 7;
        await supabase.from("notifications" as any).insert({
          user_id: user.id,
          title: isLong ? "Sentimos a sua falta 💙" : "Bem-vindo de volta!",
          body: isLong
            ? `Já passaram ${Math.floor(days)} dias. Volte a praticar com um simulado rápido para manter o ritmo.`
            : "Bom ter-te de volta. Que tal completar um simulado hoje?",
        } as any);
        localStorage.setItem(RETURN_NOTIF_KEY, String(Date.now()));
      }
    })();

    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [user?.id]);
};
