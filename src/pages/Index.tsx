import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { quizService, resultsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Target, Trophy, Zap, Gift, ChevronRight, BookMarked, Banknote } from "lucide-react";

const concursoColors = ["bg-primary", "bg-violet-600", "bg-emerald-600", "bg-amber-500", "bg-rose-600"];

const Index = () => {
  const { profile } = useAuth();
  const concursos = quizService.getConcursos();

  // Se o estudo por interesses está ativo, o simulado vai direto à categoria
  // virtual "interesses"; senão vai à categoria normal do utilizador.
  const interessesAtivo = !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const simuladoTo = interessesAtivo
    ? "/quiz/interesses/interesses"
    : profile?.concurso_id && profile?.categoria_id
      ? `/quiz/${profile.concurso_id}/${profile.categoria_id}`
      : "/concursos";

  const acoes = [
    { to: simuladoTo,    label: "Simulado",      desc: "Questões comentadas",   icon: Target,    cls: "bg-primary" },
    { to: "/aprender",   label: "Aprender",       desc: "Trilha por níveis",     icon: Zap,       cls: "bg-amber-500" },
    { to: "/ranking",    label: "Ranking",        desc: "Compete e sobe",        icon: Trophy,    cls: "bg-emerald-600" },
    { to: "/partilhar",  label: "Convidar",       desc: "+50 pontos",            icon: Gift,      cls: "bg-violet-600" },
    { to: "/interesses", label: "Por Interesses", desc: "Estuda o que escolhes", icon: BookMarked,cls: "bg-sky-600" },
    { to: "/carteira",   label: "Sacar Dinheiro", desc: "Levanta os teus pontos",icon: Banknote,  cls: "bg-rose-600" },
  ];
  const results   = resultsService.getResults();

  const totalQ  = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const taxa    = totalQ ? Math.round((acertos / totalQ) * 100) : 0;
  const nome    = profile?.nome?.split(" ")[0] || "Candidato";
  const pontos  = profile?.pontos_globais ?? profile?.pontos ?? 0;

  return (
    <AppShell>
      <Seo
        title="Passei · Estuda para Concursos e Exames em Angola"
        description="Prepara-te para concursos e exames em Angola com simulados comentados, trilhas de estudo por níveis e ranking."
        path="/"
      />

      {/* Hero — saudação + estatísticas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 px-6 py-6 text-white shadow-elegant">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium opacity-70">Bem-vindo,</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{nome}</h1>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { label: "Simulados",  value: results.length },
              { label: "Pontos",     value: pontos.toLocaleString("pt-PT") },
              { label: "Acertos",    value: `${taxa}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] font-medium opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <section className="mt-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {acoes.map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="group flex items-center gap-3 border-border/60 p-3.5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elegant active:scale-95">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.cls} text-white`}>
                  <a.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none text-foreground">{a.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-tight">{a.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Concursos */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Concursos disponíveis</h2>
          <Link
            to="/concursos"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
          >
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {concursos.map((c, i) => (
            <Link key={c.id} to={`/concursos/${c.id}`} className="block">
              <Card className="group flex items-center gap-4 border-border/60 bg-card p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.99]">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${concursoColors[i % concursoColors.length]} text-white text-[11px] font-bold leading-tight text-center`}
                >
                  {c.sigla.slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.area} · {c.categorias.length} categorias
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
