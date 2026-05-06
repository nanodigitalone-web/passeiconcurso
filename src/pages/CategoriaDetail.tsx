import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategoria } from "@/data/concursos";
import { ArrowLeft, BookOpen, Clock, Play } from "lucide-react";

const CategoriaDetail = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = getCategoria(concursoId!, categoriaId!);
  if (!cat) return <Navigate to="/concursos" replace />;

  const totalQuiz = Math.min(20, cat.questoes.length);
  const tempoMin = Math.max(5, totalQuiz * 1.5);

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">{cat.nome}</h1>
        <p className="text-sm text-muted-foreground">{cat.descricao}</p>
      </header>

      <Card className="mb-5 border-0 bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
        <p className="text-xs uppercase tracking-wider opacity-80">Simulado aleatório</p>
        <h2 className="mt-1 font-display text-xl font-bold">{totalQuiz} questões comentadas</h2>
        <p className="mt-1 text-xs opacity-90">Cada simulado traz questões diferentes do banco.</p>
        <div className="mt-3 flex items-center gap-4 text-sm opacity-90">
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> ~{Math.round(tempoMin)} min</span>
          <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" /> {cat.disciplinas.length} disciplinas</span>
        </div>
        <Button asChild variant="secondary" className="mt-4 w-full rounded-full font-semibold">
          <Link to={`/quiz/${concursoId}/${categoriaId}`}>
            <Play className="mr-2 h-4 w-4" /> Iniciar simulado
          </Link>
        </Button>
      </Card>

      <h3 className="mb-3 font-display font-semibold">Disciplinas</h3>
      <div className="flex flex-wrap gap-2">
        {cat.disciplinas.map((d) => (
          <Badge key={d} variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-medium">
            {d}
          </Badge>
        ))}
      </div>
    </AppShell>
  );
};

export default CategoriaDetail;
