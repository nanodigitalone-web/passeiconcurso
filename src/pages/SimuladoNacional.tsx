import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examsService, type ExamSummary } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Award, CalendarClock, Coins, Loader2, Play, Timer, Trophy, Users } from "lucide-react";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long" }) +
  " às " +
  new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

const countdown = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};

const SimuladoNacional = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const load = () => examsService.list().then((e) => { setExams(e); setLoading(false); });
  useEffect(() => { load(); }, []);

  // Refresh countdowns every 30s.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const join = async (exam: ExamSummary) => {
    setJoining(exam.id);
    try {
      await examsService.join(exam.id);
      await refreshProfile();
      toast.success("Inscrição confirmada! Volta quando o simulado abrir.");
      load();
    } catch (e: any) {
      toast.error(
        e?.code === "insufficient_coins" ? `Moedas insuficientes (custa ${exam.entry_cost_moedas}).`
        : e?.code === "exam_ended" ? "Este simulado já terminou."
        : "Não foi possível inscrever.",
      );
    } finally {
      setJoining(null);
    }
  };

  const now = Date.now();
  const upcoming = exams.filter((e) => new Date(e.ends_at).getTime() > now);
  const past = exams.filter((e) => new Date(e.ends_at).getTime() <= now);

  const renderExam = (exam: ExamSummary, highlight: boolean) => {
    const started = new Date(exam.starts_at).getTime() <= now;
    const ended = new Date(exam.ends_at).getTime() <= now;
    const joined = !!exam.my_entry;
    const finished = !!exam.my_entry?.finished_at;
    const cd = countdown(exam.starts_at);

    return (
      <Card
        key={exam.id}
        className={cn(
          "overflow-hidden p-5 shadow-card",
          highlight
            ? "border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 text-white shadow-elegant"
            : "border-border/60",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("text-xs font-bold uppercase tracking-wider", highlight ? "opacity-70" : "text-primary")}>
              {ended ? "Terminado" : started ? "A decorrer" : "Próximo evento"}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-snug">{exam.title}</h2>
            {exam.description && (
              <p className={cn("mt-1 text-xs leading-relaxed", highlight ? "opacity-80" : "text-muted-foreground")}>
                {exam.description}
              </p>
            )}
          </div>
          {!ended && cd && (
            <div className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-center",
              highlight ? "bg-white/15 backdrop-blur-sm" : "bg-muted",
            )}>
              <CalendarClock className="mx-auto h-4 w-4 opacity-80" />
              <p className="mt-1 text-[10px] font-bold leading-tight">{cd}</p>
            </div>
          )}
        </div>

        <div className={cn(
          "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium",
          highlight ? "opacity-90" : "text-muted-foreground",
        )}>
          <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{exam.duration_minutes} min · {exam.question_count} questões</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam.participants} inscritos</span>
          <span className="inline-flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            {exam.entry_cost_moedas > 0 ? `${exam.entry_cost_moedas} moedas` : "Grátis"}
          </span>
          {(exam.prize_moedas?.[0] ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />1.º: {exam.prize_moedas[0]} moedas</span>
          )}
        </div>

        <p className={cn("mt-2 text-[11px]", highlight ? "opacity-70" : "text-muted-foreground")}>
          {ended ? `Decorreu a ${fmtDate(exam.starts_at)}` : `${fmtDate(exam.starts_at)} · janela até ${fmtDate(exam.ends_at)}`}
        </p>

        <div className="mt-4">
          {finished || ended ? (
            <Button
              onClick={() => navigate(`/simulado-nacional/${exam.id}`)}
              variant={highlight ? "secondary" : "outline"}
              className="w-full rounded-full font-semibold"
            >
              <Trophy className="mr-2 h-4 w-4" />
              {finished && exam.my_entry?.score != null
                ? `Fizeste ${exam.my_entry.score}/${exam.my_entry.total} · ver classificação`
                : "Ver classificação"}
            </Button>
          ) : !joined ? (
            <Button
              onClick={() => join(exam)}
              disabled={joining === exam.id}
              className={cn(
                "w-full rounded-full font-bold",
                highlight ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-primary",
              )}
            >
              {joining === exam.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                exam.entry_cost_moedas > 0 ? `Inscrever (${exam.entry_cost_moedas} moedas)` : "Inscrever grátis"}
            </Button>
          ) : started ? (
            <Button
              onClick={() => navigate(`/simulado-nacional/${exam.id}`)}
              className={cn(
                "w-full rounded-full font-bold",
                highlight ? "bg-white text-primary hover:bg-white/90" : "bg-gradient-primary",
              )}
            >
              <Play className={cn("mr-2 h-4 w-4", highlight && "fill-primary")} />
              {exam.my_entry?.started_at ? "Retomar prova" : "Começar agora"}
            </Button>
          ) : (
            <Button disabled variant={highlight ? "secondary" : "outline"} className="w-full rounded-full font-semibold">
              Inscrito · abre {cd ? `em ${cd}` : "brevemente"}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <AppShell>
      <Seo
        title="Simulado Nacional · Passei"
        description="O evento mensal do Passei: todos os candidatos, as mesmas questões, o mesmo tempo. Compete pelo pódio nacional."
        path="/simulado-nacional"
      />
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Simulado Nacional</h1>
        <p className="text-sm text-muted-foreground">Todos os candidatos, as mesmas questões, o mesmo tempo</p>
      </header>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">A carregar eventos…</Card>
      ) : exams.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-8 text-center shadow-none">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold">Nenhum evento agendado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O próximo Simulado Nacional será anunciado nas notificações. Fica atento!
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((e, i) => renderExam(e, i === 0))}
          {past.length > 0 && (
            <>
              <p className="pt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Anteriores</p>
              {past.map((e) => renderExam(e, false))}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default SimuladoNacional;
