import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { rankingService, type LeagueInfo } from "@/services";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowUp, Shield, Timer } from "lucide-react";

// Cores por divisão: Bronze, Prata, Ouro, Diamante, Lenda.
const LEAGUE_STYLE = [
  "from-amber-700 to-amber-900",
  "from-slate-400 to-slate-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-blue-600",
  "from-violet-500 to-fuchsia-600",
];

const daysLeft = (iso: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "termina hoje";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h restantes` : `${h}h restantes`;
};

export const LigaPanel = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState<LeagueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rankingService.getLeague().then((r) => {
      setInfo(r);
      setLoading(false);
    });
  }, []);

  if (loading)
    return <Card className="p-8 text-center text-sm text-muted-foreground">A carregar a tua liga…</Card>;
  if (!info)
    return <Card className="p-8 text-center text-sm text-muted-foreground">Liga indisponível. Tenta de novo.</Card>;

  const myIdx = info.standings.findIndex((s) => s.id === user?.id);

  return (
    <>
      {/* Escada de divisões */}
      <div className="mb-4 flex items-center justify-between gap-1.5">
        {info.leagues.map((name, i) => {
          const isMine = i === info.league;
          return (
            <div key={name} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-card transition-all",
                  LEAGUE_STYLE[i],
                  isMine ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-40 grayscale-[30%]",
                )}
              >
                <Shield className={cn("h-5 w-5", isMine && "fill-white/30")} />
              </div>
              <span className={cn("text-[10px] font-semibold", isMine ? "text-primary" : "text-muted-foreground")}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cabeçalho da liga actual */}
      <Card className={cn(
        "mb-4 overflow-hidden border-0 bg-gradient-to-br p-5 text-white shadow-elegant",
        LEAGUE_STYLE[info.league],
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Liga {info.league_name}</p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              Top {info.promote_top} sobem de divisão no fim da semana
            </p>
            <p className="mt-0.5 text-xs opacity-80">Quem não pontuar durante a semana desce.</p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
            <Timer className="mx-auto h-4 w-4 opacity-90" />
            <p className="mt-1 text-[10px] font-bold leading-tight">{daysLeft(info.week_ends_at) ?? "—"}</p>
          </div>
        </div>
      </Card>

      {/* Classificação da divisão */}
      {info.standings.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Ainda ninguém pontuou esta semana na tua divisão. Faz um simulado e lidera!
        </Card>
      ) : (
        <Card className="border-border/60 p-2 shadow-card">
          <ul className="divide-y divide-border/60">
            {info.standings.map((u, i) => {
              const isMe = u.id === user?.id;
              const inPromoZone = i < info.promote_top && u.pontos > 0;
              return (
                <li key={u.id}>
                  <Link
                    to={`/perfil/${u.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50",
                      isMe && "bg-primary/5 hover:bg-primary/10",
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                      inPromoZone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
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
                    </div>
                    {inPromoZone && <ArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                    <p className="font-display text-sm font-bold">
                      {u.pontos}<span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {myIdx === -1 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Ainda não pontuaste esta semana. Responde a questões para entrar na classificação.
        </p>
      )}
    </>
  );
};
