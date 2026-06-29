import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

/**
 * Escuta novas notificações em tempo real e mostra um pop-up (toast)
 * não bloqueante. Não interrompe o utilizador durante um simulado.
 */
export const NotificationToaster = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  // Ids já vistos, para não voltar a mostrar notificações antigas a cada poll.
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!user) return;
    seen.current = new Set();
    primed.current = false;

    const check = async () => {
      const list = await notificationsService.listForUser(user.id);
      // Primeiro carregamento: regista as existentes sem mostrar toast.
      if (!primed.current) {
        for (const n of list) seen.current.add(n.id);
        primed.current = true;
        return;
      }
      const fresh = list.filter((n) => !seen.current.has(n.id));
      for (const n of fresh) seen.current.add(n.id);
      // não interromper durante o quiz (mas já ficam marcadas como vistas)
      if (pathRef.current.startsWith("/quiz/")) return;
      // mostrar da mais antiga para a mais recente
      for (const n of fresh.reverse()) {
        toast(n.title, {
          description: n.body,
          icon: <Bell className="h-4 w-4" />,
          duration: 6000,
        });
      }
    };

    check();
    const unsub = notificationsService.subscribeForUser(user.id, check);
    return unsub;
  }, [user?.id]);

  return null;
};

