import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

const QUIET_PREFIXES = ["/quiz/", "/aprender/sessao/", "/batalha/"];
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // só mostra toasts de notificações < 2h

export const NotificationToaster = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const fired = useRef(false); // só 1 toast por sessão

  useEffect(() => {
    if (!user) { fired.current = false; return; }

    const timer = setTimeout(async () => {
      if (fired.current) return;
      const isQuiet = QUIET_PREFIXES.some((p) => pathRef.current.startsWith(p));
      if (isQuiet) return;

      let list;
      try { list = await notificationsService.listForUser(user.id); } catch { return; }

      const now = Date.now();
      // Só notificações pessoais (não broadcasts), não lidas, recentes
      const fresh = list.filter(
        (n) => n.user_id !== null && !n.read && now - new Date(n.created_at).getTime() < MAX_AGE_MS,
      );
      if (fresh.length === 0) return;

      fired.current = true;
      const n = fresh[0];
      toast(n.title, {
        description: n.body,
        icon: <Bell className="h-4 w-4" />,
        duration: 7000,
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  return null;
};
