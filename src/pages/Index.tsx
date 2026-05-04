import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { concursos } from "@/data/concursos";
import { getResults, getUser } from "@/lib/storage";
import { ArrowRight, BookOpen, Sparkles, Target, TrendingUp } from "lucide-react";

const Index = () => {
  const user = getUser();
  const results = getResults();
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const taxa = totalQ ? Math.round((acertos / totalQ) * 100) : 0;

  return (
    <AppShell>
      <header className="mb-8 animate-fade-in">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {user.nome} <span className="text-gradient">👋</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Pronto para mais um simulado hoje?</p>
      </header>

      <Card className="relative overflow-hidden border-0 bg-gradient-hero p-6 text-primary-foreground shadow-elegant animate-scale-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> MINSA 2026
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Concurso Público da Saúde
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/85">
            Questões e simulados comentados para todas as categorias profissionais.
          </p>
          <Button asChild variant="secondary" className="mt-5 rounded-full font-semibold">
            <Link to="/concursos/minsa">
              Começar agora <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <StatCard icon={Target} label="Simulados" value={results.length} />
        <StatCard icon={BookOpen} label="Questões" value={totalQ} />
        <StatCard icon={TrendingUp} label="Acertos" value={`${taxa}%`} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Concursos disponíveis</h3>
        </div>
        <div className="space-y-3">
          {concursos.map((c) => (
            <Link key={c.id} to={`/concursos/${c.id}`} className="block">
              <Card className="group flex items-center gap-4 border-border/60 bg-card p-4 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold">
                  {c.sigla.slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.area} · {c.categorias.length} categorias</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-smooth group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <Card className="flex flex-col items-center gap-1 border-border/60 p-3 text-center shadow-card">
    <Icon className="h-5 w-5 text-primary" />
    <p className="font-display text-xl font-bold">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </Card>
);

export default Index;
