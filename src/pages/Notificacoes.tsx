import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { AppShell } from "@/components/AppShell";
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

const fmtDate = (d: string) => {
  const dt = new Date(d);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d`;
  return dt.toLocaleDateString("pt-PT");
};

const Notificacoes = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("notif-page-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    // mark all unread as read
    (async () => {
      await supabase
        .from("notifications" as any)
        .update({ read: true } as any)
        .eq("user_id", user.id)
        .eq("read", false);
    })();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return <Navigate to="/login" replace />;

  const novas = items.filter(n => {
    const diff = (Date.now() - new Date(n.created_at).getTime()) / 1000;
    return diff < 86400;
  });
  const antigas = items.filter(n => !novas.includes(n));

  const Section = ({ title, list }: { title: string; list: Notif[] }) => (
    list.length === 0 ? null : (
      <>
        <h2 className="px-1 pb-2 pt-4 font-display text-sm font-bold text-muted-foreground">{title}</h2>
        <ul className="space-y-2">
          {list.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{n.title}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDate(n.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </>
    )
  );

  return (
    <AppShell>
      <header className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Notificações</h1>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCheck className="h-3.5 w-3.5" /> tudo lido
        </span>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">A carregar...</p>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-8 w-8" />
          </div>
          <p className="font-semibold">Sem notificações por agora</p>
          <p className="text-sm">As mensagens da plataforma aparecerão aqui.</p>
        </div>
      ) : (
        <div className="pb-6">
          <Section title="Novas" list={novas} />
          <Section title="Anteriores" list={antigas} />
        </div>
      )}
    </AppShell>
  );
};

export default Notificacoes;
