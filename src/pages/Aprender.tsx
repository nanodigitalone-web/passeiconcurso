import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { quizService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Flame, Lock, Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const Aprender = () => {
  const { profile } = useAuth();
  const concursoId = profile?.concurso_id ?? null;
  const categoriaId = profile?.categoria_id ?? null;
  const cat = concursoId && categoriaId ? quizService.getCategoria(concursoId, categoriaId) : null;

  const pontos = profile?.pontos_globais ?? profile?.pontos ?? 0;

  const [info, setInfo] = useState<{ level: number; doneInLevel: number; perLevel: number } | null>(null);

  useEffect(() => {
    if (!concursoId || !categoriaId) return;
    quizService.getAprenderLevel(concursoId, categoriaId).then(setInfo);
  }, [concursoId, categoriaId]);

  const level = info?.level ?? 1;
  const perLevel = info?.perLevel ?? 300;
  const doneInLevel = info?.doneInLevel ?? 0;

  // Infinite trail: render a window of levels around the current one.
  const start = Math.max(1, level - 2);
  const windowLevels = Array.from({ length: 10 }, (_, i) => start + i);
  const wave = [0, 1, 2, 1, 0, -1, -2, -1];

  return (
    <AppShell>
      <Seo
        title="Aprender · Trilhas de Estudo para Concursos"
        description="Estude com trilhas infinitas por níveis e sessões rápidas de questões para concursos públicos da saúde em Angola e ganhe pontos."
        path="/aprender"
      />
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-warning" /> Aprender
        </h1>
        <p className="text-sm text-muted-foreground">
          Trilha infinita por níveis — cada nível tem {perLevel} questões. Quanto mais avança, mais sobe.
        </p>
      </header>

      <Card className="mb-6 overflow-hidden rounded-3xl border-0 bg-gradient-hero p-5 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Seus pontos</p>
            <p className="font-display text-4xl font-bold leading-none">{pontos.toLocaleString("pt-PT")}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <Flame className="h-5 w-5" />
            <span className="font-display text-lg font-bold leading-none">{profile?.streak ?? 0}</span>
          </div>
        </div>
        {cat && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm opacity-95">
              <span className="font-semibold">Nível {level} · {cat.nome}</span>
              <span>{doneInLevel}/{perLevel}</span>
            </div>
            <Progress value={(doneInLevel / perLevel) * 100} className="h-2 bg-white/25" />
          </div>
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
          {windowLevels.map((lvl, i) => {
            const done = lvl < level;
            const current = lvl === level;
            const locked = lvl > level;
            const offset = wave[i % wave.length] * 34;

            return (
              <li
                key={lvl}
                className="flex w-full flex-col items-center"
                style={{ transform: `translateX(${offset}px)` }}
              >
                {current || done ? (
                  <Link
                    to={`/aprender/sessao/${concursoId}/${categoriaId}`}
                    aria-label={`Nível ${lvl}`}
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
                      {done ? <Check className="h-7 w-7" strokeWidth={3} /> : <Play className="h-7 w-7 fill-current" />}
                    </span>
                    {current && (
                      <span className="mt-2 rounded-xl border-2 border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary shadow-card">
                        Começar
                      </span>
                    )}
                  </Link>
                ) : (
                  <span className="flex h-[68px] w-[72px] items-center justify-center rounded-[40%] bg-muted text-muted-foreground shadow-[0_6px_0_0_hsl(var(--border))]">
                    <Lock className="h-5 w-5" />
                  </span>
                )}
                <p
                  className={cn(
                    "mt-2 text-center text-xs font-semibold leading-snug",
                    locked ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  Nível {lvl}
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
