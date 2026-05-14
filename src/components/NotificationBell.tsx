import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  user_id: string | null;
  created_at: string;
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as any) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("notif-bell-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = items.filter(n => !n.read && n.user_id === user?.id).length;

  const markAllRead = async () => {
    if (!user) return;
    const ids = items.filter(n => !n.read && n.user_id === user.id).map(n => n.id);
    if (!ids.length) return;
    await supabase.from("notifications" as any).update({ read: true } as any).in("id", ids);
    load();
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    const diff = (Date.now() - dt.getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return dt.toLocaleDateString("pt-PT");
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-display text-sm font-bold">Notificações</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <CheckCheck className="h-3.5 w-3.5" /> Marcar lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Sem notificações por agora.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={`px-3 py-2.5 ${!n.read && n.user_id === user.id ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(n.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
