import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { battlesService, quizService, authService, type BattleRow, type Question } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Swords, Trophy, Clock, ArrowLeft } from "lucide-react";

const Batalha = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [battle, setBattle] = useState<BattleRow | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const myId = user?.id;
  const iAmDone = battle
    ? battle.challenger_id === myId
      ? battle.challenger_done
      : battle.opponent_done
    : false;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const b = await battlesService.get(id);
        if (!b) {
          setError("Batalha não encontrada.");
          return;
        }
        setBattle(b);
        const iAmChallenger = b.challenger_id === myId;
        const alreadyDone = iAmChallenger ? b.challenger_done : b.opponent_done;
        if (!alreadyDone) {
          if (iAmChallenger) {
            // Challenger plays the questions stored with the battle (their category).
            await quizService.ensureAnswers(b.concurso_id, b.categoria_id);
            const all = quizService.getQuestions(b.concurso_id, b.categoria_id);
            const byId = new Map(all.map((q) => [q.id, q]));
            const qs = b.question_ids.map((qid) => byId.get(qid)).filter(Boolean) as Question[];
            setQuestions(qs);
          } else {
            // Opponent plays 8 questions from THEIR own category — no need to
            // share the same category as the challenger.
            const conc = profile?.concurso_id;
            const cat = profile?.categoria_id;
            if (!conc || !cat) {
              setError("Escolha a sua categoria no perfil para jogar a batalha.");
              return;
            }
            await quizService.ensureAnswers(conc, cat);
            setQuestions(quizService.getSmartQuestions(conc, cat, 8));
          }
        }
      } catch (e) {
        setError("Precisa de acesso à sua categoria para jogar a batalha.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, myId, profile?.concurso_id, profile?.categoria_id]);

  const current = questions[idx];
  const total = questions.length;

  const answer = (opt: number) => {
    if (selected !== null) return;
    setSelected(opt);
    if (current && opt === current.correta) setScore((s) => s + 1);
  };

  const next = async () => {
    if (idx + 1 < total) {
      setIdx((i) => i + 1);
      setSelected(null);
      return;
    }
    // finished — submit
    setSubmitting(true);
    await battlesService.submitResult(battle!.id, score);
    const refreshed = await battlesService.get(battle!.id);
    setBattle(refreshed);
    setSubmitting(false);
  };

  const opponentName = battle?.opponent_nome ?? "Adversário";

  const resultView = useMemo(() => {
    if (!battle || !iAmDone) return null;
    const iAmChallenger = battle.challenger_id === myId;
    const myScore = iAmChallenger ? battle.challenger_score : battle.opponent_score;
    const oppScore = iAmChallenger ? battle.opponent_score : battle.challenger_score;
    const bothDone = battle.challenger_done && battle.opponent_done;
    const won = battle.winner_id === myId;
    const draw = battle.winner_id === null && bothDone;

    return (
      <Card className="overflow-hidden border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-elegant">
        <Swords className="mx-auto mb-2 h-10 w-10" />
        {!bothDone ? (
          <>
            <h2 className="font-display text-xl font-black">Resposta enviada!</h2>
            <p className="mt-1 text-sm text-white/85">
              A sua pontuação: <strong>{myScore ?? score}</strong> de {battle.question_ids.length}
            </p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/85">
              <Clock className="h-4 w-4" /> A aguardar {opponentName} terminar…
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-black">
              {draw ? "Empate!" : won ? "Você venceu! 🏆" : "Não foi desta…"}
            </h2>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div>
                <p className="text-xs text-white/70">Você</p>
                <p className="font-display text-3xl font-black">{myScore ?? 0}</p>
              </div>
              <Trophy className="h-7 w-7 text-amber-300" />
              <div>
                <p className="text-xs text-white/70">{opponentName}</p>
                <p className="font-display text-3xl font-black">{oppScore ?? 0}</p>
              </div>
            </div>
          </>
        )}
        <Button
          variant="secondary"
          className="mt-5 rounded-full"
          onClick={() => navigate("/ranking?tab=amigos")}
        >
          Voltar
        </Button>
      </Card>
    );
  }, [battle, iAmDone, myId, navigate, opponentName, score]);

  return (
    <AppShell>
      <Seo title="Batalha de Amigos · Passei" description="Desafie os seus amigos num quiz lado a lado." path="/batalha" />
      <button
        onClick={() => navigate("/ranking?tab=amigos")}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Carregando batalha…</Card>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{error}</Card>
      ) : iAmDone ? (
        resultView
      ) : (
        <>
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={battle?.opponent_avatar || undefined} />
                <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                  {opponentName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Batalha contra</p>
                <p className="text-sm font-bold">{opponentName}</p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
              {idx + 1}/{total}
            </span>
          </header>

          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all"
              style={{ width: `${total ? ((idx + (selected !== null ? 1 : 0)) / total) * 100 : 0}%` }}
            />
          </div>

          {current ? (
            <Card className="border-border/60 p-5 shadow-card">
              <p className="mb-4 font-display text-base font-bold leading-snug">{current.enunciado}</p>
              <div className="space-y-2.5">
                {current.opcoes.map((op, i) => {
                  const isCorrect = i === current.correta;
                  const isPicked = i === selected;
                  return (
                    <button
                      key={i}
                      disabled={selected !== null}
                      onClick={() => answer(i)}
                      className={cn(
                        "w-full rounded-xl border-2 p-3 text-left text-sm transition-smooth",
                        selected === null
                          ? "border-border hover:border-primary/50 hover:bg-primary/5"
                          : isCorrect
                            ? "border-success bg-success/10 text-success-foreground"
                            : isPicked
                              ? "border-destructive bg-destructive/10"
                              : "border-border opacity-60"
                      )}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
              {selected !== null && (
                <Button className="mt-4 w-full rounded-full bg-gradient-primary" onClick={next} disabled={submitting}>
                  {idx + 1 < total ? "Próxima" : submitting ? "Enviando…" : "Concluir batalha"}
                </Button>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Sem perguntas disponíveis para esta batalha.
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
};

export default Batalha;
