import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCheck, Coins, Inbox, Megaphone, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService, type NotificationRow } from "@/services";
import { cn } from "@/lib/utils";

type Notif = NotificationRow;

const fmtDate = (d: string) => {
  const dt = new Date(d);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d`;
  return dt.toLocaleDateString("pt-PT");
};

// Ícone e cor por tipo de mensagem (heurística sobre o conteúdo).
const notifStyle = (n: Notif) => {
  const t = `${n.title} ${n.body}`.toLowerCase();
  if (t.includes("lugar") || t.includes("prémio") || t.includes("parabéns"))
    return { icon: Trophy, accent: "bg-amber-100 text-amber-700" };
  if (t.includes("aviso") || t.includes("bloque"))
    return { icon: AlertTriangle, accent: "bg-rose-100 text-rose-700" };
  if (t.includes("moeda") || t.includes("carregamento") || t.includes("saque"))
    return { icon: Coins, accent: "bg-emerald-100 text-emerald-700" };
  if (n.user_id === null)
    return { icon: Megaphone, accent: "bg-sky-100 text-sky-700" };
  return { icon: Bell, accent: "bg-primary/10 text-primary" };
};

const Notificacoes = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const list = await notificationsService.listForUser(user.id, 100);
    // Só mensagens dos últimos 2 dias.
    const cutoff = Date.now() - 2 * 86400_000;
    setItems(list.filter((n) => new Date(n.created_at).getTime() >= cutoff));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const unsub = notificationsService.subscribeAll("page-" + user.id, () => load());
    // mark all unread as read
    notificationsService.markAllRead(user.id);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return <Navigate to="/login" replace />;

  const novas = items.filter(n => {
    const diff = (Date.now() - new Date(n.created_at).getTime()) / 1000;
    return diff < 86400;
  });
  const antigas = items.filter(n => !novas.includes(n));

  const Section = ({ title, list, fresh }: { title: string; list: Notif[]; fresh?: boolean }) => (
    list.length === 0 ? null : (
      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <h2 className="font-display text-sm font-semibold">{title}</h2>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            fresh ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            {list.length}
          </span>
        </div>
        <Card className="border-border/60 p-2 shadow-card">
          <ul className="divide-y divide-border/60">
            {list.map((n) => {
              const s = notifStyle(n);
              return (
                <li key={n.id} className={cn("flex items-start gap-3 rounded-xl p-3", fresh && "bg-primary/[0.03]")}>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.accent)}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDate(n.created_at)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    )
  );

  return (
    <AppShell>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Caixa de entrada</p>
            <h1 className="mt-0.5 font-display text-2xl font-bold">Notificações</h1>
            <p className="mt-1 text-sm opacity-80">
              {loading ? "A carregar…" : items.length === 0 ? "Tudo em dia" : `${items.length} mensagens · ${novas.length} nas últimas 24h`}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <CheckCheck className="h-3.5 w-3.5" /> tudo lido
          </span>
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">A carregar…</Card>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-none">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold">Sem notificações por agora</p>
            <p className="mt-1 text-xs text-muted-foreground">
              As mensagens da plataforma, prémios e avisos aparecem aqui.
            </p>
          </div>
        </Card>
      ) : (
        <div className="pb-6">
          <Section title="Novas" list={novas} fresh />
          <Section title="Anteriores" list={antigas} />
        </div>
      )}
    </AppShell>
  );
};

export default Notificacoes;
