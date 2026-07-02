import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Cell, Pie, PieChart, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { resultsService, battlesService, friendsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, BookOpen, Target, Check, X, Zap, Trophy,
  Calendar, Flame, Users, Swords, Download, ArrowUp, ArrowDown,
  BarChart2, Star, AlertTriangle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type DashDay = { day: string; total: number; correct: number };
type DashDisc = { disciplina: string; total: number; correct: number };
type DashData = {
  period: "week" | "month";
  summary: { total: number; correct: number; wrong: number; accuracy: number; points_earned: number; streak: number };
  daily: DashDay[];
  disciplines: DashDisc[];
  battles: { total: number; wins: number; losses: number };
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
const shortDay = (iso: string) => {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric" }).replace(".", "");
};

// PDF print: temporarily hide app shell nav
const exportPDF = () => {
  document.title = "Relatório — Passei";
  window.print();
};

// ── Colour scale by accuracy ──────────────────────────────────────────────────
const accColor = (a: number) =>
  a >= 75 ? "hsl(142 70% 38%)" : a >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)";

const chartConfig: ChartConfig = {
  correct: { label: "Acertos", color: "hsl(142 70% 38%)" },
  wrong: { label: "Falhas", color: "hsl(0 72% 51%)" },
  pct: { label: "Acerto %", color: "hsl(217 91% 55%)" },
  total: { label: "Questões", color: "hsl(217 91% 55%)" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPI = ({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string }) => (
  <Card className="flex items-start gap-3 border-border/60 p-4 shadow-card">
    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent || "bg-primary/10 text-primary"}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </Card>
);

// ── Status badge ─────────────────────────────────────────────────────────────
const Badge = ({ v }: { v: number }) => (
  <span
    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
    style={{ background: accColor(v) + "22", color: accColor(v) }}
  >
    {v}%
  </span>
);

// ── Activity heatmap (last N days) ────────────────────────────────────────────
const Heatmap = ({ daily, days }: { daily: DashDay[]; days: number }) => {
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const cells: { date: string; level: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const row = byDay.get(key);
    const level = row ? Math.min(4, Math.floor(row.total / 5) + 1) : 0;
    cells.push({ date: key, level });
  }
  const colours = ["#e5e7eb", "#bbf7d0", "#4ade80", "#16a34a", "#15803d"];
  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((c) => (
        <div
          key={c.date}
          title={`${c.date}`}
          style={{ background: colours[c.level] }}
          className="h-4 w-4 rounded-sm transition-all"
        />
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Percurso = () => {
  const { profile, user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [dash, setDash] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [battles, setBattles] = useState<Awaited<ReturnType<typeof battlesService.list>>>([]);
  const [friends, setFriends] = useState<Awaited<ReturnType<typeof friendsService.list>>>([]);

  const localResults = resultsService.getResults();

  // Começar agora
  const interessesAtivo = !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const simuladoTo = interessesAtivo
    ? "/quiz/interesses/interesses"
    : profile?.concurso_id && profile?.categoria_id
      ? `/quiz/${profile.concurso_id}/${profile.categoria_id}`
      : "/concursos";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<DashData>(`/profile/dashboard?period=${period}`),
      battlesService.list(),
      friendsService.list(),
    ])
      .then(([d, b, f]) => {
        setDash(d);
        setBattles(b);
        setFriends(f);
      })
      .catch(() => setDash(null))
      .finally(() => setLoading(false));
  }, [period]);

  // Local supplement (localStorage results) when server has no data yet
  const localTotal = localResults.reduce((s, r) => s + r.total, 0);
  const localAcertos = localResults.reduce((s, r) => s + r.acertos, 0);

  // Derive chart data from server dashboard
  const dailyChart = useMemo(() => {
    if (!dash?.daily.length) return [];
    return dash.daily.map((d) => ({
      label: shortDay(d.day),
      correct: d.correct,
      wrong: d.total - d.correct,
      pct: pct(d.correct, d.total),
      total: d.total,
    }));
  }, [dash]);

  const discSorted = useMemo(() => {
    if (!dash?.disciplines.length) return [];
    return dash.disciplines.map((d) => ({
      ...d,
      accuracy: pct(d.correct, d.total),
      errors: d.total - d.correct,
    }));
  }, [dash]);

  const bestDisc = useMemo(() => [...discSorted].sort((a, b) => b.accuracy - a.accuracy).slice(0, 5), [discSorted]);
  const worstDisc = useMemo(() => [...discSorted].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5), [discSorted]);

  const pieData = useMemo(() => {
    if (!dash) return [];
    return [
      { name: "Acertos", value: dash.summary.correct, fill: "hsl(142 70% 38%)" },
      { name: "Falhas", value: dash.summary.wrong, fill: "hsl(0 72% 51%)" },
    ];
  }, [dash]);

  const recentBattles = battles.slice(0, 5);
  const finishedBattles = battles.filter((b) => b.status === "finished");
  const myWins = finishedBattles.filter((b) => b.winner_id === user?.id).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      {/* Print CSS injected via style tag */}
      <style>{`
        @media print {
          nav, header nav, [data-print-hide] { display: none !important; }
          body { background: white !important; }
          .shadow-card, .shadow-elegant { box-shadow: none !important; }
          .print\\:break-before { break-before: page; }
        }
      `}</style>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 animate-fade-in" data-print-hide="">
        <div>
          <h1 className="font-display text-2xl font-bold">Relatório de Estudo</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.nome && <span className="font-medium text-foreground">{profile.nome} · </span>}
            {profile?.categoria_nome || "Todas as categorias"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex rounded-full border border-border/60 p-0.5 text-sm">
            <button
              onClick={() => setPeriod("week")}
              className={`rounded-full px-4 py-1.5 font-medium transition-colors ${period === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`rounded-full px-4 py-1.5 font-medium transition-colors ${period === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Mensal
            </button>
          </div>
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2 rounded-full">
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <p className="animate-pulse text-sm text-muted-foreground">A carregar dados…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ── KPI Row ─────────────────────────────────────────────────────── */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPI
              icon={<Target className="h-5 w-5" />}
              label="Taxa de acerto"
              value={`${dash?.summary.accuracy ?? pct(localAcertos, localTotal)}%`}
              sub={`${dash?.summary.correct ?? localAcertos} acertos`}
              accent="bg-blue-50 text-blue-600"
            />
            <KPI
              icon={<BookOpen className="h-5 w-5" />}
              label="Questões"
              value={dash?.summary.total ?? localTotal}
              sub={`${dash?.summary.wrong ?? (localTotal - localAcertos)} falhas`}
              accent="bg-purple-50 text-purple-600"
            />
            <KPI
              icon={<Zap className="h-5 w-5" />}
              label="Pontos ganhos"
              value={dash?.summary.points_earned ?? 0}
              sub={`Total: ${profile?.pontos_globais ?? 0}`}
              accent="bg-amber-50 text-amber-600"
            />
            <KPI
              icon={<Flame className="h-5 w-5" />}
              label="Sequência"
              value={`${dash?.summary.streak ?? 0} dias`}
              sub="dias consecutivos"
              accent="bg-orange-50 text-orange-600"
            />
          </div>

          {/* ── Charts Row 1: Area chart + Pie ─────────────────────────────── */}
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            {/* Area chart: daily performance */}
            <Card className="border-border/60 p-4 shadow-card sm:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Evolução diária
                </h2>
                <span className="text-xs text-muted-foreground">
                  {period === "week" ? "7 dias" : "30 dias"}
                </span>
              </div>
              {dailyChart.length >= 2 ? (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <AreaChart data={dailyChart} margin={{ left: -16, right: 4, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCorrect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 70% 38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 70% 38%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gWrong" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} tickMargin={6} />
                    <YAxis tickLine={false} axisLine={false} width={28} fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="correct" stroke="hsl(142 70% 38%)" strokeWidth={2} fill="url(#gCorrect)" dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="wrong" stroke="hsl(0 72% 51%)" strokeWidth={2} fill="url(#gWrong)" dot={{ r: 3 }} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[180px] items-center justify-center text-center">
                  <div>
                    <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">Dados insuficientes para o gráfico.</p>
                    <Button asChild size="sm" className="mt-3 rounded-full bg-gradient-primary">
                      <Link to={simuladoTo}>Fazer simulado</Link>
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Pie: acertos vs falhas */}
            <Card className="border-border/60 p-4 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Distribuição
              </h2>
              {(dash?.summary.total ?? 0) > 0 ? (
                <>
                  <ChartContainer config={chartConfig} className="h-[130px] w-full">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                        {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} questões`]} />
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-green-700"><Check className="h-3.5 w-3.5" /> Acertos</span>
                      <span className="font-bold">{dash?.summary.correct}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-red-600"><X className="h-3.5 w-3.5" /> Falhas</span>
                      <span className="font-bold">{dash?.summary.wrong}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-[160px] items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">Sem dados ainda</p>
                </div>
              )}
            </Card>
          </div>

          {/* ── Activity heatmap ─────────────────────────────────────────────── */}
          {dash?.daily && dash.daily.length > 0 && (
            <Card className="mb-5 border-border/60 p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold">Actividade — últimos {dash.days} dias</h2>
              </div>
              <Heatmap daily={dash.daily} days={dash.days} />
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-3 w-3 rounded-sm bg-gray-200" /> Nenhuma
                <div className="h-3 w-3 rounded-sm bg-green-300" /> Pouca
                <div className="h-3 w-3 rounded-sm bg-green-500" /> Moderada
                <div className="h-3 w-3 rounded-sm bg-green-700" /> Alta
              </div>
            </Card>
          )}

          {/* ── Disciplines: worst + best ────────────────────────────────────── */}
          {discSorted.length > 0 && (
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              {/* Worst disciplines */}
              <Card className="border-border/60 p-4 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Disciplinas com mais falhas
                </h2>
                <div className="space-y-2.5">
                  {worstDisc.map((d) => (
                    <div key={d.disciplina} className="group">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{d.disciplina}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground">{d.errors} falhas</span>
                          <Badge v={d.accuracy} />
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.accuracy}%`, background: accColor(d.accuracy) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Best disciplines */}
              <Card className="border-border/60 p-4 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
                  <Star className="h-4 w-4 text-amber-500" />
                  Disciplinas com melhor desempenho
                </h2>
                <div className="space-y-2.5">
                  {bestDisc.map((d) => (
                    <div key={d.disciplina} className="group">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{d.disciplina}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground">{d.correct} acertos</span>
                          <Badge v={d.accuracy} />
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.accuracy}%`, background: accColor(d.accuracy) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── Bar chart: top disciplines by volume ─────────────────────────── */}
          {discSorted.length >= 3 && (
            <Card className="mb-5 border-border/60 p-4 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
                <BarChart2 className="h-4 w-4 text-primary" />
                Volume de questões por disciplina (top 8)
              </h2>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart
                  data={discSorted.slice(0, 8).map((d) => ({
                    nome: d.disciplina.length > 16 ? d.disciplina.slice(0, 15) + "…" : d.disciplina,
                    correct: d.correct,
                    wrong: d.errors,
                  }))}
                  layout="vertical"
                  margin={{ left: 4, right: 12 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={104} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="correct" name="Acertos" fill="hsl(142 70% 38%)" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="wrong" name="Falhas" fill="hsl(0 72% 51%)" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ChartContainer>
            </Card>
          )}

          {/* ── Battles + Friends ────────────────────────────────────────────── */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            {/* Batalhas */}
            <Card className="border-border/60 p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display font-semibold">
                  <Swords className="h-4 w-4 text-primary" /> Batalhas
                </h2>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link to="/perfil">Ver todas</Link>
                </Button>
              </div>
              {/* Summary pills */}
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total", value: finishedBattles.length, color: "text-foreground" },
                  { label: "Vitórias", value: myWins, color: "text-green-600" },
                  { label: "Derrotas", value: finishedBattles.length - myWins, color: "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/50 p-2">
                    <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Recent battles */}
              {recentBattles.length > 0 ? (
                <div className="space-y-2">
                  {recentBattles.map((b) => {
                    const isChall = b.challenger_id === user?.id;
                    const myScore = isChall ? b.challenger_score : b.opponent_score;
                    const theirScore = isChall ? b.opponent_score : b.challenger_score;
                    const won = b.winner_id === user?.id;
                    const draw = b.status === "finished" && !b.winner_id;
                    return (
                      <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border/50 p-2.5">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                          {b.opponent_avatar
                            ? <img src={b.opponent_avatar} className="h-full w-full object-cover" alt="" />
                            : <Users className="m-auto h-4 w-4 text-muted-foreground mt-2" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{b.opponent_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {myScore ?? "–"} vs {theirScore ?? "–"}
                          </p>
                        </div>
                        {b.status === "finished" ? (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${draw ? "bg-muted text-muted-foreground" : won ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {draw ? "Empate" : won ? "Ganhou" : "Perdeu"}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                            Em curso
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Ainda sem batalhas registadas.</p>
              )}
            </Card>

            {/* Amigos ranking */}
            <Card className="border-border/60 p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display font-semibold">
                  <Users className="h-4 w-4 text-primary" /> Amigos
                </h2>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link to="/ranking">Ranking</Link>
                </Button>
              </div>
              {/* Me first */}
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-2.5">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} className="h-full w-full object-cover" alt="" />
                    : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">{profile?.nome?.[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">Tu</p>
                  <p className="text-xs text-muted-foreground">{profile?.pontos_globais ?? 0} pts globais</p>
                </div>
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              {friends.filter((f) => f.status === "accepted").length > 0 ? (
                <div className="space-y-1.5">
                  {friends
                    .filter((f) => f.status === "accepted")
                    .sort((a, b) => b.pontos - a.pontos)
                    .slice(0, 5)
                    .map((f, i) => {
                      const ahead = f.pontos > (profile?.pontos_globais ?? 0);
                      return (
                        <Link to={`/perfil/${f.friend_id}`} key={f.friendship_id}>
                          <div className="flex items-center gap-2 rounded-xl border border-border/40 p-2 hover:bg-muted/40 transition-colors">
                            <span className="w-4 shrink-0 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted">
                              {f.avatar_url
                                ? <img src={f.avatar_url} className="h-full w-full object-cover" alt="" />
                                : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">{f.nome[0]}</div>}
                            </div>
                            <p className="flex-1 truncate text-sm font-medium">{f.nome}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <span>{f.pontos}</span>
                              {ahead
                                ? <ArrowUp className="h-3 w-3 text-green-500" />
                                : <ArrowDown className="h-3 w-3 text-red-500" />}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Ainda não tens amigos adicionados.</p>
              )}
            </Card>
          </div>

          {/* ── Histórico local (localStorage) ───────────────────────────────── */}
          <section className="mb-6 print:break-before">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Histórico de simulados
              </h2>
              <span className="text-xs text-muted-foreground">{localResults.length} sessões</span>
            </div>
            {localResults.length === 0 ? (
              <Card className="border-dashed bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Ainda não fizeste nenhum simulado.</p>
                <Button asChild className="mt-4 rounded-full bg-gradient-primary">
                  <Link to={simuladoTo}>Começar agora</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {localResults.slice(0, 20).map((r) => {
                  const p = pct(r.acertos, r.total);
                  const date = new Date(r.data).toLocaleDateString("pt-PT", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <Link key={r.id} to={`/resultado/${r.id}`}>
                      <Card className="flex items-center gap-3 border-border/60 p-3 shadow-card transition-smooth hover:shadow-elegant">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold"
                          style={{ background: accColor(p) + "22", color: accColor(p) }}
                        >
                          {p}%
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">{r.categoriaNome}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        <div className="shrink-0 text-right text-sm">
                          <p className="font-semibold text-green-600">{r.acertos} ✓</p>
                          <p className="text-muted-foreground">{r.total - r.acertos} ✗</p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Print footer ─────────────────────────────────────────────────── */}
          <div className="hidden print:block mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            Relatório gerado em {new Date().toLocaleDateString("pt-PT")} · Passei — passeii.com
          </div>

          {/* Começar novo simulado CTA */}
          <div className="mb-8 flex justify-center" data-print-hide="">
            <Button asChild className="rounded-full bg-gradient-primary px-8">
              <Link to={simuladoTo}>Novo Simulado</Link>
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default Percurso;
