import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { rankingService, type RankRow } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Trophy } from "lucide-react";
import { WeeklyTop } from "@/components/ranking/WeeklyTop";
import { FriendsPanel } from "@/components/ranking/FriendsPanel";
import { LigaPanel } from "@/components/ranking/LigaPanel";

type Filtro = "todos" | "minha";
type Tab = "geral" | "liga" | "semana" | "amigos";

const TABS: { id: Tab; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "liga", label: "Liga" },
  { id: "semana", label: "Semana" },
  { id: "amigos", label: "Amigos" },
];

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

  return (
    <>
      <div className="mb-5 inline-flex w-full rounded-full bg-muted p-1">
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
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sem candidatos ainda. Seja o primeiro a pontuar!
        </Card>
      ) : (
        <>
          <Card className="mb-5 overflow-hidden border-0 bg-gradient-to-b from-primary/10 via-background to-background p-5 pt-6 shadow-elegant">
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
                      <Avatar className={cn(avatarSize, "ring-4 ring-offset-2 ring-offset-background shadow-elegant", ringColor)}>
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                          {u.nome?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
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
                        {u.pontos}<span className="ml-0.5 text-[10px] font-normal text-muted-foreground">pts</span>
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
                        i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                          {u.nome?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", isMe && "text-primary")}>
                          {u.nome}{isMe ? " (você)" : ""}
                        </p>
                        {u.categoria_nome && (
                          <p className="truncate text-[11px] text-muted-foreground">{u.categoria_nome}</p>
                        )}
                      </div>
                      <p className="font-display text-sm font-bold">{u.pontos}<span className="ml-1 text-xs font-normal text-muted-foreground">pts</span></p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = (searchParams.get("tab") as Tab) || "geral";
  const [tab, setTab] = useState<Tab>(["geral", "liga", "semana", "amigos"].includes(initial) ? initial : "geral");

  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams(t === "geral" ? {} : { tab: t }, { replace: true });
  };

  return (
    <AppShell>
      <Seo
        title="Ranking de Candidatos · Passei"
        description="Veja a classificação dos melhores candidatos do Passei, o top da semana, conecte amigos e desafie-os em batalhas."
        path="/ranking"
      />
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Ranking de Candidatos</h1>
        <p className="text-sm text-muted-foreground">Compita, conecte amigos e dispute batalhas</p>
      </header>

      <div className="mb-5 inline-flex w-full rounded-full bg-muted p-1">
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
