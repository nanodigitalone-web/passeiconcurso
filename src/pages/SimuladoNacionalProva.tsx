import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { examsService, type ExamQuestion, type ExamRanking } from "@/services";
import { PlanBadge } from "@/components/PlanBadge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Medal, Timer, Trophy, Zap } from "lucide-react";

const fmtClock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtDuration = (ms: number | null) => {
  if (ms == null) return "—";
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}min ${String(s).padStart(2, "0")}s`;
};

type Phase = "loading" | "exam" | "result" | "ranking" | "error";

const SimuladoNacionalProva = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [examTitle, setExamTitle] = useState("Simulado Nacional");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [deadline, setDeadline] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [idx, setIdx] = useState(0);
  const answersRef = useRef<Record<string, number>>({});
  const [, forceRender] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pontos: number } | null>(null);
  const [ranking, setRanking] = useState<ExamRanking | null>(null);

  // Decide the phase: ranking (finished/ended) or start the exam.
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await examsService.ranking(id);
        setExamTitle(r.exam.title);
        if (r.exam.ended || r.my_entry?.finished_at) {
          setRanking(r);
          setPhase("ranking");
          return;
        }
        if (!r.my_entry) {
          setErrorMsg("Ainda não estás inscrito neste simulado.");
          setPhase("error");
          return;
        }
        const s = await examsService.start(id);
        setQuestions(s.questions);
        setDeadline(new Date(s.deadline).getTime());
        setRemaining(s.remaining_ms);
        setPhase("exam");
      } catch (e: any) {
        setErrorMsg(
          e?.code === "not_started_yet" ? "O simulado ainda não abriu. Volta à hora marcada."
          : e?.code === "time_over" ? "O teu tempo esgotou sem entrega."
          : e?.code === "not_joined" ? "Ainda não estás inscrito neste simulado."
          : "Não foi possível abrir o simulado.",
        );
        setPhase("error");
      }
    })();
  }, [id]);

  const submit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await examsService.submit(id!, answersRef.current);
      setResult({ score: r.score, total: r.total, pontos: r.pontos });
      setPhase("result");
      refreshProfile();
      if (auto) toast.info("Tempo esgotado — prova entregue automaticamente.");
    } catch {
      toast.error("Falha ao entregar. A tentar de novo em 5s…");
      setTimeout(() => { setSubmitting(false); submit(auto); }, 5000);
      return;
    }
    setSubmitting(false);
  };

  // Countdown → auto-submit when it hits zero.
  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      const ms = deadline - Date.now();
      setRemaining(ms);
      if (ms <= 0) {
        clearInterval(t);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  const loadRanking = async () => {
    try {
      const r = await examsService.ranking(id!);
      setRanking(r);
      setPhase("ranking");
    } catch {
      toast.error("Não foi possível carregar a classificação.");
    }
  };

  // ── Loading / erro ─────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center border-border/60 shadow-card">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-3 font-display text-xl font-bold">{examTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
          <Button asChild className="mt-6 w-full rounded-full bg-gradient-primary">
            <Link to="/simulado-nacional">Voltar aos eventos</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // ── Resultado imediato ─────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const taxa = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3 animate-scale-in">
          <Card className="p-8 text-center border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 text-white shadow-elegant">
            <Trophy className="mx-auto h-16 w-16 animate-float" />
            <h2 className="mt-3 font-display text-3xl font-bold">Prova entregue!</h2>
            <p className="mt-1 opacity-90">{result.score} de {result.total} acertos ({taxa}%)</p>
            <p className="mt-6 font-display text-5xl font-bold">+{result.pontos}</p>
            <p className="text-sm opacity-90">pontos conquistados</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button asChild variant="secondary" className="rounded-full font-semibold">
                <Link to="/simulado-nacional">Voltar</Link>
              </Button>
              <Button onClick={loadRanking} variant="secondary" className="rounded-full font-semibold">
                Classificação
              </Button>
            </div>
          </Card>
          <p className="text-center text-sm text-muted-foreground px-2 leading-relaxed">
            A classificação final e os prémios são atribuídos quando a janela do evento fechar.
          </p>
        </div>
      </div>
    );
  }

  // ── Classificação ──────────────────────────────────────────────────────────
  if (phase === "ranking" && ranking) {
    const ended = ranking.exam.ended;
    const me = ranking.my_entry;
    return (
      <AppShell>
        <Seo title={`${examTitle} · Classificação`} description="Classificação do Simulado Nacional." path={`/simulado-nacional/${id}`} />
        <header className="mb-5 animate-fade-in">
          <h1 className="font-display text-2xl font-bold">{examTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {ended ? "Classificação final" : "Classificação parcial — o evento ainda decorre"}
          </p>
        </header>

        {me?.finished_at && (
          <Card className="mb-4 flex items-center gap-4 border-0 bg-gradient-to-r from-primary to-indigo-700 p-4 text-white shadow-elegant">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Medal className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">O teu resultado</p>
              <p className="font-display text-lg font-bold leading-tight">
                {me.score}/{me.total} acertos
              </p>
              <p className="text-xs opacity-80">tempo: {fmtDuration(me.duration_ms)}</p>
            </div>
          </Card>
        )}

        {!ranking.standings || ranking.standings.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Ainda ninguém terminou. As posições aparecem à medida que os candidatos entregam.
          </Card>
        ) : (
          <Card className="border-border/60 p-2 shadow-card">
            <ul className="divide-y divide-border/60">
              {ranking.standings.map((u, i) => {
                const isMe = u.id === user?.id;
                const medal = ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-800", "bg-amber-700 text-amber-50"][i];
                return (
                  <li key={u.id}>
                    <Link
                      to={`/perfil/${u.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50",
                        isMe && "bg-primary/5 hover:bg-primary/10",
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                        i < 3 ? medal : "bg-muted text-muted-foreground",
                      )}>
                        {i + 1}
                      </div>
                      <PlanBadge planId={u.plan_id} size="sm">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                            {u.nome?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </PlanBadge>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", isMe && "text-primary")}>
                          {u.nome}{isMe ? " (você)" : ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{fmtDuration(u.duration_ms)}</p>
                      </div>
                      <p className="font-display text-sm font-bold">
                        {u.score}<span className="ml-0.5 text-xs font-normal text-muted-foreground">/{u.total}</span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Button asChild variant="outline" className="mt-5 w-full rounded-full font-semibold">
          <Link to="/simulado-nacional">Voltar aos eventos</Link>
        </Button>
      </AppShell>
    );
  }

  // ── Prova ──────────────────────────────────────────────────────────────────
  const q = questions[idx];
  if (!q) return null;
  const total = questions.length;
  const answered = Object.keys(answersRef.current).length;
  const selected = answersRef.current[q.id];
  const lowTime = remaining <= 60_000;

  const escolher = (i: number) => {
    answersRef.current[q.id] = i;
    forceRender((n) => n + 1);
    // Avança sozinho, excepto na última questão.
    if (idx < total - 1) setTimeout(() => setIdx((v) => Math.min(v + 1, total - 1)), 150);
  };

  const entregar = () => {
    const falta = total - Object.keys(answersRef.current).length;
    if (falta > 0 && !window.confirm(`Tens ${falta} questões por responder. Entregar mesmo assim?`)) return;
    submit();
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5">
        <header className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost" size="sm"
            onClick={() => { if (window.confirm("Sair? O cronómetro continua a contar.")) navigate("/simulado-nacional"); }}
          >
            Sair
          </Button>
          <div className="flex-1" />
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-sm font-bold",
            lowTime ? "bg-destructive text-white animate-pulse" : "bg-muted text-foreground",
          )}>
            <Timer className="h-3.5 w-3.5" /> {fmtClock(remaining)}
          </span>
          <Button size="sm" variant="outline" className="rounded-full font-semibold" onClick={entregar} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entregar"}
          </Button>
        </header>

        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Questão {idx + 1} de {total}</span>
          <span>{answered} respondidas</span>
        </div>
        <Progress value={(answered / total) * 100} className="h-3 mb-5" />

        <Card className="mb-5 border-border/60 p-5 shadow-card animate-fade-in">
          {q.disciplina && (
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 inline-flex items-center gap-1">
              <Zap className="h-3 w-3" /> {q.disciplina}
            </p>
          )}
          <p className="font-display text-lg font-semibold leading-snug">{q.enunciado}</p>
        </Card>

        <div className="space-y-2.5">
          {q.opcoes.map((op, i) => {
            const isChosen = selected === i;
            return (
              <button
                key={i}
                onClick={() => escolher(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-smooth shadow-card",
                  isChosen ? "border-primary bg-primary/5 scale-[0.99]" : "border-border/60 hover:border-primary/40",
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold",
                  isChosen ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium leading-snug">{op}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button
            variant="outline" size="lg"
            className="flex-1 rounded-full font-semibold"
            disabled={idx === 0}
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          {idx < total - 1 ? (
            <Button size="lg" className="flex-1 rounded-full font-semibold bg-gradient-primary" onClick={() => setIdx((v) => v + 1)}>
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" className="flex-1 rounded-full font-bold bg-gradient-primary" onClick={entregar} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entregar prova"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladoNacionalProva;
