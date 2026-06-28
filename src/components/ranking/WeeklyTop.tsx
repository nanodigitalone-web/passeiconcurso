import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { rankingService, type RankRow } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Sparkles, PartyPopper } from "lucide-react";

export const WeeklyTop = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rankingService
      .getWeeklyRanking()
      .then((d) => setRows(d.slice(0, 5)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>;
  }

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ainda ninguém pontuou esta semana. Faça um simulado e lidere o ranking!
      </Card>
    );
  }

  const champion = rows[0];
  const isMeChampion = champion.id === user?.id;

  return (
    <div className="space-y-4">
      {/* Giant winner banner */}
      <Card className="relative overflow-hidden border-0 bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Líder da semana
          </div>
          <div className="relative my-2">
            <Crown className="absolute -top-7 left-1/2 h-9 w-9 -translate-x-1/2 fill-amber-300 text-amber-300 drop-shadow animate-float" />
            <Avatar className="h-24 w-24 ring-4 ring-white/70 shadow-elegant">
              <AvatarImage src={champion.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 font-display text-3xl font-black text-white">
                {champion.nome?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="font-display text-xl font-black">{champion.nome}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <PartyPopper className="h-4 w-4" />
            {isMeChampion ? "Parabéns, você está em 1.º!" : "Parabéns ao nosso campeão!"}
          </p>
          <div className="mt-3 rounded-full bg-white/20 px-4 py-1.5 font-display text-lg font-black">
            {champion.pontos} <span className="text-sm font-semibold opacity-80">pts esta semana</span>
          </div>
        </div>
      </Card>

      {/* Rest of top 5 */}
      <Card className="border-border/60 p-2 shadow-card">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Top 5 da semana
        </p>
        <ul className="divide-y divide-border/60">
          {rows.map((u, i) => {
            const isMe = u.id === user?.id;
            return (
              <li key={u.id} className={cn("flex items-center gap-3 p-3", isMe && "rounded-xl bg-primary/5")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                    i === 0
                      ? "bg-amber-500 text-white"
                      : i < 3
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {u.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", isMe && "text-primary")}>
                    {u.nome}
                    {isMe ? " (você)" : ""}
                  </p>
                  {u.categoria_nome && (
                    <p className="truncate text-[11px] text-muted-foreground">{u.categoria_nome}</p>
                  )}
                </div>
                <p className="font-display text-sm font-bold">
                  {u.pontos}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
                </p>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
};
