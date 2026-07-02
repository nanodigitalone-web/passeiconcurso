import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { rankingService, type RankRow } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Flame, Shield, Trophy, Zap } from "lucide-react";
import { WeeklyTop } from "@/components/ranking/WeeklyTop";
import { FriendsPanel } from "@/components/ranking/FriendsPanel";
import { LigaPanel } from "@/components/ranking/LigaPanel";
import { PlanBadge } from "@/components/PlanBadge";

type Filtro = "todos" | "minha";
type Tab = "geral" | "liga" | "semana" | "amigos";

const TABS: { id: Tab; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "liga", label: "Liga" },
  { id: "semana", label: "Semana" },
  { id: "amigos", label: "Amigos" },
];

const LEAGUE_NAMES = ["Bronze", "Prata", "Ouro", "Diamante", "Lenda"];

const GeralRanking = () => {
  const { profile, user } = useAuth();
  const [rows, setRows] = useState<RankRow[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const _categoria = filtro === "minha" && profile?.categoria_id ? profile.categoria_id : null;
    rankingService.getRanking(_categoria).then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, [filtro, profile?.categoria_id]);

  const data = rows;
  const myIdx = data.findIndex((u) => u.id === user?.id);

  return (
    <>
      <div className="mb-4 inline-flex w-full rounded-full bg-muted p-1">
        <button
          onClick={() => setFiltro("todos")}
          className={cn(
            "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-smooth",
            filtro === "todos" ? "bg-background text-primary shadow-card" : "text-muted-foreground"
          )}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltro("minha")}
          disabled={!profile?.categoria_id}
          className={cn(
            "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-smooth disabled:opacity-50",
            filtro === "minha" ? "bg-background text-primary shadow-card" : "text-muted-foreground"
          )}
        >
          Minha categoria
        </button>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Carregando ranking…</Card>
      ) : data.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-none">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold">Sem candidatos ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">Seja o primeiro a pontuar!</p>
          </div>
        </Card>
      ) : (
        <>
          {/* A tua posição */}
          {myIdx >= 0 && (
            <Card className="mb-4 flex items-center gap-3 border-primary/20 bg-primary/5 p-3.5 shadow-card animate-fade-in">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-sm font-bold">
                #{myIdx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">A tua posição</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {myIdx === 0
                    ? "Estás em 1.º lugar. Defende o trono!"
                    : `Faltam ${(data[myIdx - 1].pontos - data[myIdx].pontos + 1).toLocaleString("pt-PT")} pts para ultrapassar ${data[myIdx - 1].nome.split(" ")[0]}`}
                </p>
              </div>
              <p className="font-display text-sm font-bold">
                {data[myIdx].pontos.toLocaleString("pt-PT")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
              </p>
            </Card>
          )}

          {/* Pódio */}
          <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-b from-primary/10 via-background to-background p-5 pt-6 shadow-elegant">
            <div className="grid grid-cols-3 items-end gap-2.5">
              {[1, 0, 2].map((i, slot) => {
                const u = data[i];
                if (!u) return <div key={i} />;
                const isFirst = slot === 1;
                const isMe = u.id === user?.id;
                const pedestalH = ["h-20", "h-28", "h-16"][slot];
                const pedestal = [
                  "bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-500 dark:to-slate-700",
                  "bg-gradient-primary",
                  "bg-gradient-to-b from-amber-500 to-amber-700",
                ][slot];
                const ringColor = [
                  "ring-slate-300 dark:ring-slate-500",
                  "ring-primary",
                  "ring-amber-500",
                ][slot];
                const rankNum = [2, 1, 3][slot];
                const avatarSize = isFirst ? "h-20 w-20" : "h-14 w-14";
                return (
                  <div key={i} className="flex flex-col items-center justify-end animate-fade-in">
                    {isFirst && (
                      <Crown className="mb-1 h-7 w-7 fill-amber-400 text-amber-400 animate-float drop-shadow" />
                    )}
                    <Link to={`/perfil/${u.id}`} className="relative">
                      <PlanBadge planId={u.plan_id}>
                        <Avatar className={cn(avatarSize, "ring-4 ring-offset-2 ring-offset-background shadow-elegant", ringColor)}>
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                            {u.nome?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </PlanBadge>
                      <span className={cn(
                        "absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full font-display text-xs font-bold text-white shadow-card",
                        pedestal
                      )}>
                        {rankNum}
                      </span>
                    </Link>
                    <div className="mt-3 mb-2 text-center">
                      <p className={cn("max-w-[92px] truncate text-xs font-bold", isMe && "text-primary")}>
                        {u.nome}{isMe ? " (você)" : ""}
                      </p>
                      <p className={cn(
                        "font-display text-sm font-bold",
                        isFirst ? "text-primary" : "text-foreground/80"
                      )}>
                        {u.pontos.toLocaleString("pt-PT")}<span className="ml-0.5 text-[10px] font-normal text-muted-foreground">pts</span>
                      </p>
                    </div>
                    <div className={cn(
                      pedestalH, pedestal,
                      "flex w-full items-start justify-center rounded-t-xl pt-2 text-white/90 shadow-card"
                    )}>
                      <span className="font-display text-2xl font-black opacity-40">{rankNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Lista */}
          <Card className="border-border/60 p-2 shadow-card">
            <ul className="divide-y divide-border/60">
              {data.map((u, i) => {
                const isMe = u.id === user?.id;
                return (
                  <li key={u.id}>
                    <Link
                      to={`/perfil/${u.id}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 active:bg-muted",
                        isMe && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                        i === 0 ? "bg-amber-400 text-amber-950"
                        : i === 1 ? "bg-slate-300 text-slate-800"
                        : i === 2 ? "bg-amber-700 text-amber-50"
                        : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </div>
                      <PlanBadge planId={u.plan_id} size="sm">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                            {u.nome?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </PlanBadge>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", isMe && "text-primary")}>
                          {u.nome}{isMe ? " (você)" : ""}
                        </p>
                        {u.categoria_nome && (
                          <p className="truncate text-[11px] text-muted-foreground">{u.categoria_nome}</p>
                        )}
                      </div>
                      <p className="font-display text-sm font-bold">{u.pontos.toLocaleString("pt-PT")}<span className="ml-1 text-xs font-normal text-muted-foreground">pts</span></p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </>
  );
};

const Ranking = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = (searchParams.get("tab") as Tab) || "geral";
  const [tab, setTab] = useState<Tab>(["geral", "liga", "semana", "amigos"].includes(initial) ? initial : "geral");

  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams(t === "geral" ? {} : { tab: t }, { replace: true });
  };

  const pontos = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const liga = LEAGUE_NAMES[Math.min(Math.max(profile?.league ?? 0, 0), LEAGUE_NAMES.length - 1)];
  const streak = profile?.streak ?? 0;

  return (
    <AppShell>
      <Seo
        title="Ranking de Candidatos · Passei"
        description="Veja a classificação dos melhores candidatos do Passei, a sua liga semanal, o top da semana e desafie amigos em batalhas."
        path="/ranking"
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Competição</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">Ranking de Candidatos</h1>
          <p className="mt-1 text-sm opacity-80">Compete, sobe de liga e desafia amigos</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Zap, value: pontos.toLocaleString("pt-PT"), label: "Pontos" },
              { icon: Shield, value: liga, label: "Liga" },
              { icon: Flame, value: streak > 0 ? `${streak}d` : "—", label: "Sequência" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 opacity-60" />
                <p className="font-display text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] opacity-60 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 inline-flex w-full rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-smooth",
              tab === t.id ? "bg-background text-primary shadow-card" : "text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && <GeralRanking />}
      {tab === "liga" && <LigaPanel />}
      {tab === "semana" && <WeeklyTop />}
      {tab === "amigos" && <FriendsPanel />}
    </AppShell>
  );
};

export default Ranking;
