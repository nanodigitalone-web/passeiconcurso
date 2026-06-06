import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizService, authService, type Question } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Check, Flame, Heart, Trophy, X, Zap } from "lucide-react";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/AccessGate";

const SESSION_SIZE = 5;
const POINTS_PER_HIT = 10;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const AprenderSessao = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const questoes = useMemo<Question[]>(
    () => (cat ? quizService.getSimuladoQuestions(concursoId!, categoriaId!, SESSION_SIZE) : []),
    [cat]
  );

  const [idx, setIdx] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hits, setHits] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done && user) {
      const pontosGanhos = hits * POINTS_PER_HIT + (hits === SESSION_SIZE ? 20 : 0);
      authService
        .addPoints(user.id, profile?.pontos || 0, pontosGanhos)
        .then(() => refreshProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const gate = useAccessGate(concursoId, categoriaId);

  if (!cat) return <Navigate to="/aprender" replace />;
  if (!gate.loading && !gate.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-soft px-4 pt-10">
        <AccessGate concursoId={concursoId!} categoriaId={categoriaId!} categoriaNome={cat.nome}>
          <></>
        </AccessGate>
      </div>
    );
  }
  if (questoes.length === 0) return <Navigate to="/aprender" replace />;

  const q = questoes[idx];
  const total = questoes.length;
  const isLast = idx === total - 1;

  const confirmar = () => {
    if (escolhida === null) return;
    const correct = escolhida === q.correta;
    if (correct) {
      setHits((h) => h + 1);
      setCombo((c) => c + 1);
    } else {
      setLives((l) => l - 1);
      setCombo(0);
    }
    setRevealed(true);
  };

  const proxima = () => {
    setEscolhida(null);
    setRevealed(false);
    if (lives - (escolhida !== q.correta ? 1 : 0) <= 0 || isLast) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    const perfect = hits === total;
    const pontos = hits * POINTS_PER_HIT + (perfect ? 20 : 0);
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center border-0 bg-gradient-to-br from-warning to-accent text-white shadow-elegant animate-scale-in">
          <Trophy className="mx-auto h-16 w-16 animate-float" />
          <h2 className="mt-3 font-display text-3xl font-bold">{perfect ? "Perfeito!" : "Bom trabalho!"}</h2>
          <p className="mt-1 opacity-90">{hits} de {total} acertos</p>
          <p className="mt-6 font-display text-5xl font-bold">+{pontos}</p>
          <p className="text-sm opacity-90">pontos conquistados</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button asChild variant="secondary" className="rounded-full font-semibold">
              <Link to="/aprender">Voltar</Link>
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary" className="rounded-full font-semibold">
              Jogar novo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5">
        <header className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/aprender")}>Sair</Button>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1 text-sm font-bold text-destructive">
            <Heart className="h-4 w-4 fill-destructive" /> {lives}
          </span>
          {combo > 1 && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-warning animate-fade-in">
              <Flame className="h-4 w-4 fill-warning" /> {combo}
            </span>
          )}
        </header>

        <Progress value={((idx) / total) * 100} className="h-3 mb-5" />

        <Card className="mb-5 border-border/60 p-5 shadow-card animate-fade-in">
          <p className="text-xs font-bold uppercase tracking-wider text-warning mb-2 inline-flex items-center gap-1">
            <Zap className="h-3 w-3" /> {q.disciplina}
          </p>
          <p className="font-display text-lg font-semibold leading-snug">{q.enunciado}</p>
        </Card>

        <div className="space-y-2.5">
          {q.opcoes.map((op, i) => {
            const isCorrect = i === q.correta;
            const isChosen = escolhida === i;
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => setEscolhida(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-smooth shadow-card",
                  !revealed && isChosen && "border-primary bg-primary/5 scale-[0.99]",
                  !revealed && !isChosen && "border-border/60 hover:border-primary/40",
                  revealed && isCorrect && "border-success bg-success/10",
                  revealed && isChosen && !isCorrect && "border-destructive bg-destructive/10",
                  revealed && !isChosen && !isCorrect && "border-border/60 opacity-50",
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold",
                  !revealed && isChosen && "border-primary bg-primary text-primary-foreground",
                  !revealed && !isChosen && "border-border text-muted-foreground",
                  revealed && isCorrect && "border-success bg-success text-success-foreground",
                  revealed && isChosen && !isCorrect && "border-destructive bg-destructive text-destructive-foreground",
                )}>
                  {revealed && isCorrect ? <Check className="h-4 w-4" /> :
                   revealed && isChosen && !isCorrect ? <X className="h-4 w-4" /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium leading-snug">{op}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <Card className={cn(
            "mt-4 border-l-4 p-4 animate-fade-in",
            escolhida === q.correta ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
          )}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1">
              {escolhida === q.correta ? "✓ Correto!" : "✗ Resposta correta: " + q.opcoes[q.correta]}
            </p>
            <p className="text-sm leading-relaxed">{q.comentario}</p>
          </Card>
        )}

        <div className="mt-5">
          {!revealed ? (
            <Button onClick={confirmar} disabled={escolhida === null} size="lg" className="w-full rounded-full font-semibold bg-gradient-to-r from-warning to-accent text-white">
              Confirmar
            </Button>
          ) : (
            <Button onClick={proxima} size="lg" className="w-full rounded-full font-semibold bg-gradient-primary">
              {isLast ? "Ver resultado" : "Continuar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AprenderSessao;
