import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService, resultsService, type QuizResult } from "@/services";
import { cn } from "@/lib/utils";
import { BookX, Check, Clock, Home, RotateCcw, Sparkles, TrendingUp, X, Zap } from "lucide-react";

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
  const pontos = Math.min(50, stored.acertos);

  const msg = taxa >= 80 ? "Excelente!" : taxa >= 60 ? "Bom trabalho!" : taxa >= 40 ? "Continua a praticar" : "Revê o conteúdo";
  // Anel de progresso: circunferência de r=52 → 2πr ≈ 326.7
  const CIRC = 326.7;

  return (
    <AppShell>
      {/* ── HERO DO RESULTADO ────────────────────────────────────────────────── */}
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-scale-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="white" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - (CIRC * taxa) / 100}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-black leading-none">{taxa}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">acerto</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">{stored.categoriaNome}</p>
              <h1 className="mt-1 font-display text-2xl font-bold leading-tight">{msg}</h1>
              {pontos > 0 && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <Zap className="h-3.5 w-3.5" /> +{pontos} pontos
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Check, value: String(stored.acertos), label: "Acertos" },
              { icon: X, value: String(stored.total - stored.acertos), label: "Erros" },
              { icon: Clock, value: `${mm}:${ss}`, label: "Tempo" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 opacity-60" />
                <p className="font-display text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] opacity-60 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MENSAGEM MOTIVACIONAL ────────────────────────────────────────────── */}
      {(() => {
        const { icon: Icon, text, accent } =
          taxa >= 80
            ? { icon: Sparkles, text: "Excelente! Estás no bom caminho para a aprovação. Mantém este ritmo!", accent: "bg-emerald-50 border-emerald-200/70 text-emerald-900" }
            : taxa >= 60
            ? { icon: TrendingUp, text: "Bom trabalho! Revê os erros comentados e continua a praticar.", accent: "bg-sky-50 border-sky-200/70 text-sky-900" }
            : taxa >= 40
            ? { icon: TrendingUp, text: "Continua a praticar! Cada simulado aproxima-te da aprovação.", accent: "bg-amber-50 border-amber-200/70 text-amber-900" }
            : { icon: RotateCcw, text: "Não desanimes! Revê os erros abaixo: eles são a tua maior aula.", accent: "bg-rose-50 border-rose-200/70 text-rose-900" };
        return (
          <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${accent}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        );
      })()}

      {/* ── ERROS COMENTADOS ─────────────────────────────────────────────────── */}
      {erros.length > 0 && cat && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100">
              <BookX className="h-4 w-4 text-rose-700" />
            </div>
            <h2 className="font-display font-semibold">Erros comentados</h2>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{erros.length}</span>
          </div>

          <div className="space-y-3">
            {erros.map((r) => {
              const q = cat.questoes.find((qq) => qq.id === r.questaoId)!;
              return (
                <Card key={r.questaoId} className="border-border/60 p-4 shadow-card">
                  <p className="mb-3 text-sm font-semibold leading-snug">{q.enunciado}</p>
                  <div className="space-y-2">
                    {r.escolhida >= 0 && (
                      <div className="flex items-start gap-2 rounded-xl bg-destructive/5 px-3 py-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-sm leading-snug text-destructive">{q.opcoes[r.escolhida]}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 rounded-xl bg-success/5 px-3 py-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <p className="text-sm leading-snug text-success">{q.opcoes[r.correta]}</p>
                    </div>
                  </div>
                  {q.comentario && (
                    <div className="mt-3 rounded-xl bg-primary/5 p-3">
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

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="rounded-full font-semibold">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> Início</Link>
        </Button>
        <Button asChild className="rounded-full bg-gradient-primary font-semibold">
          <Link to={`/quiz/${stored.concursoId}/${stored.categoriaId}`}>
            <RotateCcw className="mr-2 h-4 w-4" /> Refazer
          </Link>
        </Button>
      </div>

      <div className={cn("mt-3 inline-flex w-full items-center justify-center gap-1 text-center text-xs text-muted-foreground")}>
        <Clock className="h-3 w-3" /> Concluído agora
      </div>
    </AppShell>
  );
};

export default Resultado;
