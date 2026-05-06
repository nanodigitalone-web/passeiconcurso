import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getConcurso } from "@/data/concursos";
import * as Icons from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const ConcursoDetail = () => {
  const { concursoId } = useParams();
  const concurso = getConcurso(concursoId!);
  if (!concurso) return <Navigate to="/concursos" replace />;

  return (
    <AppShell>
      <Card className="mb-6 overflow-hidden border-0 bg-gradient-hero p-5 text-primary-foreground shadow-elegant">
        <p className="text-xs uppercase tracking-wider opacity-80">{concurso.area} · {concurso.ano}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{concurso.nome}</h1>
        <p className="mt-2 text-sm opacity-90">{concurso.descricao}</p>
      </Card>

      <h2 className="mb-3 font-display text-lg font-semibold">Categorias profissionais</h2>
      <div className="grid grid-cols-2 gap-3">
        {concurso.categorias.map((cat) => {
          const Icon = (Icons as any)[cat.icon] || Icons.GraduationCap;
          return (
            <Link key={cat.id} to={`/concursos/${concurso.id}/${cat.id}`}>
              <Card className="group h-full border-border/60 p-4 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold leading-tight">{cat.nome}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{cat.disciplinas.length} disciplinas</p>
                <div className="mt-3 inline-flex items-center text-xs font-medium text-primary">
                  Explorar <ArrowRight className="ml-1 h-3.5 w-3.5 transition-smooth group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
};

export default ConcursoDetail;
