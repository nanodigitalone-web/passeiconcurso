import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { quizService } from "@/services";
import { ArrowRight, Search } from "lucide-react";

const Concursos = () => {
  const [q, setQ] = useState("");
  const concursos = quizService.getConcursos();
  const lista = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return concursos;
    return concursos.filter(
      (c) =>
        c.nome.toLowerCase().includes(s) ||
        c.sigla.toLowerCase().includes(s) ||
        c.area.toLowerCase().includes(s) ||
        c.categorias.some((cat) => cat.nome.toLowerCase().includes(s))
    );
  }, [q]);

  return (
    <AppShell>
      <Seo
        title="Concursos Públicos de Saúde Abertos em Angola"
        description="Explore os concursos públicos da saúde disponíveis em Angola e escolha um para iniciar seus simulados comentados."
        path="/concursos"
      />
      <header className="mb-4 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Concursos Públicos Abertos</h1>
        <p className="text-sm text-muted-foreground">Escolha um concurso para começar</p>
      </header>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por concurso, sigla, área ou categoria..."
          className="pl-9 rounded-full"
        />
      </div>

      <div className="space-y-3">
        {lista.map((c) => (
          <Link key={c.id} to={`/concursos/${c.id}`} className="block">
            <Card className="flex items-center gap-4 border-border/60 p-4 shadow-card transition-smooth hover:shadow-elegant">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display font-bold">
                {c.sigla.slice(0, 4)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {c.area} · {c.categorias.length} categorias
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
        {lista.length === 0 && (
          <Card className="border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Nenhum concurso encontrado para "{q}".
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default Concursos;
