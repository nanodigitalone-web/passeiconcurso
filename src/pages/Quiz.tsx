import { useEffect, useRef, useState } from "react";
import type { Question } from "@/data/concursos";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizService, notificationsService, authService } from "@/services";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BookOpen, Check, Clock, Flame, Lock, X, Zap } from "lucide-react";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/AccessGate";
import { useAuth } from "@/hooks/useAuth";
import { useIsPromoActive } from "@/contexts/PromoContext";
import { MotivationModal, type MotivationVariant } from "@/components/MotivationModal";

// Animated loading screen shown while questions are fetched from the server.
const QuizLoader = ({ catNome }: { catNome: string }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const TARGET = 88;
    const DURATION = 2800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min(TARGET, ((now - start) / DURATION) * TARGET);
      setProgress(pct);
      if (pct < TARGET) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-xs text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold mb-1">A preparar o simulado</h2>
        <p className="text-sm text-muted-foreground mb-6">{catNome} · seleção inteligente de questões</p>
        <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

const COUNT_CONFIG = [
  { n: 20,  label: "Rápido",  desc: "Revisão expressa, sem pressão",   time: "~10 min", Icon: Zap,      iconBg: "bg-emerald-100 text-emerald-700", border: "hover:border-emerald-400/50", badge: "bg-emerald-100 text-emerald-700" },
  { n: 50,  label: "Normal",  desc: "Formato padrão de simulado real", time: "~25 min", Icon: BookOpen, iconBg: "bg-sky-100 text-sky-700",     border: "hover:border-sky-400/50",     badge: "bg-sky-100 text-sky-700"     },
  { n: 100, label: "Intenso", desc: "Preparação aprofundada e séria",  time: "~50 min", Icon: Flame,    iconBg: "bg-violet-100 text-violet-700", border: "hover:border-violet-400/50",  badge: "bg-violet-100 text-violet-700" },
];

const Quiz = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [questoes, setQuestoes] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [motivation, setMotivation] = useState<MotivationVariant | null>(null);
  const motivationShownRef = useRef<Set<MotivationVariant>>(new Set());
  const startedAtRef = useRef(Date.now());
  const [dailyBlocked, setDailyBlocked] = useState(false);
  const isPromoActive = useIsPromoActive();

  // Free-tier daily limit: 1 simulado/day (skipped during promo).
  useEffect(() => {
    if (isPromoActive) return;
    api.get<{ simulado_done: boolean; is_free: boolean }>("/content/daily-usage").then((d) => {
      if (d.is_free && d.simulado_done) setDailyBlocked(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Notifica em caso de simulado abandonado a meio
  const { user, profile, refreshProfile } = useAuth();
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

  const isInteresses = concursoId === "interesses";
  const isPlano = concursoId === "plano";
  const catNome = cat?.nome ?? (isInteresses ? "Estudo por Interesses" : isPlano ? "Estudo por Disciplinas" : "");

  // Load the question set (mixed old+new, personalized, options shuffled
  // server-side) once access is confirmed and a length is chosen.
  useEffect(() => {
    if (!gate.hasAccess || (!cat && !isInteresses && !isPlano) || count === null) return;
    setLoading(true);
    quizService
      .loadQuestionSet(concursoId!, categoriaId!, count)
      .then((qs) => setQuestoes(qs))
      .finally(() => setLoading(false));
  }, [gate.hasAccess, concursoId, categoriaId, count]);


  if (!cat && !isInteresses && !isPlano) return <Navigate to="/concursos" replace />;
  if (!gate.loading && !gate.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-soft px-4 pt-10">
        <AccessGate concursoId={concursoId!} categoriaId={categoriaId!} categoriaNome={catNome}>
          <></>
        </AccessGate>
      </div>
    );
  }

  // Free-tier daily limit reached.
  if (dailyBlocked) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
        <Card className="max-w-sm w-full p-8 text-center shadow-elegant">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Limite diário atingido</h2>
          <p className="text-sm text-muted-foreground mb-6">
            O plano gratuito permite 1 simulado por dia. Volta amanhã ou faz upgrade para estudar sem limites.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="rounded-full bg-gradient-primary">
              <a href="/concursos">Ver planos</a>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Length selection screen (20 / 50 / 100) shown before the simulado starts.
  if (count === null) {
    const start = (n: number) => {
      startedAtRef.current = Date.now();
      setSeconds(0);
      setLoading(true);
      setCount(n);
    };
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
          <header className="mb-6 flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Sair</Button>
          </header>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{catNome}</p>
            <h1 className="font-display text-3xl font-bold">Escolhe o formato</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Seleção inteligente — priorizamos questões novas e as que erraste.</p>
          </div>

          <div className="space-y-3">
            {COUNT_CONFIG.map(({ n, label, desc, time, Icon, iconBg, border, badge }) => (
              <button
                key={n}
                onClick={() => start(n)}
                className={`group flex w-full items-center gap-4 rounded-2xl border-2 border-border/60 bg-card p-5 text-left shadow-card transition-all duration-200 ${border} hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-xl font-bold">{n} questões</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge}`}>{label}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-tight">{desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />{time}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Máx. <strong>50 pontos</strong> por simulado · sem limite de tentativas diárias
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <QuizLoader catNome={catNome} />;
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
      const result = quizService.submitAnswers({
        userId: user?.id ?? null,
        concursoId: concursoId!,
        categoriaId: categoriaId!,
        categoriaNome: catNome,
        questoes,
        escolhidas: novas,
        startedAt: startedAtRef.current,
      });
      finishedRef.current = true;
      // Pontos do simulado: 1 pt por acerto, no máximo 50 por simulado.
      // Sem limite diário — pode fazer simulados as vezes que quiser.
      if (user && result.acertos > 0) {
        authService
          .addPoints(user.id, profile?.pontos || 0, Math.min(50, result.acertos))
          .then((res) => {
            if (res?.error) toast.error("Não foi possível guardar os pontos. Verifica a tua ligação.");
            else refreshProfile();
          })
          .catch(() => toast.error("Não foi possível guardar os pontos. Verifica a tua ligação."));
      }
      navigate(`/resultado/${result.id}`, { state: result });
    } else {
      const nextIdx = idx + 1;
      const pct = (nextIdx / total) * 100;
      const shown = motivationShownRef.current;
      if (pct >= 75 && !shown.has("threequarter")) {
        shown.add("threequarter");
        setMotivation("threequarter");
      } else if (pct >= 30 && !shown.has("quarter")) {
        shown.add("quarter");
        setMotivation("quarter");
      }
      setIdx(nextIdx);
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

      <MotivationModal
        open={motivation !== null}
        variant={motivation ?? "quarter"}
        progress={(idx / total) * 100}
        onClose={() => setMotivation(null)}
      />
    </div>
  );
};

export default Quiz;
