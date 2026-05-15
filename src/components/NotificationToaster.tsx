import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
    const ch = supabase
      .channel("notif-toast-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          const n = payload.new;
          if (n.user_id && n.user_id !== user.id) return;
          // não interromper durante o quiz
          if (pathRef.current.startsWith("/quiz/")) return;
          toast(n.title, {
            description: n.body,
            icon: <Bell className="h-4 w-4" />,
            duration: 6000,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return null;
};
