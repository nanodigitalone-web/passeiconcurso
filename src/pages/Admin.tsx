import { useEffect, useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { adminService, authService, quizService, notificationsService, cursosService } from "@/services";
import { api } from "@/lib/api";
import type { CursoPreparatorio } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, KeyRound, Bell, BarChart3, ShieldAlert, Eye, EyeOff, Trash2, Ban,
  CheckCircle2, RefreshCw, ShieldCheck, Unlock, Lock, FileText, ExternalLink,
  Clock, GraduationCap, Plus, Phone, Image as ImageIcon, Coins, Banknote,
  Tag, ToggleLeft, ToggleRight, Calendar, TrendingUp, Zap, ArrowUpRight,
  ArrowDownRight, Activity, Target, DollarSign, Percent, Repeat2,
  UserCheck, Flame, Trophy, AlertTriangle, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { disciplinaById } from "@/data/disciplinas";

const concursos = quizService.getConcursos();

// ── Shared helpers ────────────────────────────────────────────────────────────
const formatRelative = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "agora mesmo";
  if (d < 3600) return `há ${Math.floor(d / 60)} min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
  if (d < 7 * 86400) return `há ${Math.floor(d / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-PT");
};

// ── KPI card (same pattern as Percurso) ──────────────────────────────────────
const KPI = ({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string }) => (
  <Card className="flex items-start gap-3 border-border/60 p-4 shadow-card">
    <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent || "bg-primary/10 text-primary")}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold leading-tight">{typeof value === "number" ? value.toLocaleString("pt-PT") : value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </Card>
);

// ── Section header (same pattern as Percurso) ─────────────────────────────────
const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
    <span className="text-primary">{icon}</span>
    {children}
  </h2>
);

// ── Nav tabs ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "stats",         label: "Estatísticas",   Icon: BarChart3  },
  { key: "users",         label: "Usuários",        Icon: Users      },
  { key: "codes",         label: "Códigos",         Icon: KeyRound   },
  { key: "notifs",        label: "Notificações",    Icon: Bell       },
  { key: "comprovativos", label: "Comprovativos",   Icon: FileText   },
  { key: "preparatorios", label: "Preparatórios",   Icon: GraduationCap },
  { key: "carregamentos", label: "Moedas",          Icon: Coins      },
  { key: "saques",        label: "Saques",          Icon: Banknote   },
  { key: "promocoes",     label: "Promoções",       Icon: Tag        },
];

// ── Root ─────────────────────────────────────────────────────────────────────
const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [tab, setTab] = useState("stats");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground animate-pulse">A carregar…</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">Painel Admin</h1>
        <p className="text-sm text-muted-foreground mb-6">Nano Digital One · Passei</p>
        <Button asChild className="w-full rounded-full">
          <Link to="/login">Iniciar sessão</Link>
        </Button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <ShieldAlert className="h-14 w-14 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Acesso negado</h1>
        <p className="text-muted-foreground mb-6 text-sm">Esta área é restrita aos administradores da Passei.</p>
        <Button variant="outline" className="rounded-full" onClick={async () => { await signOut(); }}>Sair</Button>
        <div className="mt-4"><Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Voltar à plataforma</Link></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">Painel Admin</h1>
              <p className="text-[11px] text-muted-foreground">Nano Digital One · Passei</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/">Plataforma</Link>
            </Button>
            <Button size="sm" variant="destructive" className="rounded-full" onClick={signOut}>Sair</Button>
          </div>
        </div>

        {/* ── Tab nav ─────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-0.5 min-w-max pb-px">
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                  tab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "stats"         && <StatsTab />}
        {tab === "users"         && <UsersTab />}
        {tab === "codes"         && <CodesTab />}
        {tab === "notifs"        && <NotifsTab />}
        {tab === "comprovativos" && <ComprovativosTab />}
        {tab === "preparatorios" && <PreparatoriosTab />}
        {tab === "carregamentos" && <CarregamentosTab />}
        {tab === "saques"        && <SaquesTab />}
        {tab === "promocoes"     && <PromocoesTab />}
      </main>
    </div>
  );
};

/* ═══════════════════════ STATS ═══════════════════════ */

// Colors shared across charts
const C = {
  sky:     "#0ea5e9",
  indigo:  "#6366f1",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  violet:  "#8b5cf6",
  teal:    "#14b8a6",
  slate:   "#64748b",
};

const aoa = (v: number) =>
  v === 0 ? "0 Kz" : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M Kz` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K Kz` : `${v} Kz`;

const pct = (v: number | null, suffix = "%") =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v}${suffix}`;

const DeltaBadge = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="text-xs text-muted-foreground">dados insuf.</span>;
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", up ? "text-emerald-600" : "text-rose-600")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
};

type MetricCardProps = {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string;
  delta?: number | null; deltaLabel?: string;
  border?: string;
};
const MetricCard = ({ icon, label, value, sub, accent, delta, deltaLabel, border }: MetricCardProps) => (
  <Card className={cn("flex flex-col gap-2 border-border/60 p-4 shadow-card", border)}>
    <div className="flex items-center justify-between">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accent || "bg-primary/10 text-primary")}>
        {icon}
      </div>
      {delta !== undefined && <DeltaBadge value={delta} />}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      {deltaLabel && <p className="text-[11px] text-muted-foreground">{deltaLabel}</p>}
    </div>
  </Card>
);

const ChartCard = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <Card className="border-border/60 p-4 shadow-card">
    <p className="font-display font-semibold mb-0.5">{title}</p>
    {sub && <p className="text-xs text-muted-foreground mb-3">{sub}</p>}
    {children}
  </Card>
);

/* ── Shared user detail modal (reused in Top 3 + UsersTab) ─────────────────── */
const UserStatsModal = ({ user, open, onClose, badge }: { user: any; open: boolean; onClose: () => void; badge?: React.ReactNode }) => {
  const accuracy = (user?.total_attempts ?? 0) > 0 ? Math.round(((user?.correct_attempts ?? 0) / user.total_attempts) * 100) : 0;
  const hours    = Math.floor((user?.est_minutes ?? 0) / 60);
  const mins     = (user?.est_minutes ?? 0) % 60;
  const timeStr  = hours > 0 ? `${hours}h ${mins}m` : `${user?.est_minutes ?? 0}min`;
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {badge} {user.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 ring-2 ring-border/40">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 font-bold text-primary text-2xl">
                {user.nome?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{user.nome}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.universidade && <p className="text-xs text-muted-foreground">{user.universidade}{user.curso ? ` · ${user.curso}` : ""}{user.ano ? ` · ${user.ano}º ano` : ""}</p>}
              {(user.blocked || user.hidden) && (
                <div className="flex gap-1 mt-1">
                  {user.blocked && <Badge variant="destructive" className="text-[10px]">Suspenso</Badge>}
                  {user.hidden && <Badge variant="secondary" className="text-[10px]">Oculto</Badge>}
                </div>
              )}
            </div>
          </div>
          {user.bio && <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">{user.bio}</p>}
          {/* Valor económico — só mostra se há dados de pagamento */}
          {(user.paid_total != null) && (
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3 py-2.5">
              <p className="text-[10px] uppercase font-semibold tracking-wide text-emerald-700 mb-1">Valor gerado para a plataforma</p>
              <div className="flex gap-4">
                <div>
                  <p className="font-display font-bold text-lg text-emerald-800">{(user.paid_total ?? 0).toLocaleString("pt-PT")} Kz</p>
                  <p className="text-[10px] text-emerald-600">Total pago</p>
                </div>
                {user.paid_subscriptions > 0 && (
                  <div>
                    <p className="font-bold text-sm text-emerald-700">{(user.paid_subscriptions ?? 0).toLocaleString("pt-PT")} Kz</p>
                    <p className="text-[10px] text-emerald-600">Subscrições</p>
                  </div>
                )}
                {user.paid_topups > 0 && (
                  <div>
                    <p className="font-bold text-sm text-emerald-700">{(user.paid_topups ?? 0).toLocaleString("pt-PT")} Kz</p>
                    <p className="text-[10px] text-emerald-600">Moedas compradas</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Pontos globais",          value: (user.pontos_globais ?? 0).toLocaleString("pt-PT") },
              { label: "Saldo disponível",        value: (user.pontos ?? 0).toLocaleString("pt-PT") },
              { label: "Moedas",                  value: (user.moedas ?? 0).toLocaleString("pt-PT") },
              { label: "Questões respondidas",    value: (user.total_attempts ?? 0).toLocaleString("pt-PT") },
              { label: "Precisão",                value: `${accuracy}%` },
              { label: "Simulados",               value: (user.simulado_count ?? 0).toLocaleString("pt-PT") },
              { label: "Aprender",                value: (user.aprender_count ?? 0).toLocaleString("pt-PT") },
              { label: "Tempo estimado",          value: timeStr },
              { label: "Sequência (streak)",      value: `${user.streak ?? 0} dias` },
              { label: "Planos ativos",           value: user.access_count ?? 0 },
              { label: "Utilizadores convidados", value: user.referrals_given ?? 0 },
              { label: "Membro desde",            value: user.created_at ? new Date(user.created_at).toLocaleDateString("pt-PT") : "—" },
              { label: "Último acesso",           value: user.last_seen ? formatRelative(user.last_seen) : "nunca" },
            ].map(it => (
              <div key={it.label} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">{it.label}</p>
                <p className="font-display font-bold text-base leading-tight">{it.value}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Top user card ───────────────────────────────────────────────────────────── */
const RANK_MEDAL = ["🥇", "🥈", "🥉"];
const RANK_BORDER = ["border-amber-300", "border-slate-300", "border-slate-400/50"];
const RANK_BG    = ["from-amber-50/80 to-amber-100/20", "from-slate-50 to-slate-100/20", "from-muted/40"];

const TopUserCard = ({ user, rank }: { user: any; rank: number }) => {
  const [open, setOpen] = useState(false);
  const accuracy = user.total_attempts > 0 ? Math.round((user.correct_attempts / user.total_attempts) * 100) : 0;

  return (
    <>
      <Card
        className={cn("border-2 p-4 shadow-card cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-b", RANK_BORDER[rank - 1], RANK_BG[rank - 1])}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-border/40">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 font-bold text-primary text-lg">
                {user.nome?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -top-1.5 -right-1.5 text-lg leading-none">{RANK_MEDAL[rank - 1]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.nome || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-background/70 px-2 py-1.5">
            <p className="font-display font-bold text-lg leading-none">{(user.pontos_globais ?? 0).toLocaleString("pt-PT")}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">pts globais</p>
          </div>
          <div className="rounded-xl bg-background/70 px-2 py-1.5">
            <p className="font-display font-bold text-lg leading-none">{accuracy}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">precisão</p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-primary/70">Ver detalhes →</p>
      </Card>
      <UserStatsModal user={user} open={open} onClose={() => setOpen(false)} badge={<span className="text-xl">{RANK_MEDAL[rank - 1]}</span>} />
    </>
  );
};

/* ── Warn user dialog ────────────────────────────────────────────────────────── */
const WarnUserDialog = ({ user, onDone }: { user: any; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await adminService.warnUser(user.id, msg.trim());
      toast.success("Advertência enviada");
      setOpen(false); setMsg(""); onDone();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Advertir utilizador"><AlertTriangle className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Advertência · {user.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">A mensagem será enviada como notificação ao utilizador.</p>
          <Textarea
            placeholder="Motivo da advertência…"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={4}
          />
          <Button onClick={send} disabled={busy || !msg.trim()} className="w-full rounded-full">
            {busy ? "A enviar…" : "Enviar advertência"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Ban user dialog ─────────────────────────────────────────────────────────── */
const BanUserDialog = ({ user, onDone }: { user: any; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const ban = async () => {
    if (!confirm(`Suspender a conta de ${user.nome}? Esta ação pode ser revertida via edição de perfil.`)) return;
    setBusy(true);
    try {
      await adminService.banUser(user.id, reason.trim() || undefined);
      toast.success("Conta suspensa"); setOpen(false); setReason(""); onDone();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" title="Suspender conta"><Ban className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Suspender conta · {user.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">O utilizador ficará bloqueado e receberá uma notificação.</p>
          <Textarea
            placeholder="Motivo (opcional, será enviado ao utilizador)…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
          />
          <Button onClick={ban} disabled={busy} variant="destructive" className="w-full rounded-full">
            {busy ? "A suspender…" : "Confirmar suspensão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatsTab = () => {
  const [m, setM] = useState<Awaited<ReturnType<typeof adminService.getMetrics>> | null>(null);
  const [q, setQ] = useState<{
    total: number;
    bySource: { source: string; n: number }[];
    byCat: { concurso_id: string; categoria_id: string; n: number }[];
  }>({ total: 0, bySource: [], byCat: [] });
  const [s, setS] = useState({ users: 0, blocked: 0, hidden: 0, paid: 0, codesUsed: 0, codesAvail: 0, payments: 0 });
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    adminService.getMetrics().then(setM);
    adminService.getQuestionsStats().then(setQ);
    adminService.getStats().then(setS);
    adminService.getTopUsers().then(setTopUsers);
  }, []);

  const seedCount = q.bySource.find(b => b.source === "seed")?.n ?? 0;
  const aiCount   = q.bySource.find(b => b.source === "ai")?.n ?? 0;

  const porCategoria = useMemo(() =>
    q.byCat
      .map(r => ({ nome: quizService.getCategoria(r.concurso_id, r.categoria_id)?.nome ?? r.categoria_id, n: r.n }))
      .sort((a, b) => b.n - a.n)
  , [q.byCat]);

  const plansChartData = useMemo(() =>
    (m?.plans ?? []).slice(0, 8).map(p => ({
      name: quizService.getCategoria(p.concurso_id, p.categoria_id)?.nome ?? p.categoria_id,
      total: p.total,
      ativo: p.active,
    }))
  , [m?.plans]);

  const funnelData = m ? [
    { name: "Registados", value: m.totalUsers,           fill: C.sky     },
    { name: "Ativos 30d", value: m.mau,                  fill: C.indigo  },
    { name: "Pagantes",   value: m.paidUsers,             fill: C.emerald },
  ] : [];

  const pieData = m ? m.modeBreakdown
    .filter(r => r.mode)
    .map(r => ({
      name: r.mode === "simulado" ? "Simulado" : r.mode === "aprender" ? "Aprender" : r.mode,
      value: r.n,
    })) : [];
  const PIE_COLORS = [C.sky, C.emerald, C.violet, C.amber];

  if (!m) return (
    <div className="flex items-center justify-center py-20">
      <p className="animate-pulse text-sm text-muted-foreground">A carregar métricas…</p>
    </div>
  );

  const ltvCacLabel = m.ltvCacRatio !== null
    ? `${m.ltvCacRatio}x`
    : m.cacAoa > 0 ? `CAC ≈ ${aoa(m.cacAoa)} (referido)` : "orgânico";

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ══ 1. CRESCIMENTO ════════════════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Crescimento de Utilizadores</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MetricCard icon={<Users className="h-5 w-5" />}     label="Total registados"     value={m.totalUsers.toLocaleString("pt-PT")} accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<UserCheck className="h-5 w-5" />} label="Novos hoje"            value={m.newToday.toLocaleString("pt-PT")} accent="bg-indigo-50 text-indigo-600" />
          <MetricCard icon={<UserCheck className="h-5 w-5" />} label="Novos 7 dias"          value={m.new7d.toLocaleString("pt-PT")} accent="bg-violet-50 text-violet-600" />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Novos 30 dias"        value={m.new30d.toLocaleString("pt-PT")} delta={m.growthRate} deltaLabel="vs. 30d ant." accent="bg-teal-50 text-teal-600" />
          <MetricCard icon={<Activity className="h-5 w-5" />}  label="Crescimento MoM"       value={m.growthRate !== null ? `${m.growthRate >= 0 ? "+" : ""}${m.growthRate}%` : "—"} sub="vs. mês anterior" accent={m.growthRate !== null && m.growthRate >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} />
        </div>
      </section>

      {/* Gráfico novos utilizadores por mês + dia */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Novos utilizadores / mês" sub="Registos acumulados — últimos 12 meses">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={m.userGrowth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gUsr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.sky} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.sky} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="n" name="Novos" stroke={C.sky} fill="url(#gUsr)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Novos utilizadores / dia" sub="Últimos 30 dias">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={m.newUsersDaily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="n" name="Novos" fill={C.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ══ 2. ATIVIDADE (DAU/MAU) ═══════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Atividade Diária & Mensal</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={<Zap className="h-5 w-5" />}      label="DAU (hoje)"      value={m.dau.toLocaleString("pt-PT")} sub="Utilizadores ativos hoje" accent="bg-amber-50 text-amber-600" />
          <MetricCard icon={<Users className="h-5 w-5" />}    label="MAU (30d)"       value={m.mau.toLocaleString("pt-PT")} sub="Ativos nos últimos 30 dias" accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<Activity className="h-5 w-5" />} label="DAU/MAU"         value={`${m.dauMauRatio}%`} sub="Engajamento diário (>20% = bom)" accent={m.dauMauRatio >= 20 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<Clock className="h-5 w-5" />}    label="Tempo médio/user" value={`${m.avgMinPerUser} min`} sub="Estimativa — últimos 30 dias" accent="bg-violet-50 text-violet-600" />
        </div>
      </section>

      {/* Gráfico DAU 30d + tentativas diárias */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Utilizadores ativos / dia (DAU)" sub="Últimos 30 dias">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={m.dauTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="dau" name="DAU" stroke={C.amber} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Questões respondidas / dia" sub="Últimos 30 dias — total e corretas">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={m.attemptsDaily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="n"       name="Total"   fill={C.sky}     radius={[3, 3, 0, 0]} />
              <Bar dataKey="correct" name="Corretas" fill={C.emerald} radius={[3, 3, 0, 0]} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ══ 3. PLANOS PAGOS & CONVERSÃO ══════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Planos Pagos & Conversão</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Utilizadores pagantes"   value={m.paidUsers.toLocaleString("pt-PT")} sub={`de ${m.totalUsers.toLocaleString("pt-PT")} registados`} accent="bg-emerald-50 text-emerald-600" />
          <MetricCard icon={<Percent className="h-5 w-5" />}      label="Taxa de conversão"       value={`${m.conversionRate}%`} sub="Free → Pagante" accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<ShieldCheck className="h-5 w-5" />}  label="Subscrições ativas"      value={m.activeSubs.toLocaleString("pt-PT")} sub={`${m.expiringSoon} a expirar em 14d`} accent="bg-teal-50 text-teal-600" />
          <MetricCard icon={<Lock className="h-5 w-5" />}         label="Subscrições expiradas"   value={m.expiredSubs.toLocaleString("pt-PT")} sub="Total acumulado" accent="bg-slate-100 text-slate-600" />
        </div>
      </section>

      {/* Planos mais populares + Funil */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Planos mais populares" sub="Por categoria — total vs. ativos">
          {plansChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plansChartData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total"  fill={C.sky}     radius={[0, 3, 3, 0]} />
                <Bar dataKey="ativo" name="Ativo"  fill={C.emerald} radius={[0, 3, 3, 0]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem subscrições ainda.</p>
          )}
        </ChartCard>

        <ChartCard title="Funil de conversão" sub="Registados → Ativos → Pagantes">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" name="Utilizadores" radius={[0, 5, 5, 0]}>
                {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ══ 4. RECEITA ═══════════════════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Receita</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Receita Bruta"        value={aoa(m.totalRevenue)}  sub="Subscrições + Moedas" accent="bg-emerald-50 text-emerald-600" />
          <MetricCard icon={<Banknote className="h-5 w-5" />}   label="Saques pagos"          value={aoa(m.totalWithdrawn)} sub={`${m.countSaquesPaid} transferências`} accent="bg-rose-50 text-rose-600" />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Receita Líquida"       value={aoa(m.netRevenue)}    sub="Bruta − Saques" accent={m.netRevenue >= 0 ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-600"} />
          <MetricCard icon={<Repeat2 className="h-5 w-5" />}    label="MRR"                   value={aoa(m.mrr)}           sub="Receita do último mês" accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<BarChart3 className="h-5 w-5" />}  label="ARR"                   value={aoa(m.arr)}           sub="MRR × 12" accent="bg-indigo-50 text-indigo-600" />
          <MetricCard icon={<Clock className="h-5 w-5" />}      label="Saques pendentes"      value={aoa(m.pendingWithdraw)} sub={`${m.countSaquesPending} aguardam pagamento`} accent="bg-amber-50 text-amber-600" />
        </div>
      </section>

      {/* Gráfico receita por mês (stacked: acesso + moedas) + saques */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Receita mensal (Kz)" sub="Subscrições de acesso vs. compras de moedas — últimos 12 meses">
          {m.revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={m.revenue} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, name: string) => [`${Number(v).toLocaleString("pt-PT")} Kz`, name === "acesso" ? "Subscrições" : "Moedas"]} />
                <Bar dataKey="acesso" name="acesso" stackId="a" fill={C.emerald} />
                <Bar dataKey="topup"  name="topup"  stackId="a" fill={C.teal}    radius={[3, 3, 0, 0]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v === "acesso" ? "Subscrições" : "Compras moedas"}</span>} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Ainda sem receita registada.</p>
              <p className="text-xs text-muted-foreground mt-1">Os valores aparecerão ao aprovar pagamentos com valor preenchido.</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Saques pagos / mês (Kz)" sub="Total transferido para utilizadores — últimos 12 meses">
          {m.saques.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={m.saques} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Number(v).toLocaleString("pt-PT")} Kz`, "Saques"]} />
                <Bar dataKey="aoa" name="Saques" fill={C.rose} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem saques pagos ainda.</p>
          )}
        </ChartCard>
      </div>

      {/* ══ 5. LTV / CAC / AQUISIÇÃO ════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">LTV · CAC · Aquisição</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard icon={<Target className="h-5 w-5" />}      label="LTV"           value={aoa(m.ltv)}           sub="Receita total / pagante" accent="bg-violet-50 text-violet-600" />
          <MetricCard icon={<Users className="h-5 w-5" />}       label="ARPU"          value={aoa(m.arpu)}          sub="Receita total / utilizador" accent="bg-indigo-50 text-indigo-600" />
          <MetricCard icon={<DollarSign className="h-5 w-5" />}  label="Ticket médio"  value={aoa(m.avgAccessOrder)} sub="Subscrição c/ valor preench." accent="bg-teal-50 text-teal-600" />
          <MetricCard icon={<UserCheck className="h-5 w-5" />}   label="Indicações"    value={m.referredUsers.toLocaleString("pt-PT")} sub={`por ${m.referrers} referenciadores`} accent="bg-amber-50 text-amber-600" />
          <MetricCard icon={<Target className="h-5 w-5" />}      label="LTV/CAC"       value={ltvCacLabel}          sub={m.ptsToAoa > 0 ? `Taxa câmbio: ${m.ptsToAoa.toFixed(2)} Kz/moeda` : "Aquisição orgânica"} accent="bg-emerald-50 text-emerald-600" />
        </div>
      </section>

      {/* ══ 6. RETENÇÃO ══════════════════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Retenção</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={<Repeat2 className="h-5 w-5" />}        label="Retenção 30d"  value={m.retentionRate !== null ? `${m.retentionRate}%` : "—"} sub={m.prevMAU > 0 ? `${m.retainedCount} de ${m.prevMAU} voltaram` : "dados insuficientes"} accent={m.retentionRate !== null && m.retentionRate >= 40 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<ArrowDownRight className="h-5 w-5" />} label="Churn 30d"     value={m.churnRate !== null ? `${m.churnRate}%` : "—"} sub="1 − retenção" accent={m.churnRate !== null && m.churnRate <= 40 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} />
          <MetricCard icon={<Users className="h-5 w-5" />}          label="MAU anterior"  value={m.prevMAU.toLocaleString("pt-PT")} sub="Ativos em 30–60d atrás" accent="bg-slate-100 text-slate-600" />
          <MetricCard icon={<UserCheck className="h-5 w-5" />}      label="Retidos"       value={m.retainedCount.toLocaleString("pt-PT")} sub="Voltaram este mês" accent="bg-sky-50 text-sky-600" />
        </div>
      </section>

      {/* MAU cohort */}
      <ChartCard title="Evolução MAU" sub="Utilizadores ativos por mês — últimos 6 meses">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={m.mauCohort} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gMau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.violet} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.violet} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="mau" name="MAU" stroke={C.violet} fill="url(#gMau)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ══ 7. ENGAJAMENTO & TEMPO NA PLATAFORMA ════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Engajamento & Tempo na Plataforma</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={<Flame className="h-5 w-5" />}      label="Total questões"    value={m.totalAttempts.toLocaleString("pt-PT")} sub="Desde sempre" accent="bg-amber-50 text-amber-600" />
          <MetricCard icon={<Activity className="h-5 w-5" />}   label="Questões 30d"      value={m.totalAttempts30d.toLocaleString("pt-PT")} sub={`${m.activeUsers30d} users ativos`} accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<Flame className="h-5 w-5" />}      label="Questões/user"     value={m.avgAttemptsPerUser.toLocaleString("pt-PT")} sub="Média 30d" accent="bg-orange-50 text-orange-600" />
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Taxa de acerto"  value={`${m.accuracyRate}%`} sub={`30d: ${m.accuracyRate30d}%`} accent={m.accuracyRate >= 60 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<Clock className="h-5 w-5" />}      label="Horas estimadas"   value={`${m.estHoursTotal.toLocaleString("pt-PT")}h`} sub="Total na plataforma (todas as sessões)" accent="bg-indigo-50 text-indigo-600" />
          <MetricCard icon={<Clock className="h-5 w-5" />}      label="Min./user (30d)"   value={`${m.avgMinPerUser} min`} sub="Simulado 2.5min/q · Aprender 15s/q" accent="bg-violet-50 text-violet-600" />
        </div>
      </section>

      {/* Modo de estudo (pie) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Modos de estudo" sub="Distribuição total de tentativas">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [Number(v).toLocaleString("pt-PT") + " questões", ""]} />
                <Legend iconType="circle" iconSize={9} formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem tentativas registadas.</p>
          )}
        </ChartCard>

        {/* Operações */}
        <Card className="border-border/60 p-4 shadow-card">
          <p className="font-display font-semibold mb-3">Operações</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Bloqueados",          value: s.blocked,   accent: "bg-red-50 text-red-600",    icon: <Ban className="h-4 w-4" /> },
              { label: "Ocultos",             value: s.hidden,    accent: "bg-amber-50 text-amber-600", icon: <EyeOff className="h-4 w-4" /> },
              { label: "Códigos disponíveis", value: s.codesAvail,accent: "bg-teal-50 text-teal-600",  icon: <KeyRound className="h-4 w-4" /> },
              { label: "Pagamentos pend.",    value: s.payments,  accent: "bg-amber-50 text-amber-600", icon: <Clock className="h-4 w-4" /> },
            ].map(it => (
              <div key={it.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", it.accent)}>{it.icon}</div>
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">{it.label}</p>
                  <p className="font-display font-bold text-lg leading-none">{it.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ══ 6b. ACTIVAÇÃO & RETENÇÃO DETALHADA ═══════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Activação & Retenção Detalhada</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={<UserCheck className="h-5 w-5" />}  label="Activados"      value={m.activatedUsers.toLocaleString("pt-PT")} sub="Fizeram ≥1 questão" accent="bg-emerald-50 text-emerald-600" />
          <MetricCard icon={<Percent className="h-5 w-5" />}    label="Taxa activação" value={`${m.activationRate}%`} sub="Activados / registados" accent={m.activationRate >= 50 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<Repeat2 className="h-5 w-5" />}    label="Retenção D1"    value={`${m.retD1Rate}%`} sub="Voltam no dia seguinte" accent={m.retD1Rate >= 30 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<Repeat2 className="h-5 w-5" />}    label="Retenção D7"    value={`${m.retD7Rate}%`} sub="Voltam na semana 1" accent={m.retD7Rate >= 20 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />
          <MetricCard icon={<Repeat2 className="h-5 w-5" />}    label="Retenção D30"   value={`${m.retD30Rate}%`} sub="Voltam no mês 1" accent={m.retD30Rate >= 15 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} />
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Rev./MAU"       value={aoa(m.revenuePerMAU)} sub={m.paybackMonths !== null ? `Payback ≈ ${m.paybackMonths} meses` : "Payback: n/a"} accent="bg-violet-50 text-violet-600" />
        </div>
      </section>

      {/* ══ TOP 3 UTILIZADORES ════════════════════════════════════════════════ */}
      {topUsers.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top 3 Utilizadores
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topUsers.map((u, i) => (
              <TopUserCard key={u.id} user={u} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* ══ 8. CONTEÚDO ═══════════════════════════════════════════════════════ */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Banco de Conteúdo</p>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard icon={<FileText className="h-5 w-5" />}    label="Questões"   value={q.total.toLocaleString("pt-PT")} sub={`${seedCount.toLocaleString("pt-PT")} originais · ${aiCount.toLocaleString("pt-PT")} IA`} accent="bg-emerald-50 text-emerald-600" />
          <MetricCard icon={<BarChart3 className="h-5 w-5" />}   label="Categorias" value={(q.byCat.length || concursos.reduce((acc,c) => acc+c.categorias.length,0)).toLocaleString("pt-PT")} accent="bg-sky-50 text-sky-600" />
          <MetricCard icon={<ShieldCheck className="h-5 w-5" />} label="Concursos"  value={concursos.length.toLocaleString("pt-PT")} accent="bg-indigo-50 text-indigo-600" />
        </div>
      </section>

      <ChartCard title="Questões por categoria" sub={`Meta: 1000/categoria — verde ≥80%, azul ≥40%, laranja <40%`}>
        <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
          {porCategoria.map(c => {
            const p2 = Math.min(100, Math.round((c.n / 1000) * 100));
            return (
              <div key={c.nome}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[65%]">{c.nome}</span>
                  <span className="text-muted-foreground tabular-nums text-xs">{c.n.toLocaleString("pt-PT")} <span className="text-border">/ 1000</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p2}%`, background: p2 >= 80 ? C.emerald : p2 >= 40 ? C.sky : C.amber }} />
                </div>
              </div>
            );
          })}
          {porCategoria.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados.</p>}
        </div>
      </ChartCard>

      {/* Disciplinas dos interesses/temas */}
      {(m.disciplines?.length ?? 0) > 0 && (() => {
        const TARGET_PER_DISC = 500;
        const enriched = (m.disciplines ?? []).map(d => {
          const meta = disciplinaById(d.disciplina);
          return { slug: d.disciplina, nome: meta?.nome ?? d.disciplina, area: meta?.area ?? "Outro", n: d.n };
        });
        const totalQ = enriched.reduce((s, d) => s + d.n, 0);
        const withTarget = enriched.filter(d => d.n >= TARGET_PER_DISC).length;
        return (
          <ChartCard
            title="Questões por Disciplina (Temas)"
            sub={`${enriched.length} disciplinas · ${totalQ.toLocaleString("pt-PT")} questões · ${withTarget}/${enriched.length} com ≥${TARGET_PER_DISC}`}
          >
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {enriched.sort((a, b) => b.n - a.n).map(d => {
                const pct = Math.min(100, Math.round((d.n / TARGET_PER_DISC) * 100));
                return (
                  <div key={d.slug}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-semibold text-muted-foreground shrink-0 w-20 truncate">{d.area}</span>
                        <span className="font-medium truncate">{d.nome}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums text-xs shrink-0">
                        {d.n.toLocaleString("pt-PT")} <span className="text-border">/ {TARGET_PER_DISC}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? C.emerald : pct >= 50 ? C.sky : C.amber }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        );
      })()}

    </div>
  );
};

/* ═══════════════════════ USERS ═══════════════════════ */
type AccessRow = { id: string; concurso_id: string; categoria_id: string; code: string | null; activated_at: string };

const UsersTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, AccessRow[]>>({});
  const [q, setQ] = useState("");
  const [uFilter, setUFilter] = useState<"todos" | "pagos" | "bloqueados">("todos");
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const openDetail = async (id: string) => {
    setDetailLoading(id);
    try {
      const stats = await adminService.getUserStats(id);
      if (stats) { setDetailUser(stats); setDetailOpen(true); }
      else toast.error("Não foi possível carregar os dados do utilizador.");
    } catch {
      toast.error("Erro ao carregar ficha do utilizador.");
    } finally {
      setDetailLoading(null);
    }
  };

  const load = async () => {
    const [profiles, acc] = await Promise.all([adminService.listProfiles(500), adminService.listAllAccess(2000)]);
    setRows(profiles);
    const map: Record<string, AccessRow[]> = {};
    (acc ?? []).forEach((a: any) => { (map[a.user_id] ||= []).push(a); });
    setAccessMap(map);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const { error } = await adminService.updateProfile(id, patch);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Eliminar utilizador definitivamente?")) return;
    const { error } = await adminService.deleteProfile(id);
    if (error) toast.error(error.message); else { toast.success("Eliminado"); load(); }
  };
  const catNome = (concId: string, catId: string) =>
    concursos.find(c => c.id === concId)?.categorias.find(x => x.id === catId)?.nome ?? catId;

  const filtered = rows.filter(r => {
    const matchQ = !q || r.nome?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase());
    if (!matchQ) return false;
    if (uFilter === "pagos") return (accessMap[r.id]?.length ?? 0) > 0;
    if (uFilter === "bloqueados") return !!r.blocked;
    return true;
  });

  const UFILTERS = [
    { key: "todos" as const,      label: "Todos" },
    { key: "pagos" as const,      label: "Com plano" },
    { key: "bloqueados" as const, label: "Bloqueados" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Users className="h-4 w-4" />}>{filtered.length} utilizadores</SectionTitle>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Procurar por nome ou email…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
        {UFILTERS.map(f => (
          <Button key={f.key} size="sm" variant={uFilter === f.key ? "default" : "outline"} className="rounded-full" onClick={() => setUFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>
      <UserStatsModal user={detailUser} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <div className="space-y-2">
        {filtered.map(r => {
          const access = accessMap[r.id] ?? [];
          return (
            <Card key={r.id} className="border-border/60 p-3 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative cursor-pointer shrink-0" onClick={() => openDetail(r.id)}>
                  <Avatar className="h-11 w-11 ring-2 ring-border/40">
                    <AvatarImage src={r.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {r.nome?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {detailLoading === r.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(r.id)}>
                  <p className="font-semibold truncate flex flex-wrap items-center gap-1.5">
                    {r.nome}
                    {r.blocked && <Badge variant="destructive" className="text-[10px]">Suspenso</Badge>}
                    {r.hidden && <Badge variant="secondary" className="text-[10px]">Oculto</Badge>}
                    {access.length > 0
                      ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">{access.length} plano(s)</Badge>
                      : <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem plano</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email} · {r.pontos ?? 0} pts · {r.moedas ?? 0} moedas
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {r.last_seen ? formatRelative(r.last_seen) : "nunca"}
                    </span>
                  </p>
                  {access.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {access.map(a => (
                        <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          {catNome(a.concurso_id, a.categoria_id)}
                          {a.code && <span className="font-mono text-emerald-500">· {a.code}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <ManageAccessDialog user={r} access={access} onChanged={load} />
                  <WarnUserDialog user={r} onDone={load} />
                  {r.blocked
                    ? <Button size="sm" variant="outline" title="Desbloquear" onClick={() => update(r.id, { blocked: false })}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    : <BanUserDialog user={r} onDone={load} />
                  }
                  <Button size="sm" variant="outline" title={r.hidden ? "Mostrar" : "Ocultar"} onClick={() => update(r.id, { hidden: !r.hidden })}>
                    {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" title="Eliminar" onClick={() => del(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum utilizador encontrado.</p>}
      </div>
    </div>
  );
};

/* ── Manage Access Dialog ─────────────────────────────────────────────────── */
const ManageAccessDialog = ({ user, access, onChanged }: { user: any; access: AccessRow[]; onChanged: () => void }) => {
  const [open, setOpen] = useState(false);
  const [conc, setConc] = useState(concursos[0]?.id ?? "");
  const [cat, setCat] = useState(concursos[0]?.categorias?.[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const concurso = concursos.find(c => c.id === conc);
  const cats = concurso?.categorias ?? [];

  const catNome = (cid: string, catId: string) =>
    concursos.find(c => c.id === cid)?.categorias.find(x => x.id === catId)?.nome ?? catId;

  const activate = async () => {
    if (!conc || !cat) return;
    setBusy(true);
    try {
      const catName = catNome(conc, cat);
      const code = await adminService.grantAccess({ userId: user.id, concursoId: conc, categoriaId: cat, categoriaNome: catName });
      await notificationsService.create({ userId: user.id, title: "Conta activada", body: `Acesso a ${catName} activado. Código: ${code}.` });
      toast.success(`Acesso activado (código ${code})`);
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao activar");
    } finally { setBusy(false); }
  };

  const deactivate = async (a: AccessRow) => {
    if (!confirm(`Desactivar acesso a "${a.categoria_id}"?`)) return;
    const { error } = await adminService.deactivateAccess(a.id);
    if (error) toast.error(error.message);
    else { toast.success("Acesso desactivado"); onChanged(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Gerir acessos"><KeyRound className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acessos · {user.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activos</p>
            {access.length === 0
              ? <p className="text-sm text-muted-foreground">Nenhum acesso activo.</p>
              : (
                <div className="space-y-1.5">
                  {access.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{catNome(a.concurso_id, a.categoria_id)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{a.code ?? "—"} · {new Date(a.activated_at).toLocaleDateString("pt-PT")}</p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deactivate(a)}>
                        <Lock className="h-3.5 w-3.5 mr-1" /> Desactivar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div className="border-t pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activar nova categoria</p>
            <div className="grid grid-cols-2 gap-2">
              <Select value={conc} onValueChange={v => { setConc(v); setCat(concursos.find(x => x.id === v)?.categorias?.[0]?.id ?? ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={activate} disabled={busy} className="mt-2 w-full rounded-full">
              <Unlock className="h-4 w-4 mr-1" /> {busy ? "A activar…" : "Activar acesso"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════ CODES ═══════════════════════ */
const CodesTab = () => {
  const [conc, setConc] = useState(concursos[0]?.id ?? "");
  const [cat, setCat]   = useState<string>(concursos[0]?.categorias?.[0]?.id ?? "");
  const [stats, setStats] = useState({ available: 0, used: 0 });
  const [showUsed, setShowUsed] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [count, setCount] = useState(500);
  const [busy, setBusy] = useState(false);

  const cats = concursos.find(c => c.id === conc)?.categorias ?? [];

  const load = async () => {
    if (!conc || !cat) return;
    setStats(await adminService.getCodeStats(conc, cat));
    setList(await adminService.listCodes(conc, cat, showUsed ? "used" : "available", 300));
  };
  useEffect(() => { load(); }, [conc, cat, showUsed]);

  const generate = async () => {
    setBusy(true);
    try {
      const n = await adminService.generateCodes(conc, cat, count);
      toast.success(`${n} códigos gerados`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<KeyRound className="h-4 w-4" />}>Códigos de acesso</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={conc} onValueChange={v => { setConc(v); setCat(concursos.find(x => x.id === v)?.categorias?.[0]?.id ?? ""); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KPI icon={<KeyRound className="h-5 w-5" />} label="Disponíveis" value={stats.available} accent="bg-emerald-50 text-emerald-600" />
        <KPI icon={<Lock className="h-5 w-5" />}    label="Usados"       value={stats.used}      accent="bg-slate-100 text-slate-600" />
      </div>

      <Card className="border-border/60 p-4 shadow-card">
        <p className="mb-3 font-display font-semibold">Gerar códigos</p>
        <div className="flex gap-2">
          <Input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 0)} className="w-32" />
          <Button onClick={generate} disabled={busy || !count} className="rounded-full">
            <RefreshCw className={cn("h-4 w-4 mr-1.5", busy && "animate-spin")} /> Gerar
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Código de 6 dígitos único por categoria.</p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-border p-0.5">
          <button onClick={() => setShowUsed(false)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", !showUsed ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Disponíveis</button>
          <button onClick={() => setShowUsed(true)}  className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", showUsed  ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Usados</button>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{list.length} listados</span>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
          navigator.clipboard.writeText(list.map((c: any) => c.code).join("\n"));
          toast.success("Copiados");
        }}>Copiar todos</Button>
      </div>

      <Card className="border-border/60 p-4 shadow-card">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 max-h-[400px] overflow-y-auto">
          {list.map((c: any) => (
            <div key={c.code} className="rounded-xl border border-border/60 bg-muted/40 py-2.5 text-center font-mono text-sm font-bold tracking-widest select-all">
              {c.code}
            </div>
          ))}
          {list.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Sem códigos.</p>}
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════ NOTIFICATIONS ═══════════════════════ */
const NotifsTab = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    adminService.listUsersBasic(500).then(setUsers);
    loadRecent();
  }, []);

  const loadRecent = async () => { setRecent(await adminService.listRecentNotifications(20)); };

  const send = async () => {
    if (!title || !body) return toast.error("Preencha título e mensagem");
    const { error } = await adminService.sendNotification({ title, body, createdBy: user?.id, userId: target === "all" ? null : target });
    if (error) toast.error(error.message);
    else { toast.success("Enviada"); setTitle(""); setBody(""); loadRecent(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<Bell className="h-4 w-4" />}>Notificações</SectionTitle>

      <Card className="border-border/60 p-5 shadow-card">
        <p className="mb-3 font-display font-semibold">Nova notificação</p>
        <div className="space-y-3">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os utilizadores (broadcast)</SelectItem>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.nome} · {u.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Mensagem" value={body} onChange={e => setBody(e.target.value)} rows={3} />
          <Button onClick={send} className="rounded-full">
            <Bell className="h-4 w-4 mr-1.5" /> Enviar
          </Button>
        </div>
      </Card>

      <Card className="border-border/60 p-5 shadow-card">
        <p className="mb-3 font-display font-semibold">Recentes</p>
        <div className="space-y-2">
          {recent.map(n => (
            <div key={n.id} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
              <p className="text-sm font-semibold">
                {n.title}
                {n.user_id === null && <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">broadcast</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ainda.</p>}
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════ COMPROVATIVOS ═══════════════════════ */
const ComprovativosTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"all" | "awaiting_review" | "approved" | "rejected">("awaiting_review");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const data = await adminService.listPaymentRequests(filter, 200);
    setRows(data);
    const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
    if (ids.length) {
      const ps = await adminService.listProfilesByIds(ids as string[]);
      const map: Record<string, any> = {};
      ps.forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const openComprovativo = async (path: string) => {
    try { window.open(await adminService.getComprovativoUrl(path), "_blank"); }
    catch { toast.error("Não foi possível abrir o comprovativo"); }
  };

  const aprovar = async (r: any) => {
    setBusy(r.id);
    try {
      const code = await adminService.approvePayment(r);
      await notificationsService.create({ userId: r.user_id, title: "Conta activada", body: `Acesso a ${r.categoria_nome ?? r.categoria_id} activado. Código: ${code}.` });
      toast.success("Aprovado e activado"); load();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(null); }
  };

  const rejeitar = async (r: any) => {
    if (!confirm("Rejeitar este comprovativo?")) return;
    await adminService.rejectPayment(r.id);
    await notificationsService.create({ userId: r.user_id, title: "Comprovativo recusado", body: `O comprovativo para ${r.categoria_nome ?? r.categoria_id} não foi validado. Envie novamente.` });
    toast.success("Rejeitado"); load();
  };

  const FILTERS = [
    { key: "awaiting_review", label: "Por verificar" },
    { key: "approved",        label: "Aprovados" },
    { key: "rejected",        label: "Rejeitados" },
    { key: "all",             label: "Todos" },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<FileText className="h-4 w-4" />}>Comprovativos de pagamento</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map(r => {
          const p = profiles[r.user_id];
          return (
            <Card key={r.id} className="border-border/60 p-3 shadow-card">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border/40">
                  <AvatarImage src={p?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">{(p?.nome || r.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                  <p className="text-xs text-foreground/80 mt-1">{r.categoria_nome ?? r.categoria_id} · <span className="text-muted-foreground">{r.concurso_id}</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatRelative(r.created_at)} · <span className="font-medium">{r.status}</span></p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.comprovativo_url && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => openComprovativo(r.comprovativo_url)}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                  )}
                  {r.status === "awaiting_review" && (
                    <>
                      <Button size="sm" disabled={busy === r.id} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => aprovar(r)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-full" onClick={() => rejeitar(r)}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum comprovativo.</p>}
      </div>
    </div>
  );
};

/* ═══════════════════════ PREPARATÓRIOS ═══════════════════════ */
const emptyCurso = (): Partial<CursoPreparatorio> => ({
  concurso_id: concursos[0]?.id ?? "", nome: "", logo_url: "", contacto: "", link_externo: "", descricao: "", ativo: true, ordem: 0,
});

const PreparatoriosTab = () => {
  const [rows, setRows] = useState<CursoPreparatorio[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CursoPreparatorio> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setRows(await cursosService.adminList());
  useEffect(() => { load(); }, []);

  const concNome = (id: string) => concursos.find(c => c.id === id)?.nome ?? id;
  const openNew  = () => { setEditing(emptyCurso()); setOpen(true); };
  const openEdit = (c: CursoPreparatorio) => { setEditing({ ...c }); setOpen(true); };

  const save = async () => {
    if (!editing?.nome?.trim() || !editing?.concurso_id) { toast.error("Preencha o nome e o concurso"); return; }
    setBusy(true);
    const payload: any = {
      concurso_id: editing.concurso_id, nome: editing.nome.trim(),
      logo_url: editing.logo_url?.trim() || null, contacto: editing.contacto?.trim() || null,
      link_externo: editing.link_externo?.trim() || null, descricao: editing.descricao?.trim() || null,
      ativo: editing.ativo ?? true, ordem: Number(editing.ordem) || 0,
    };
    const { error } = editing.id ? await cursosService.update(editing.id, payload) : await cursosService.create(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado"); setOpen(false); setEditing(null); load();
  };

  const del    = async (id: string) => { if (!confirm("Eliminar?")) return; const { error } = await cursosService.remove(id); if (error) toast.error(error.message); else { toast.success("Eliminado"); load(); } };
  const toggle = async (c: CursoPreparatorio) => { const { error } = await cursosService.update(c.id, { ativo: !c.ativo }); if (error) toast.error(error.message); else load(); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<GraduationCap className="h-4 w-4" />}>{rows.length} preparatório(s)</SectionTitle>
        <Button size="sm" className="rounded-full" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>

      <div className="space-y-2">
        {rows.map(c => (
          <Card key={c.id} className="border-border/60 p-3 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                {c.logo_url ? <img src={c.logo_url} alt={c.nome} className="h-full w-full object-contain" /> : <GraduationCap className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold flex items-center gap-2 flex-wrap">
                  {c.nome}
                  {!c.ativo && <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
                  <Badge variant="outline" className="text-[10px]">{concNome(c.concurso_id)}</Badge>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.contacto && <span className="mr-2">{c.contacto}</span>}
                  {c.link_externo && <span className="text-primary">{c.link_externo}</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => toggle(c)}>{c.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><RefreshCw className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum preparatório.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} preparatório</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground">Concurso</label>
                <Select value={editing.concurso_id} onValueChange={v => setEditing({ ...editing, concurso_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{concursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground">Nome</label><Input value={editing.nome ?? ""} onChange={e => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex: Preparatório Saber+" /></div>
              <div><label className="text-xs text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Logótipo (URL)</label><Input value={editing.logo_url ?? ""} onChange={e => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://..." /></div>
              <div><label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Contacto</label><Input value={editing.contacto ?? ""} onChange={e => setEditing({ ...editing, contacto: e.target.value })} placeholder="+244 9XX XXX XXX" /></div>
              <div><label className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Link externo</label><Input value={editing.link_externo ?? ""} onChange={e => setEditing({ ...editing, link_externo: e.target.value })} placeholder="https://..." /></div>
              <div><label className="text-xs text-muted-foreground">Descrição</label><Textarea value={editing.descricao ?? ""} onChange={e => setEditing({ ...editing, descricao: e.target.value })} placeholder="Breve descrição" /></div>
              <div className="w-24"><label className="text-xs text-muted-foreground">Ordem</label><Input type="number" value={editing.ordem ?? 0} onChange={e => setEditing({ ...editing, ordem: Number(e.target.value) })} /></div>
              <Button className="w-full rounded-full" disabled={busy} onClick={save}>{busy ? "A guardar…" : "Guardar"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ═══════════════════════ CARREGAMENTOS ═══════════════════════ */
const CarregamentosTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"all" | "awaiting_review" | "approved" | "rejected">("awaiting_review");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const data = (await adminService.listTopupRequests("all", 200)).filter((r: any) =>
      filter === "all" ? true : r.status === filter,
    );
    setRows(data);
    const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
    if (ids.length) {
      const ps = await adminService.listProfilesByIds(ids as string[]);
      const map: Record<string, any> = {}; ps.forEach((p: any) => { map[p.id] = p; }); setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const aprovar = async (r: any) => {
    setBusy(r.id);
    try {
      await adminService.approveTopup(r);
      await notificationsService.create({ userId: r.user_id, title: "Moedas creditadas", body: `${r.moedas} moedas adicionadas à sua carteira.` });
      toast.success("Creditado"); load();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(null); }
  };

  const rejeitar = async (r: any) => {
    if (!confirm("Rejeitar?")) return;
    await adminService.rejectTopup(r.id);
    toast.success("Rejeitado"); load();
  };

  const revogar = async (r: any) => {
    const profile = profiles[r.user_id];
    if (!confirm(`Revogar ${r.moedas} moedas de ${profile?.nome ?? r.email}?\n\nEsta ação vai deduzir as moedas da conta (prevenção de fraude).`)) return;
    setBusy(r.id);
    try {
      await adminService.revokeTopup(r.id);
      await notificationsService.create({ userId: r.user_id, title: "Carregamento revogado", body: `${r.moedas} moedas foram removidas da sua conta após revisão.` });
      toast.success("Moedas revogadas"); load();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(null); }
  };

  const FILTERS = [
    { key: "awaiting_review", label: "Por verificar" },
    { key: "approved",        label: "Aprovados" },
    { key: "rejected",        label: "Rejeitados" },
    { key: "all",             label: "Todos (incl. revogados)" },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<Coins className="h-4 w-4" />}>Carregamentos de moedas</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f.key)}>{f.label}</Button>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map(r => {
          const p = profiles[r.user_id];
          return (
            <Card key={r.id} className="border-border/60 p-3 shadow-card">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border/40">
                  <AvatarImage src={p?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">{(p?.nome || r.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                  <p className="text-sm font-semibold mt-1">{r.amount_aoa} AOA → <span className="text-primary">{r.moedas} moedas</span></p>
                  <p className="text-[11px] text-muted-foreground">{formatRelative(r.created_at)} · <span className={r.status === "revoked" ? "text-destructive font-semibold" : ""}>{r.status === "revoked" ? "REVOGADO" : r.status}</span></p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.comprovativo_url && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open(r.comprovativo_url, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                  )}
                  {r.status === "awaiting_review" && (
                    <>
                      <Button size="sm" disabled={busy === r.id} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => aprovar(r)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Creditar
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-full" onClick={() => rejeitar(r)}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <Button size="sm" disabled={busy === r.id} variant="outline" className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => revogar(r)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revogar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum carregamento.</p>}
      </div>
    </div>
  );
};

/* ═══════════════════════ SAQUES ═══════════════════════ */
const SaquesTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const data = await adminService.listWithdrawals(filter, 200);
    setRows(data);
    const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
    if (ids.length) {
      const ps = await adminService.listProfilesByIds(ids as string[]);
      const map: Record<string, any> = {}; ps.forEach((p: any) => { map[p.id] = p; }); setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [filter]);

  const pagar = async (r: any) => {
    if (!confirm(`Confirmar pagamento de ${r.aoa} AOA ao IBAN ${r.iban}?`)) return;
    setBusy(r.id);
    try {
      await adminService.markWithdrawalPaid(r.id);
      await notificationsService.create({ userId: r.user_id, title: "Saque pago", body: `Saque de ${r.aoa} AOA transferido para o seu IBAN.` });
      toast.success("Marcado como pago"); load();
    } finally { setBusy(null); }
  };

  const rejeitar = async (r: any) => {
    if (!confirm("Rejeitar? As moedas serão devolvidas.")) return;
    await adminService.rejectWithdrawal(r);
    await notificationsService.create({ userId: r.user_id, title: "Saque rejeitado", body: `Pedido rejeitado. As ${r.moedas} moedas foram devolvidas.` });
    toast.success("Rejeitado e devolvido"); load();
  };

  const FILTERS = [
    { key: "pending",  label: "Pendentes" },
    { key: "paid",     label: "Pagos" },
    { key: "rejected", label: "Rejeitados" },
    { key: "all",      label: "Todos" },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<Banknote className="h-4 w-4" />}>Pedidos de saque</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f.key)}>{f.label}</Button>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map(r => {
          const p = profiles[r.user_id];
          return (
            <Card key={r.id} className="border-border/60 p-3 shadow-card">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border/40">
                  <AvatarImage src={p?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">{(p?.nome || r.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                  <p className="text-sm font-semibold mt-1">{r.moedas} moedas → <span className="text-primary">{r.aoa} AOA</span></p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">IBAN: {r.iban}</p>
                  <p className="text-[11px] text-muted-foreground">{formatRelative(r.created_at)} · {r.status}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" disabled={busy === r.id} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => pagar(r)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pago
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-full" onClick={() => rejeitar(r)}>
                      <Ban className="h-3.5 w-3.5 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum saque.</p>}
      </div>
    </div>
  );
};

/* ═══════════════════════ PROMOÇÕES ═══════════════════════ */
type PromoRow = { id: string; label: string; discount_pct: number; starts_at: string; ends_at: string; is_active: boolean; created_at: string };

const PromocoesTab = () => {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", discount_pct: 100, starts_at: "", ends_at: "" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try { const d = await api.get<{ promos: PromoRow[] }>("/promo/admin"); setPromos(d.promos); }
    catch { toast.error("Erro ao carregar promoções"); }
  };
  useEffect(() => { load(); }, []);

  const isRunning = (p: PromoRow) => {
    const now = Date.now();
    return p.is_active && now >= new Date(p.starts_at).getTime() && now < new Date(p.ends_at).getTime();
  };

  const toggle = async (p: PromoRow) => {
    setBusy(p.id);
    try { await api.patch(`/promo/admin/${p.id}`, { is_active: !p.is_active }); toast.success(p.is_active ? "Desactivada" : "Activada"); load(); }
    catch { toast.error("Erro"); }
    finally { setBusy(null); }
  };

  const del = async (p: PromoRow) => {
    if (!confirm(`Eliminar "${p.label}"?`)) return;
    setBusy(p.id);
    try { await api.delete(`/promo/admin/${p.id}`); toast.success("Eliminada"); load(); }
    catch { toast.error("Erro"); }
    finally { setBusy(null); }
  };

  const create = async () => {
    if (!form.starts_at || !form.ends_at) return toast.error("Preencha as datas");
    setCreating(true);
    try {
      await api.post("/promo/admin", { label: form.label || "Promoção", discount_pct: Number(form.discount_pct), starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() });
      toast.success("Criada"); setForm({ label: "", discount_pct: 100, starts_at: "", ends_at: "" }); load();
    } catch { toast.error("Erro"); }
    finally { setCreating(false); }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionTitle icon={<Tag className="h-4 w-4" />}>Promoções</SectionTitle>

      {/* Form */}
      <Card className="border-border/60 p-5 shadow-card">
        <p className="mb-4 font-display font-semibold">Nova promoção</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome / label</label>
            <Input placeholder="Ex: Lançamento" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Desconto (%)</label>
            <Input type="number" min={0} max={100} value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: Number(e.target.value) }))} />
            <p className="mt-1 text-[11px] text-muted-foreground">100% = acesso gratuito durante a promoção</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Início</label>
            <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Fim</label>
            <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
          </div>
        </div>
        <Button onClick={create} disabled={creating} className="mt-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          {creating ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />A criar…</> : <><Plus className="h-4 w-4 mr-1.5" />Criar promoção</>}
        </Button>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {promos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma promoção.</p>}
        {promos.map(p => {
          const running = isRunning(p);
          return (
            <Card key={p.id} className="border-border/60 p-4 shadow-card">
              <div className="flex flex-wrap items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", running ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground")}>
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold flex flex-wrap items-center gap-2">
                    {p.label}
                    <span className="text-sm font-bold text-amber-600">{p.discount_pct}% off</span>
                    {running && <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">A decorrer</span>}
                    {!p.is_active && <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Inactiva</span>}
                    {p.is_active && !running && new Date(p.ends_at) < new Date() && <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Expirada</span>}
                    {p.is_active && !running && new Date(p.starts_at) > new Date() && <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Agendada</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="mr-3">Início: {fmtDate(p.starts_at)}</span>
                    <span>Fim: {fmtDate(p.ends_at)}</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="rounded-full" disabled={busy === p.id} onClick={() => toggle(p)}>
                    {p.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-full" disabled={busy === p.id} onClick={() => del(p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;
