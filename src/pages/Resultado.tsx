import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService, resultsService, type QuizResult } from "@/services";
import { Award, Check, Clock, Home, RotateCcw, Sparkles, TrendingUp, X } from "lucide-react";

const Resultado = () => {
  const { id } = useParams();
  const loc = useLocation();
  const stored = (loc.state as QuizResult) || resultsService.getResultById(id!);
  const [, setAnswersReady] = useState(false);

  // Hydrate explanations (gated) so the error report can show comments even
  // after a page refresh. Stored answers already carry the correct index.
  useEffect(() => {
    if (stored) {
      quizService.ensureAnswers(stored.concursoId, stored.categoriaId)
        .then(() => setAnswersReady(true))
        .catch(() => {});
    }
  }, [stored?.concursoId, stored?.categoriaId]);

  if (!stored) return (
    <AppShell>
      <p className="py-12 text-center text-muted-foreground">Resultado não encontrado.</p>
    </AppShell>
  );

  const cat = quizService.getCategoria(stored.concursoId, stored.categoriaId);
  const taxa = Math.round((stored.acertos / stored.total) * 100);
  const erros = stored.respostas.filter((r) => r.escolhida !== r.correta);
  const mm = String(Math.floor(stored.tempoSegundos / 60)).padStart(2, "0");
  const ss = String(stored.tempoSegundos % 60).padStart(2, "0");

  const msg = taxa >= 80 ? "Excelente!" : taxa >= 60 ? "Bom trabalho!" : taxa >= 40 ? "Continue praticando" : "Revise o conteúdo";

  return (
    <AppShell>
      <Card className="mb-6 overflow-hidden border-0 bg-gradient-hero p-6 text-center text-primary-foreground shadow-elegant animate-scale-in">
        <Award className="mx-auto h-12 w-12 animate-float" />
        <p className="mt-3 text-sm opacity-90">{msg}</p>
        <p className="font-display text-5xl font-bold leading-none">{taxa}%</p>
        <p className="mt-2 text-sm opacity-90">{stored.acertos} de {stored.total} corretas · {mm}:{ss}</p>
        <p className="mt-1 text-xs opacity-75">{stored.categoriaNome}</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-success">
            <Check className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Acertos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{stored.acertos}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-destructive">
            <X className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Erros</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{stored.total - stored.acertos}</p>
        </Card>
      </div>

      {erros.length > 0 && cat && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Relatório de erros comentados</h2>
          <div className="space-y-3">
            {erros.map((r) => {
              const q = cat.questoes.find((qq) => qq.id === r.questaoId)!;
              return (
                <Card key={r.questaoId} className="border-l-4 border-destructive p-4 shadow-card">
                  <p className="mb-3 font-medium leading-snug">{q.enunciado}</p>
                  <div className="space-y-1.5 text-sm">
                    {r.escolhida >= 0 && (
                      <p className="text-destructive">
                        <span className="font-semibold">Sua resposta:</span> {q.opcoes[r.escolhida]}
                      </p>
                    )}
                    <p className="text-success">
                      <span className="font-semibold">Correta:</span> {q.opcoes[r.correta]}
                    </p>
                  </div>
                  {q.comentario && (
                    <div className="mt-3 rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Explicação</p>
                      <p className="mt-1 text-sm leading-relaxed">{q.comentario}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── MENSAGEM MOTIVACIONAL ────────────────────────────────────────────── */}
      {(() => {
        const { icon: Icon, text, accent } =
          taxa >= 80
            ? { icon: Sparkles, text: "Excelente! Estás no bom caminho para a aprovação. Mantém este ritmo!", accent: "bg-emerald-50 border-emerald-200/70 text-emerald-900" }
            : taxa >= 60
            ? { icon: TrendingUp, text: "Bom trabalho! Revê os erros comentados e continua a praticar.", accent: "bg-sky-50 border-sky-200/70 text-sky-900" }
            : taxa >= 40
            ? { icon: TrendingUp, text: "Continue a praticar! Cada simulado aproxima-te da aprovação.", accent: "bg-amber-50 border-amber-200/70 text-amber-900" }
            : { icon: RotateCcw, text: "Não desanimes! Revê os erros abaixo — eles são a tua maior aula.", accent: "bg-rose-50 border-rose-200/70 text-rose-900" };
        return (
          <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${accent}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> Início</Link>
        </Button>
        <Button asChild className="rounded-full bg-gradient-primary">
          <Link to={`/quiz/${stored.concursoId}/${stored.categoriaId}`}>
            <RotateCcw className="mr-2 h-4 w-4" /> Refazer
          </Link>
        </Button>
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1 w-full">
        <Clock className="h-3 w-3" /> Concluído agora
      </div>
    </AppShell>
  );
};

export default Resultado;
