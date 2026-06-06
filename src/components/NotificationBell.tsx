import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

export const NotificationBell = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const load = async () => {
    if (!user) return;
    setUnread(await notificationsService.getUnreadCount(user.id));
  };

  useEffect(() => {
    if (!user) return;
    load();
    const unsub = notificationsService.subscribeForUser(user.id, () => load(), { tag: "bell" });
    return unsub;
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
