import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { resultsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { TrendingUp, Trash2, BookOpen, Target, Check, X, Layers } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

type Agg = { total: number; acertos: number };

const Percurso = () => {
  const { profile } = useAuth();
  const [, setTick] = useState(0);
  const results = resultsService.getResults();

  // Começar agora abre diretamente o simulado da categoria (ou interesses) do utilizador.
  const interessesAtivo = !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const simuladoTo = interessesAtivo
    ? "/quiz/interesses/interesses"
    : profile?.concurso_id && profile?.categoria_id
      ? `/quiz/${profile.concurso_id}/${profile.categoria_id}`
      : "/concursos";

  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const erros = totalQ - acertos;
  const taxa = totalQ ? Math.round((acertos / totalQ) * 100) : 0;

  // Stats per discipline (global)
  const porDisciplina = new Map<string, Agg>();
  results.forEach((r) =>
    r.respostas.forEach((rr) => {
      const d = porDisciplina.get(rr.disciplina) || { total: 0, acertos: 0 };
      d.total++;
      if (rr.escolhida === rr.correta) d.acertos++;
      porDisciplina.set(rr.disciplina, d);
    })
  );
  const disciplinas = Array.from(porDisciplina.entries()).sort((a, b) => b[1].total - a[1].total);

  // Stats per category
  type CatAgg = Agg & { nome: string; simulados: number; concursoId: string; categoriaId: string };
  const porCategoria = new Map<string, CatAgg>();
  results.forEach((r) => {
    const c = porCategoria.get(r.categoriaId) || {
      nome: r.categoriaNome, total: 0, acertos: 0, simulados: 0,
      concursoId: r.concursoId, categoriaId: r.categoriaId,
    };
    c.total += r.total;
    c.acertos += r.acertos;
    c.simulados += 1;
    porCategoria.set(r.categoriaId, c);
  });
  const categorias = Array.from(porCategoria.values()).sort((a, b) => b.total - a.total);

  // ---- Chart data ---------------------------------------------------------
  // Accuracy trend: chronological (oldest -> newest), last 12 simulados.
  const trendData = useMemo(() => {
    const chrono = [...results].reverse().slice(-12);
    return chrono.map((r, i) => ({
      label: `#${i + 1}`,
      pct: Math.round((r.acertos / r.total) * 100),
    }));
  }, [results]);

  // Discipline accuracy bars (top 6 by volume).
  const disciplineData = useMemo(
    () =>
      disciplinas.slice(0, 6).map(([nome, s]) => ({
        nome: nome.length > 14 ? nome.slice(0, 13) + "…" : nome,
        pct: Math.round((s.acertos / s.total) * 100),
      })),
    [disciplinas]
  );

  const gaugeData = [{ name: "taxa", value: taxa, fill: "hsl(var(--primary))" }];

  const chartConfig = {
    pct: { label: "Acerto", color: "hsl(var(--primary))" },
    value: { label: "Taxa", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  return (
    <AppShell>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Percurso</h1>
        <p className="text-sm text-muted-foreground">Relatório geral de desempenho</p>
      </header>

      {/* Hero: radial gauge + key numbers */}
      <Card className="mb-4 overflow-hidden border-0 bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ChartContainer config={chartConfig} className="h-[120px] w-[120px]">
              <RadialBarChart
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
                innerRadius={48}
                outerRadius={62}
                barSize={12}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                <RadialBar
                  dataKey="value"
                  background={{ fill: "hsl(var(--primary-foreground) / 0.18)" }}
                  cornerRadius={8}
                  fill="hsl(var(--primary-foreground))"
                />
              </RadialBarChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold leading-none">{taxa}%</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">acerto</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
              <TrendingUp className="h-4 w-4" /> Taxa de acerto global
            </div>
            <p className="mt-1 text-sm opacity-90">{acertos} acertos em {totalQ} questões</p>
            <p className="mt-1 text-sm opacity-90">{results.length} simulado{results.length === 1 ? "" : "s"} concluído{results.length === 1 ? "" : "s"}</p>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-success">
            <Check className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Acertos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{acertos}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-destructive">
            <X className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Falhas</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{erros}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <Target className="h-4 w-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-bold">{results.length}</p>
          <p className="text-xs text-muted-foreground">Simulados concluídos</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="mt-2 font-display text-2xl font-bold">{disciplinas.length}</p>
          <p className="text-xs text-muted-foreground">Disciplinas estudadas</p>
        </Card>
      </div>

      {/* Evolução da taxa de acerto */}
      {trendData.length >= 2 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> Evolução do desempenho
          </h2>
          <Card className="border-border/60 p-4 shadow-card">
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} fontSize={11} unit="%" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#fillPct)"
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                />
              </AreaChart>
            </ChartContainer>
          </Card>
        </section>
      )}

      {/* Acerto por disciplina (gráfico) */}
      {disciplineData.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
            <BookOpen className="h-4 w-4 text-primary" /> Acerto por disciplina
          </h2>
          <Card className="border-border/60 p-4 shadow-card">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={disciplineData} layout="vertical" margin={{ left: 4, right: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                  fontSize={11}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} unit="%" />
              </BarChart>
            </ChartContainer>
          </Card>
        </section>
      )}

      {/* Relatório por categoria */}
      {categorias.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
            <Layers className="h-4 w-4 text-primary" /> Desempenho por categoria
          </h2>
          <div className="space-y-3">
            {categorias.map((c) => {
              const pct = Math.round((c.acertos / c.total) * 100);
              return (
                <Card key={c.categoriaId} className="border-border/60 p-4 shadow-card">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate font-display font-semibold">{c.nome}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${pct >= 60 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="text-success font-medium">{c.acertos} acertos</span>
                    <span className="text-destructive font-medium">{c.total - c.acertos} falhas</span>
                    <span>{c.simulados} simulado{c.simulados === 1 ? "" : "s"}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Histórico */}
      <section className="mb-6">
        <h2 className="mb-3 font-display font-semibold">Histórico de simulados</h2>
        {results.length === 0 ? (
          <Card className="border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não realizou nenhum simulado.</p>
            <Button asChild className="mt-4 rounded-full bg-gradient-primary">
              <Link to={simuladoTo}>Começar agora</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {results.map((r) => {
              const pct = Math.round((r.acertos / r.total) * 100);
              const date = new Date(r.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
              return (
                <Link key={r.id} to={`/resultado/${r.id}`}>
                  <Card className="flex items-center gap-3 border-border/60 p-3 shadow-card transition-smooth hover:shadow-elegant">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${pct >= 60 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {pct}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{r.categoriaNome}</p>
                      <p className="text-xs text-muted-foreground">{date} · {r.acertos}/{r.total}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {results.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { resultsService.clearResults(); setTick((t) => t + 1); }}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Limpar histórico
        </Button>
      )}
    </AppShell>
  );
};

export default Percurso;
