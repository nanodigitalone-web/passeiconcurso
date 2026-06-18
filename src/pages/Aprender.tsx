import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
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
      <Seo
        title="Aprender · Trilhas de Estudo para Concursos"
        description="Estude com trilhas diárias e sessões rápidas de questões para concursos públicos da saúde em Angola e ganhe pontos."
        path="/aprender"
      />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-warning" /> Aprender
        </h1>
        <p className="text-sm text-muted-foreground">
          Trilha de dias — avance um tema por vez e ganhe pontos a cada dia concluído.
        </p>
      </header>

      <Card className="mb-6 overflow-hidden rounded-3xl border-0 bg-gradient-hero p-5 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Seus pontos</p>
            <p className="font-display text-4xl font-bold leading-none">{pontos}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <Flame className="h-5 w-5" />
            <span className="font-display text-lg font-bold leading-none">{profile?.streak ?? 0}</span>
          </div>
        </div>
        {cat && (
          <p className="mt-3 text-sm opacity-95">
            Dia {Math.min(currentDay + 1, days.length)} de {days.length} · {cat.nome}
          </p>
        )}
      </Card>

      {!cat ? (
        <Card className="rounded-3xl border-2 border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Escolha a sua categoria profissional para começar a trilha.
          </p>
          <Button asChild className="mt-4">
            <Link to="/concursos">Escolher categoria</Link>
          </Button>
        </Card>
      ) : (
        <ul className="relative mx-auto flex max-w-md flex-col items-center gap-6 py-4">
          {days.map((titulo, i) => {
            const done = i <= completedDay;
            const current = i === currentDay;
            const locked = i > currentDay;
            const isReview = i === days.length - 1;
            // Serpentine horizontal offset (Duolingo winding path)
            const wave = [0, 1, 2, 1, 0, -1, -2, -1];
            const offset = wave[i % wave.length] * 34;

            return (
              <li
                key={i}
                className="flex w-full flex-col items-center"
                style={{ transform: `translateX(${offset}px)` }}
              >
                {(current || done) && !locked ? (
                  <Link
                    to={`/aprender/sessao/${concursoId}/${categoriaId}?dia=${i}`}
                    aria-label={titulo}
                    className="group flex flex-col items-center"
                  >
                    <span
                      className={cn(
                        "relative flex h-[68px] w-[72px] items-center justify-center rounded-[40%] text-white transition-transform group-active:translate-y-1",
                        done
                          ? "bg-success shadow-[0_6px_0_0_hsl(var(--primary-deep))]"
                          : "bg-accent shadow-[0_6px_0_0_hsl(var(--accent-deep))]",
                        current && "animate-float",
                      )}
                    >
                      {done ? (
                        <Check className="h-7 w-7" strokeWidth={3} />
                      ) : isReview ? (
                        <Trophy className="h-7 w-7" />
                      ) : (
                        <Play className="h-7 w-7 fill-current" />
                      )}
                    </span>
                    {current && (
                      <span className="mt-2 rounded-xl border-2 border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary shadow-card">
                        Começar
                      </span>
                    )}
                  </Link>
                ) : (
                  <span className="flex h-[68px] w-[72px] items-center justify-center rounded-[40%] bg-muted text-muted-foreground shadow-[0_6px_0_0_hsl(var(--border))]">
                    {isReview ? <Trophy className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                  </span>
                )}
                <p
                  className={cn(
                    "mt-2 max-w-[180px] text-center text-xs font-semibold leading-snug",
                    locked ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {isReview ? "Revisão geral" : titulo}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Aprender;
