import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const NotificationBell = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const load = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications" as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setUnread(count ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("notif-bell-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <Button asChild variant="ghost" size="icon" className="relative rounded-full" aria-label="Notificações">
      <Link to="/notificacoes">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
};
