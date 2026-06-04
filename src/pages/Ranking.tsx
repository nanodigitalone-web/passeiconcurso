import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Medal, Trophy } from "lucide-react";

type RankRow = {
  id: string;
  nome: string;
  avatar_url: string | null;
  pontos: number;
  categoria_nome: string | null;
};

type Filtro = "todos" | "minha";

const Ranking = () => {
  const { profile, user } = useAuth();
  const [rows, setRows] = useState<RankRow[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const _categoria = filtro === "minha" && profile?.categoria_id ? profile.categoria_id : null;
    supabase
      .rpc("get_ranking", { _categoria })
      .then(({ data }) => {
        setRows((data ?? []) as RankRow[]);
        setLoading(false);
      });
  }, [filtro, profile?.categoria_id]);

  const data = rows;

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground">Os melhores candidatos do Passei</p>
      </header>

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
          <div className="mb-5 grid grid-cols-3 gap-2">
            {[1, 0, 2].map((i, slot) => {
              const u = data[i];
              if (!u) return <div key={i} />;
              const heights = ["h-24", "h-32", "h-20"];
              const colors = ["bg-gradient-to-b from-slate-300 to-slate-400", "bg-gradient-primary", "bg-gradient-to-b from-amber-500 to-amber-700"];
              const icons = [<Medal key="1" className="h-5 w-5" />, <Crown key="0" className="h-6 w-6" />, <Medal key="2" className="h-5 w-5" />];
              const isMe = u.id === user?.id;
              return (
                <div key={i} className="flex flex-col items-center justify-end">
                  <div className="mb-2 text-center">
                    <p className={cn("text-xs font-semibold truncate max-w-[90px]", isMe && "text-primary")}>{u.nome}{isMe ? " (você)" : ""}</p>
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
              {data.map((u, i) => {
                const isMe = u.id === user?.id;
                return (
                  <li
                    key={u.id}
                    className={cn(
                      "flex items-center gap-3 p-3",
                      isMe && "rounded-xl bg-primary/5"
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
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </AppShell>
  );
};

export default Ranking;
