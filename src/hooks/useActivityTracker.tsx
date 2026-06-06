import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { activityService } from "@/services";

/**
 * Mantém o `last_seen` actualizado (heartbeat de 2 min) e gera notificações
 * automáticas locais quando o utilizador regressa após muitos dias sem entrar.
 */
export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    activityService.heartbeat(user.id, true);
    const t = setInterval(() => activityService.heartbeat(user.id), 2 * 60 * 1000);
    const onVis = () => { if (!document.hidden) activityService.heartbeat(user.id); };
    document.addEventListener("visibilitychange", onVis);

    activityService.maybeNotifyReturn(user.id);

    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [user?.id]);
};
