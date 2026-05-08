import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoria } from "@/data/concursos";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Flame, Star, Lock, Trophy, BookMarked, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple deterministic trail of stages based on user's points
const STAGES = [
  { icon: Star, label: "Aquecer" },
  { icon: BookMarked, label: "Fundamentos" },
  { icon: Target, label: "Praticar" },
  { icon: Sparkles, label: "Bónus" },
  { icon: Trophy, label: "Mestre" },
];

const Aprender = () => {
  const { profile } = useAuth();
  const cat = profile?.concurso_id && profile?.categoria_id
    ? getCategoria(profile.concurso_id, profile.categoria_id)
    : null;

  // Each stage costs 50 points to unlock
  const pontos = profile?.pontos ?? 0;
  const stageDone = Math.min(STAGES.length, Math.floor(pontos / 50));

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-warning" /> Aprender
        </h1>
        <p className="text-sm text-muted-foreground">Sessões rápidas estilo trilha — ganhe pontos a cada passo</p>
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
        <p className="mt-3 text-sm opacity-95">+10 pts por acerto · sessões de 5 questões</p>
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
        <>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Sua trilha</p>
          <h2 className="mb-5 font-display text-lg font-semibold">{cat.nome}</h2>

          <div className="relative pl-2">
            {/* vertical line */}
            <div className="absolute left-[34px] top-2 bottom-2 w-1 rounded-full bg-muted" />

            <ul className="space-y-5">
              {STAGES.map((s, i) => {
                const done = i < stageDone;
                const current = i === stageDone;
                const locked = i > stageDone;
                const Icon = s.icon;
                // Alternate left/right offset for Duolingo-feel
                const offset = i % 2 === 0 ? "ml-0" : "ml-12";

                return (
                  <li key={i} className={cn("flex items-center gap-3", offset)}>
                    <div className={cn(
                      "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 shadow-card transition-smooth",
                      done && "border-success bg-success text-success-foreground",
                      current && "border-warning bg-gradient-to-br from-warning to-accent text-white animate-pulse-glow",
                      locked && "border-border bg-muted text-muted-foreground",
                    )}>
                      {locked ? <Lock className="h-6 w-6" /> : <Icon className="h-7 w-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm">Etapa {i + 1} · {s.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {done ? "Concluída" : current ? "Você está aqui" : `Desbloqueia com ${(i) * 50} pts`}
                      </p>
                      {current && (
                        <Button asChild size="sm" className="mt-2 rounded-full bg-gradient-to-r from-warning to-accent text-white">
                          <Link to={`/aprender/sessao/${profile!.concurso_id}/${profile!.categoria_id}`}>
                            Jogar agora
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Button asChild variant="outline" className="mt-6 w-full rounded-full">
            <Link to={`/aprender/sessao/${profile!.concurso_id}/${profile!.categoria_id}`}>
              <Zap className="mr-2 h-4 w-4" /> Sessão livre rápida
            </Link>
          </Button>
        </>
      )}
    </AppShell>
  );
};

export default Aprender;
