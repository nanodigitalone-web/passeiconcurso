import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { getRanking } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";

type Periodo = "geral" | "semanal" | "mensal";

const Ranking = () => {
  const [periodo, setPeriodo] = useState<Periodo>("geral");
  const data = getRanking(periodo);

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground">Os melhores candidatos do Passei</p>
      </header>

      <div className="mb-5 inline-flex w-full rounded-full bg-muted p-1">
        {(["geral", "semanal", "mensal"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold capitalize transition-smooth",
              periodo === p ? "bg-background text-primary shadow-card" : "text-muted-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[1, 0, 2].map((i, slot) => {
          const u = data[i];
          if (!u) return <div key={i} />;
          const heights = ["h-24", "h-32", "h-20"];
          const colors = ["bg-gradient-to-b from-slate-300 to-slate-400", "bg-gradient-primary", "bg-gradient-to-b from-amber-500 to-amber-700"];
          const icons = [<Medal key="1" className="h-5 w-5" />, <Crown key="0" className="h-6 w-6" />, <Medal key="2" className="h-5 w-5" />];
          return (
            <div key={i} className="flex flex-col items-center justify-end">
              <div className="mb-2 text-center">
                <p className={cn("text-xs font-semibold truncate max-w-[90px]", u.isUser && "text-primary")}>{u.nome}</p>
                <p className="text-[11px] text-muted-foreground">{u.pontos} pts</p>
              </div>
              <div className={cn(heights[slot], colors[slot], "flex w-full items-start justify-center rounded-t-2xl pt-3 text-white shadow-card")}>
                {icons[slot]}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="border-border/60 p-2 shadow-card">
        <ul className="divide-y divide-border/60">
          {data.map((u, i) => (
            <li
              key={u.nome + i}
              className={cn(
                "flex items-center gap-3 p-3",
                u.isUser && "rounded-xl bg-primary/5"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", u.isUser && "text-primary")}>{u.nome}</p>
              </div>
              <p className="font-display text-sm font-bold">{u.pontos}<span className="ml-1 text-xs font-normal text-muted-foreground">pts</span></p>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
};

export default Ranking;
