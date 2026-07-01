import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resultsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import {
  Play, BookOpen, Trophy, Gift,
  Flame, Zap, BarChart2, ChevronRight,
  MapPin, Compass,
} from "lucide-react";

const Index = () => {
  const { profile } = useAuth();

  const interessesAtivo = !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const simuladoTo = interessesAtivo
    ? "/quiz/interesses/interesses"
    : profile?.concurso_id && profile?.categoria_id
      ? `/quiz/${profile.concurso_id}/${profile.categoria_id}`
      : "/concursos";

  const aprenderTo = interessesAtivo
    ? "/aprender/interesses/interesses"
    : profile?.concurso_id && profile?.categoria_id
      ? `/aprender/${profile.concurso_id}/${profile.categoria_id}`
      : "/aprender";

  const results   = resultsService.getResults();
  const totalQ    = results.reduce((s, r) => s + r.total, 0);
  const acertos   = results.reduce((s, r) => s + r.acertos, 0);
  const taxa      = totalQ ? Math.round((acertos / totalQ) * 100) : 0;
  const nome      = profile?.nome?.split(" ")[0] || "Candidato";
  const pontos    = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const streak    = profile?.streak ?? 0;
  const hasCateg  = !!(profile?.concurso_id && profile?.categoria_id);
  const categNome = profile?.categoria_nome ?? "";

  // Saudação por hora
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 19 ? "Boa tarde" : "Boa noite";

  return (
    <AppShell>
      <Seo
        title="Passei · Prepara-te para os concursos em Angola"
        description="Simulados comentados, trilha por níveis e ranking. A app de estudo para concursos em Angola."
        path="/"
      />

      {/* ── Hero: jogar agora ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant">
        {/* decoração */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          {/* saudação */}
          <p className="text-sm font-medium opacity-70">{saudacao},</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">{nome}</h1>

          {/* categoria activa */}
          {hasCateg && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <MapPin className="h-3 w-3 opacity-80" />
              {categNome}
            </div>
          )}

          {/* CTA principal */}
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              asChild
              size="lg"
              className="w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <Link to={simuladoTo} className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5 fill-primary" />
                {hasCateg ? "Começar Simulado" : "Escolher Categoria"}
              </Link>
            </Button>

            {hasCateg && (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full rounded-2xl border border-white/25 text-white hover:bg-white/10 font-semibold"
              >
                <Link to={aprenderTo} className="flex items-center justify-center gap-2">
                  <BookOpen className="h-4.5 w-4.5" /> Modo Aprender
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats rápidas ─────────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          {
            icon: <Flame className="h-4 w-4" />,
            value: streak > 0 ? `${streak}d` : "—",
            label: "Sequência",
            accent: streak > 0 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground",
          },
          {
            icon: <Zap className="h-4 w-4" />,
            value: pontos > 0 ? pontos.toLocaleString("pt-PT") : "—",
            label: "Pontos",
            accent: "bg-amber-100 text-amber-700",
          },
          {
            icon: <BarChart2 className="h-4 w-4" />,
            value: totalQ > 0 ? `${taxa}%` : "—",
            label: "Acerto",
            accent: taxa >= 60 ? "bg-emerald-100 text-emerald-700" : totalQ > 0 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground",
          },
        ].map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1.5 border-border/60 py-3.5 shadow-card">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.accent}`}>
              {s.icon}
            </div>
            <p className="font-display text-base font-bold leading-none">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Acções secundárias ────────────────────────────────────────────── */}
      <section className="mt-5">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              to: "/ranking",
              icon: Trophy,
              label: "Ranking",
              desc: "Vê onde estás",
              accent: "bg-violet-100 text-violet-700",
            },
            {
              to: "/percurso",
              icon: BarChart2,
              label: "Percurso",
              desc: "O teu relatório",
              accent: "bg-blue-100 text-blue-700",
            },
            {
              to: "/partilhar",
              icon: Gift,
              label: "Convidar",
              desc: "+50 pontos por amigo",
              accent: "bg-emerald-100 text-emerald-700",
            },
            {
              to: "/concursos",
              icon: Compass,
              label: "Explorar",
              desc: "Todos os concursos",
              accent: "bg-rose-100 text-rose-700",
            },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="group flex items-center gap-3 border-border/60 p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.accent} transition-transform group-hover:scale-110`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{a.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Últimos simulados (só se houver) ─────────────────────────────── */}
      {results.length > 0 && (
        <section className="mt-6 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recentes</p>
            <Link to="/percurso" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {results.slice(0, 3).map((r) => {
              const p = r.total ? Math.round((r.acertos / r.total) * 100) : 0;
              const green = p >= 60;
              const date = new Date(r.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
              return (
                <Link key={r.id} to={`/resultado/${r.id}`}>
                  <Card className="flex items-center gap-3 border-border/60 p-3 shadow-card transition-all hover:shadow-elegant active:scale-[0.99]">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold"
                      style={{
                        background: green ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.10)",
                        color: green ? "#15803d" : "#dc2626",
                      }}
                    >
                      {p}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.categoriaNome}</p>
                      <p className="text-xs text-muted-foreground">{date} · {r.acertos}/{r.total} acertos</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default Index;
