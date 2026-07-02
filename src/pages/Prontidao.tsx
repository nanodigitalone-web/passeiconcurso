import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { progressService, type Readiness } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Activity, BookOpen, CheckCircle2, ChevronRight, Gauge, Target } from "lucide-react";

const scoreColor = (n: number) =>
  n >= 70 ? "text-emerald-600" : n >= 40 ? "text-amber-600" : "text-red-600";
const barColor = (n: number) =>
  n >= 70 ? "bg-emerald-500" : n >= 40 ? "bg-amber-500" : "bg-red-500";
const scoreLabel = (n: number) =>
  n >= 85 ? "Excelente! Estás muito bem preparado"
  : n >= 70 ? "Bom. Estás no caminho certo"
  : n >= 40 ? "Em progresso. Reforça as disciplinas fracas"
  : "Início. Pratica todos os dias para subir";

const Prontidao = () => {
  const { profile } = useAuth();
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressService.getReadiness().then((r) => {
      setData(r);
      setLoading(false);
    });
  }, []);

  // Mesmo destino do simulado geral da Home.
  const isPlanoMode = profile?.concurso_id === "plano";
  const interessesAtivo = !isPlanoMode && !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const hasCateg = !!(profile?.concurso_id && profile?.categoria_id);
  const praticarTo = isPlanoMode
    ? "/quiz/plano/meu-plano"
    : interessesAtivo
      ? "/quiz/interesses/interesses"
      : hasCateg
        ? `/quiz/${profile!.concurso_id}/${profile!.categoria_id}`
        : "/concursos";

  const overall = data?.overall;
  const score = overall?.score ?? 0;
  // Anel de progresso: circunferência de r=52 → 2πr ≈ 326.7
  const CIRC = 326.7;

  return (
    <AppShell>
      <Seo
        title="Diagnóstico de Prontidão · Passei"
        description="Descobre o quão pronto estás para o concurso: score de prontidão, precisão e cobertura por disciplina."
        path="/prontidao"
      />
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Diagnóstico de Prontidão</h1>
        <p className="text-sm text-muted-foreground">O quão pronto estás para o teu concurso</p>
      </header>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">A calcular o teu diagnóstico…</Card>
      ) : !data || data.disciplines.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-none">
          <Gauge className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold">Ainda sem dados suficientes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Responde a pelo menos 5 questões por disciplina para veres o teu diagnóstico.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-full bg-gradient-primary">
            <Link to={praticarTo}>Praticar agora</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Score geral */}
          <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="white" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC - (CIRC * score) / 100}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-black leading-none">{score}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">de 100</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Prontidão geral</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{scoreLabel(score)}</p>
                <p className="mt-2 text-xs opacity-80 leading-relaxed">
                  Combina a tua precisão recente com a cobertura do banco de questões.
                </p>
              </div>
            </div>
          </Card>

          {/* Resumo */}
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {[
              { icon: <Target className="h-4 w-4" />, value: `${overall!.accuracy}%`, label: "Precisão", accent: "bg-sky-100 text-sky-700" },
              { icon: <CheckCircle2 className="h-4 w-4" />, value: overall!.mastered.toLocaleString("pt-PT"), label: "Dominadas", accent: "bg-emerald-100 text-emerald-700" },
              { icon: <Activity className="h-4 w-4" />, value: overall!.attempted.toLocaleString("pt-PT"), label: "Respostas", accent: "bg-violet-100 text-violet-700" },
            ].map((s) => (
              <Card key={s.label} className="flex flex-col items-center gap-1.5 border-border/60 py-3.5 shadow-card">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.accent}`}>{s.icon}</div>
                <p className="font-display text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Disciplinas (mais fracas primeiro) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100">
                  <BookOpen className="h-4 w-4 text-rose-700" />
                </div>
                <h2 className="font-display font-semibold">Por disciplina</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">mais fracas primeiro</span>
            </div>

            <Card className="border-border/60 p-2 shadow-card">
              <ul className="divide-y divide-border/60">
                {data.disciplines.map((d) => (
                  <li key={d.disciplina} className="p-3">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium">{d.nome}</p>
                      <p className={cn("shrink-0 font-display text-sm font-bold", scoreColor(d.readiness))}>
                        {d.readiness}
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", barColor(d.readiness))}
                        style={{ width: `${Math.max(3, d.readiness)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {d.accuracy}% de precisão · {d.mastered} dominadas{d.bank > 0 ? ` de ${d.bank}` : ""} · {d.total} respostas
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <Button asChild size="lg" className="mt-5 w-full rounded-2xl bg-gradient-primary font-bold">
            <Link to={praticarTo} className="flex items-center justify-center gap-2">
              Reforçar agora <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      )}
    </AppShell>
  );
};

export default Prontidao;
