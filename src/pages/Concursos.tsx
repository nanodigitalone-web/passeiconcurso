import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { concursos } from "@/data/concursos";
import { ArrowRight } from "lucide-react";

const Concursos = () => {
  return (
    <AppShell>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Concursos</h1>
        <p className="text-sm text-muted-foreground">Escolha um concurso para começar</p>
      </header>
      <div className="space-y-3">
        {concursos.map((c) => (
          <Link key={c.id} to={`/concursos/${c.id}`} className="block">
            <Card className="flex items-center gap-4 border-border/60 p-4 shadow-card transition-smooth hover:shadow-elegant">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold">
                {c.sigla.slice(0, 4)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{c.nome}</p>
                <p className="text-xs text-muted-foreground">{c.descricao}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-6 border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Mais concursos em breve · Educação, Justiça, Administração Pública.
      </Card>
    </AppShell>
  );
};

export default Concursos;
