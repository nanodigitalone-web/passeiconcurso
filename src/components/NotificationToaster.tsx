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

  useEffect(() => {
    if (!user) return;
    const unsub = notificationsService.subscribeForUser(
      user.id,
      (payload: any) => {
        const n = payload.new;
        // não interromper durante o quiz
        if (pathRef.current.startsWith("/quiz/")) return;
        toast(n.title, {
          description: n.body,
          icon: <Bell className="h-4 w-4" />,
          duration: 6000,
        });
      },
      { tag: "toast", event: "INSERT" }
    );
    return unsub;
  }, [user?.id]);

  return null;
};

