import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizService, resultsService, notificationsService } from "@/services";
import { cn } from "@/lib/utils";
import { Check, Clock, X } from "lucide-react";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/AccessGate";
import { useAuth } from "@/hooks/useAuth";

const Quiz = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(Date.now());

  // Randomize question order at start; cap at 20 per simulado
  const questoes = useMemo(
    () => (cat ? quizService.getSimuladoQuestions(concursoId!, categoriaId!, 20) : []),
    [cat]
  );

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Notifica em caso de simulado abandonado a meio
  const { user } = useAuth();
  const finishedRef = useRef(false);
  const progressRef = useRef({ idx: 0, total: 0, nome: cat?.nome ?? "" });
  progressRef.current = { idx, total: questoes.length, nome: cat?.nome ?? "" };
  useEffect(() => {
    return () => {
      const { idx: i, total: t, nome } = progressRef.current;
      if (!finishedRef.current && user && i > 0 && i < t) {
        notificationsService.create({
          userId: user.id,
          title: "Simulado interrompido ⏸",
          body: `Saíste do simulado de ${nome} na questão ${i + 1}/${t}. Volta quando puderes para terminar!`,
        });
      }
    };
  }, [user?.id]);

  const questao = questoes[idx];

  const gate = useAccessGate(concursoId, categoriaId);

  if (!cat) return <Navigate to="/concursos" replace />;
  if (!gate.loading && !gate.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-soft px-4 pt-10">
        <AccessGate concursoId={concursoId!} categoriaId={categoriaId!} categoriaNome={cat.nome}>
          <></>
        </AccessGate>
      </div>
    );
  }
  if (!questao) return <Navigate to="/concursos" replace />;

  const total = questoes.length;
  const isLast = idx === total - 1;

  const confirmar = () => {
    if (escolhida === null) return;
    setRevealed(true);
  };

  const proxima = () => {
    const novas = [...respostas, escolhida ?? -1];
    setRespostas(novas);
    setEscolhida(null);
    setRevealed(false);

    if (isLast) {
      const attempt = quizService.buildAttempt({
        userId: user?.id ?? null,
        concursoId: concursoId!,
        categoriaId: categoriaId!,
        categoriaNome: cat.nome,
        questoes,
        escolhidas: novas,
        startedAt: startedAtRef.current,
      });
      const result = resultsService.saveAttempt(attempt);
      finishedRef.current = true;
      navigate(`/resultado/${result.id}`, { state: result });
    } else {
      setIdx((i) => i + 1);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        <header className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Sair</Button>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-card">
            <Clock className="h-4 w-4 text-primary" /> {mm}:{ss}
          </div>
        </header>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Questão {idx + 1} de {total}</span>
            <span>{questao.disciplina}</span>
          </div>
          <Progress value={((idx) / total) * 100} className="h-2" />
        </div>

        <Card className="mb-5 border-border/60 p-5 shadow-card animate-fade-in">
          <p className="font-display text-lg font-semibold leading-snug">{questao.enunciado}</p>
        </Card>

        <div className="space-y-3">
          {questao.opcoes.map((op, i) => {
            const isCorrect = i === questao.correta;
            const isChosen = escolhida === i;
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => setEscolhida(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-smooth shadow-card",
                  !revealed && isChosen && "border-primary bg-primary/5",
                  !revealed && !isChosen && "border-border/60 hover:border-primary/40",
                  revealed && isCorrect && "border-success bg-success/10",
                  revealed && isChosen && !isCorrect && "border-destructive bg-destructive/10",
                  revealed && !isChosen && !isCorrect && "border-border/60 opacity-60",
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold",
                  !revealed && isChosen && "border-primary bg-primary text-primary-foreground",
                  !revealed && !isChosen && "border-border text-muted-foreground",
                  revealed && isCorrect && "border-success bg-success text-success-foreground",
                  revealed && isChosen && !isCorrect && "border-destructive bg-destructive text-destructive-foreground",
                  revealed && !isChosen && !isCorrect && "border-border text-muted-foreground",
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
          <Card className="mt-5 border-l-4 border-primary bg-primary/5 p-4 animate-fade-in">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">Comentário</p>
            <p className="text-sm leading-relaxed">{questao.comentario}</p>
          </Card>
        )}

        <div className="mt-6">
          {!revealed ? (
            <Button onClick={confirmar} disabled={escolhida === null} size="lg" className="w-full rounded-full font-semibold">
              Confirmar resposta
            </Button>
          ) : (
            <Button onClick={proxima} size="lg" className="w-full rounded-full font-semibold bg-gradient-primary">
              {isLast ? "Ver resultado" : "Próxima questão"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
