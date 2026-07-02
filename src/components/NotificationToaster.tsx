import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

const QUIET_PREFIXES = ["/quiz/", "/aprender/sessao/", "/batalha/", "/simulado-nacional/"];
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // só mostra toasts de notificações < 2h

export const NotificationToaster = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
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
        icon: (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
        ),
        duration: 8000,
        action: {
          label: fresh.length > 1 ? `Ver todas (${fresh.length})` : "Ver",
          onClick: () => navigate("/notificacoes"),
        },
        classNames: {
          toast: "rounded-2xl border-border/60 shadow-elegant",
          title: "font-semibold",
        },
      });
    }, 4000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
