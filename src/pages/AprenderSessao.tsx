import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizService, authService, type Question } from "@/services";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useIsPromoActive } from "@/contexts/PromoContext";
import { cn } from "@/lib/utils";
import { Check, Flame, Heart, Lock, Trophy, X, Zap } from "lucide-react";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/AccessGate";

const SESSION_SIZE = 5;
const POINTS_PER_HIT = 4; // 5 acertos x 4 = 20 pontos máx. por sessão
const SECONDS_PER_QUESTION = 15; // tempo para responder; depois salta sozinho



const AprenderSessao = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [questoes, setQuestoes] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const answersRef = useRef<any[]>([]);

  const [idx, setIdx] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hits, setHits] = useState(0);
  const [lives, setLives] = useState<number | null>(null);
  const [livesInfo, setLivesInfo] = useState<{ max: number; nextInMs: number }>({ max: 5, nextInMs: 0 });
  const [outOfLives, setOutOfLives] = useState(false);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [dailyBlocked, setDailyBlocked] = useState(false);
  const isPromoActive = useIsPromoActive();

  // Free-tier daily limit: 1 aprender session/day (skipped during promo).
  useEffect(() => {
    if (isPromoActive) return;
    api.get<{ aprender_done: boolean; is_free: boolean }>("/content/daily-usage").then((d) => {
      if (d.is_free && d.aprender_done) setDailyBlocked(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (done && user) {
      const pontosGanhos = Math.min(20, hits * POINTS_PER_HIT);
      authService
        .addPoints(user.id, profile?.pontos || 0, pontosGanhos)
        .then(() => refreshProfile());
      // Record answered questions → feeds the infinite trail level (300/level).
      quizService.recordAprenderAttempts(answersRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);


  const isInteresses = concursoId === "interesses";
  const isPlano = concursoId === "plano";
  const catNome = cat?.nome ?? (isInteresses ? "Estudo por Interesses" : isPlano ? "Estudo por Disciplinas" : "");
  const gate = useAccessGate(concursoId, categoriaId);

  // Load the question set from the engine (mixes AI + real-exam questions, so
  // the trail never runs out) once access is confirmed.
  useEffect(() => {
    if (!gate.hasAccess || (!cat && !isInteresses && !isPlano)) return;
    setQLoading(true);
    quizService
      .loadQuestionSet(concursoId!, categoriaId!, SESSION_SIZE)
      .then((qs) => setQuestoes(qs))
      .finally(() => setQLoading(false));
  }, [gate.hasAccess, concursoId, categoriaId]);

  // Load persistent lives (recharge applied server-side) once access is confirmed.
  useEffect(() => {
    if (!gate.hasAccess) return;
    authService.getLives().then((r) => {
      setLives(r.vidas);
      setLivesInfo({ max: r.max, nextInMs: r.nextInMs });
    });
  }, [gate.hasAccess]);

  // 10-second timer per question. When it runs out before answering, the
  // question is skipped automatically (no point, no life lost).
  useEffect(() => {
    if (lives === null || qLoading || done || revealed || questoes.length === 0) return; // only while answering
    if (timeLeft <= 0) {
      setEscolhida(null);
      setRevealed(false);
      setTimeLeft(SECONDS_PER_QUESTION);
      if (outOfLives || idx >= questoes.length - 1) setDone(true);
      else setIdx((i) => i + 1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, revealed, done, lives, qLoading, outOfLives, idx, questoes.length]);



  if (dailyBlocked) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-3xl border border-border/60 bg-card p-8 text-center shadow-elegant">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Limite diário atingido</h2>
          <p className="text-sm text-muted-foreground mb-6">
            O plano gratuito permite 1 sessão de Aprender por dia. Volta amanhã ou faz upgrade.
          </p>
          <div className="flex flex-col gap-2">
            <a href="/concursos" className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white">
              Ver planos
            </a>
            <button onClick={() => navigate(-1)} className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cat && !isInteresses && !isPlano) return <Navigate to="/aprender" replace />;
  if (!gate.loading && !gate.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-soft px-4 pt-10">
        <AccessGate concursoId={concursoId!} categoriaId={categoriaId!} categoriaNome={catNome}>
          <></>
        </AccessGate>
      </div>
    );
  }
  // Still loading gate/lives/questions — show spinner, don't redirect.
  if (gate.loading || lives === null || qLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }
  if (questoes.length === 0) return <Navigate to="/aprender" replace />;

  // Entered with no lives → block practice and show the recharge countdown.
  if (lives <= 0 && !done && !revealed && idx === 0) {
    const horas = Math.floor(livesInfo.nextInMs / 3600000);
    const mins = Math.ceil((livesInfo.nextInMs % 3600000) / 60000);
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center border-border/60 shadow-card">
          <Heart className="mx-auto h-14 w-14 text-destructive/40" />
          <h2 className="mt-3 font-display text-2xl font-bold">Sem vidas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ficaste sem vidas no Aprender. Recebes 1 vida a cada 3 horas.
            {livesInfo.nextInMs > 0 && (
              <> Próxima vida em ~{horas > 0 ? `${horas}h ` : ""}{mins}min.</>
            )}
          </p>
          <Button asChild className="mt-6 w-full rounded-full bg-gradient-primary">
            <Link to="/aprender">Voltar</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const q = questoes[idx];
  const total = questoes.length;
  const isLast = idx === total - 1;

  const confirmar = () => {
    if (escolhida === null) return;
    const correct = escolhida === q.correta;
    answersRef.current.push({
      questionId: q.id,
      concursoId,
      categoriaId,
      disciplina: q.disciplina,
      correct,
      selected: escolhida,
    });
    if (correct) {
      setHits((h) => h + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
      // Wrong answer → consume a persistent life on the server.
      authService.loseLife().then((r) => {
        setLives(r.vidas);
        setLivesInfo({ max: r.max, nextInMs: r.nextInMs });
        if (r.vidas <= 0) setOutOfLives(true);
      });
    }
    setRevealed(true);
  };

  const proxima = () => {
    setEscolhida(null);
    setRevealed(false);
    setTimeLeft(SECONDS_PER_QUESTION);
    if (outOfLives || isLast) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    const perfect = hits === total;
    const taxa = total > 0 ? Math.round((hits / total) * 100) : 0;
    const pontos = Math.min(20, hits * POINTS_PER_HIT);
    const motivMsg =
      perfect
        ? "Sessão perfeita! Conquistaste todos os pontos. Segue para o próximo nível!"
        : taxa >= 60
        ? "Bom trabalho! Continua a trilhar — cada sessão aumenta o teu domínio."
        : "Não desanimes! As questões difíceis são as que mais ensinam. Tenta de novo!";
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3 animate-scale-in">
          <Card className="p-8 text-center border-0 bg-gradient-to-br from-warning to-accent text-white shadow-elegant">
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
          <p className="text-center text-sm text-muted-foreground px-2 leading-relaxed">{motivMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5">
        <header className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/aprender")}>Sair</Button>
          <div className="flex-1" />
          {!revealed && (
            <span
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors",
                timeLeft <= 2 ? "bg-destructive text-white animate-pulse" : "bg-muted text-foreground",
              )}
            >
              {timeLeft}
            </span>
          )}
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
