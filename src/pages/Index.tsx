import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { quizService, resultsService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, BookOpen, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const { profile } = useAuth();
  const concursos = quizService.getConcursos();
  const results = resultsService.getResults();
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const acertos = results.reduce((s, r) => s + r.acertos, 0);
  const taxa = totalQ ? Math.round((acertos / totalQ) * 100) : 0;
  const nome = profile?.nome?.split(" ")[0] || "Candidato";

  return (
    <AppShell>
      <Seo
        title="Passei · Simulados para Concursos da Saúde em Angola"
        description="Prepare-se para concursos públicos da saúde em Angola (MINSA) com simulados comentados, trilhas de estudo e ranking entre candidatos."
        path="/"
      />
      <header className="mb-7 animate-fade-in">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {nome} <span className="text-gradient">👋</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Pronto para mais um simulado hoje?</p>
      </header>

      <Carousel opts={{ loop: true, align: "start" }} className="animate-scale-in">
        <CarouselContent>
          {concursos.map((c) => (
            <CarouselItem key={c.id}>
              <Card className="relative overflow-hidden border-0 bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 opacity-70" />
                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> {c.sigla} {c.ano}
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-tight">{c.nome}</h2>
                  <p className="mt-2 text-sm text-primary-foreground/85 line-clamp-2">{c.descricao}</p>
                  <Button asChild variant="secondary" className="mt-5 rounded-full font-semibold">
                    <Link to={`/concursos/${c.id}`}>
                      Começar agora <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {concursos.length > 1 && (
          <>
            <CarouselPrevious className="left-2 bg-white/30 text-primary-foreground border-0 hover:bg-white/50" />
            <CarouselNext className="right-2 bg-white/30 text-primary-foreground border-0 hover:bg-white/50" />
          </>
        )}
      </Carousel>

      <Card className="mt-4 border-2 border-warning/30 bg-warning/5 p-4 shadow-card flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning to-accent text-white shadow-glow">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm">Desafio rápido</p>
          <p className="text-xs text-muted-foreground">5 questões · ganhe pontos!</p>
        </div>
        <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-warning to-accent text-white">
          <Link to="/aprender">Jogar</Link>
        </Button>
      </Card>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <StatCard icon={Target} label="Simulados" value={results.length} />
        <StatCard icon={BookOpen} label="Pontos" value={profile?.pontos_globais ?? profile?.pontos ?? 0} />
        <StatCard icon={TrendingUp} label="Acertos" value={`${taxa}%`} />
      </section>

      <section className="mt-8">
        <h3 className="mb-3 font-display text-lg font-semibold">Concursos disponíveis</h3>
        <div className="space-y-3">
          {concursos.map((c) => (
            <Link key={c.id} to={`/concursos/${c.id}`} className="block">
              <Card className="group flex items-center gap-4 border-border/60 bg-card p-4 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold">
                  {c.sigla.slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.area} · {c.categorias.length} categorias
                  </p>
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
