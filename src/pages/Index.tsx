import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { quizService, resultsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { disciplinaById } from "@/data/disciplinas";
import {
  ArrowRight, BookOpen, Sparkles, Target, Trophy, Zap, GraduationCap, Gift, ChevronRight,
} from "lucide-react";

const Index = () => {
  const { profile } = useAuth();
  const concursos = quizService.getConcursos();
  const results = resultsService.getResults();
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const taxa = totalQ ? Math.round((acertos / totalQ) * 100) : 0;
  const nome = profile?.nome?.split(" ")[0] || "Candidato";
  const pontos = profile?.pontos_globais ?? profile?.pontos ?? 0;

  const interesses = (profile?.interesses ?? [])
    .map((id) => disciplinaById(id))
    .filter(Boolean) as { id: string; nome: string; emoji: string }[];

  const acoes = [
    { to: "/concursos", label: "Simulado", desc: "Questões comentadas", icon: Target, grad: "from-sky-500 to-indigo-600" },
    { to: "/aprender", label: "Aprender", desc: "Trilha por níveis", icon: Zap, grad: "from-amber-500 to-orange-600" },
    { to: "/ranking", label: "Ranking", desc: "Compete e sobe", icon: Trophy, grad: "from-emerald-500 to-teal-600" },
    { to: "/partilhar", label: "Convidar", desc: "+100 pontos", icon: Gift, grad: "from-fuchsia-500 to-purple-600" },
  ];

  return (
    <AppShell>
      <Seo
        title="Passei · Estuda para Concursos e Exames em Angola"
        description="Prepara-te para concursos e exames em Angola com simulados comentados, trilhas de estudo por níveis e ranking. Escolhe as tuas áreas de interesse."
        path="/"
      />

      {/* Hero colorido */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary via-indigo-600 to-fuchsia-600 p-6 text-white shadow-elegant animate-scale-in">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm/none opacity-85">Olá,</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{nome} 👋</h1>
          <p className="mt-1.5 text-sm opacity-90">Pronto para estudar hoje?</p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { label: "Simulados", value: results.length },
              { label: "Pontos", value: pontos.toLocaleString("pt-PT") },
              { label: "Acertos", value: `${taxa}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur-sm">
                <p className="font-display text-xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] opacity-85">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Interesses / onboarding */}
      {interesses.length === 0 ? (
        <Link to="/interesses" className="mt-4 block">
          <Card className="flex items-center gap-3 border-2 border-primary/30 bg-primary/5 p-4 shadow-card">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold">Escolhe os teus temas</p>
              <p className="text-xs text-muted-foreground">Personaliza o estudo às tuas áreas de interesse.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>
        </Link>
      ) : (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Os teus temas</h3>
            <Link to="/interesses" className="text-xs font-medium text-primary">Editar</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {interesses.slice(0, 12).map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/10 to-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-foreground border border-primary/15">
                <span>{d.emoji}</span> {d.nome}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Ações rápidas — cartões com gradiente */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        {acoes.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className={`relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${a.grad} p-4 text-white shadow-card transition-transform hover:-translate-y-0.5`}>
              <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/15 blur-lg" />
              <a.icon className="h-6 w-6" />
              <p className="mt-3 font-display text-base font-bold leading-none">{a.label}</p>
              <p className="mt-1 text-[11px] opacity-90">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </section>

      {/* Concursos */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Concursos</h3>
          <Link to="/interesses" className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <GraduationCap className="h-3.5 w-3.5" /> Áreas
          </Link>
        </div>
        <div className="space-y-3">
          {concursos.map((c, i) => {
            const grads = ["from-sky-500 to-blue-600", "from-violet-500 to-fuchsia-600", "from-emerald-500 to-teal-600"];
            return (
              <Link key={c.id} to={`/concursos/${c.id}`} className="block">
                <Card className="group flex items-center gap-4 border-border/60 bg-card p-4 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grads[i % grads.length]} text-white font-display font-bold`}>
                    {c.sigla.slice(0, 4)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.nome}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.area} · {c.categorias.length} categorias</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-smooth group-hover:translate-x-1 group-hover:text-primary" />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" /> Bons estudos!
      </div>
    </AppShell>
  );
};

export default Index;
