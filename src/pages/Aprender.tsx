import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Flame, Lock, Trophy, Check, Play, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

const Aprender = () => {
  const { profile } = useAuth();
  const concursoId = profile?.concurso_id ?? null;
  const categoriaId = profile?.categoria_id ?? null;
  const cat = concursoId && categoriaId ? quizService.getCategoria(concursoId, categoriaId) : null;

  const pontos = profile?.pontos ?? 0;

  // Build the trail: one "day" per topic block, plus a final review day with all themes.
  const topicDays = cat ? (cat.topicos?.map((t) => t.titulo) ?? cat.disciplinas) : [];
  const days = cat ? [...topicDays, "Revisão geral — todos os temas"] : [];

  const completedDay = cat ? quizService.getLearnDay(concursoId!, categoriaId!) : -1;
  const currentDay = completedDay + 1;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-warning" /> Aprender
        </h1>
        <p className="text-sm text-muted-foreground">
          Trilha de dias — avance um tema por vez e ganhe pontos a cada dia concluído.
        </p>
      </header>

      <Card className="mb-5 overflow-hidden border-0 bg-gradient-to-br from-warning to-accent p-5 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Seus pontos</p>
            <p className="font-display text-4xl font-bold leading-none">{pontos}</p>
          </div>
          <div className="text-right">
            <Flame className="ml-auto h-6 w-6" />
            <p className="text-xs">{profile?.streak ?? 0} dias</p>
          </div>
        </div>
        {cat && (
          <p className="mt-3 text-sm opacity-95">
            Dia {Math.min(currentDay + 1, days.length)} de {days.length} · {cat.nome}
          </p>
        )}
      </Card>

      {!cat ? (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            Escolha a sua categoria profissional para começar a trilha.
          </p>
          <Button asChild className="mt-4 rounded-full bg-gradient-primary">
            <Link to="/concursos">Escolher categoria</Link>
          </Button>
        </Card>
      ) : (
        <div className="relative pl-2">
          <div className="absolute left-[26px] top-3 bottom-3 w-1 rounded-full bg-muted" />
          <ul className="space-y-4">
            {days.map((titulo, i) => {
              const done = i <= completedDay;
              const current = i === currentDay;
              const locked = i > currentDay;
              const isReview = i === days.length - 1;

              return (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 shadow-card transition-smooth",
                      done && "border-success bg-success text-success-foreground",
                      current && "border-warning bg-gradient-to-br from-warning to-accent text-white animate-pulse",
                      locked && "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="h-5 w-5" />
                    ) : locked ? (
                      <Lock className="h-4 w-4" />
                    ) : isReview ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <span className="font-display text-sm font-bold">{i + 1}</span>
                    )}
                  </div>

                  <Card
                    className={cn(
                      "flex-1 border-border/60 p-3 shadow-card",
                      current && "border-warning/50 ring-1 ring-warning/30",
                      locked && "opacity-70"
                    )}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isReview ? "Dia final" : `Dia ${i + 1}`}
                    </p>
                    <p className="mt-0.5 flex items-start gap-1.5 font-display text-sm font-semibold leading-snug">
                      <BookMarked className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {titulo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {done ? "Concluído ✓" : current ? "Disponível agora" : "Bloqueado"}
                    </p>
                    {(current || done) && (
                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "mt-2 rounded-full",
                          current
                            ? "bg-gradient-to-r from-warning to-accent text-white"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        <Link to={`/aprender/sessao/${concursoId}/${categoriaId}?dia=${i}`}>
                          <Play className="mr-1 h-3.5 w-3.5" />
                          {done ? "Rever dia" : "Começar dia"}
                        </Link>
                      </Button>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AppShell>
  );
};

export default Aprender;
