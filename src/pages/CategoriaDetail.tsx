import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quizService, authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, BookMarked, Clock, Play, Check, UserCheck } from "lucide-react";
import { AccessGate } from "@/components/AccessGate";
import { toast } from "sonner";

const CategoriaDetail = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const concurso = quizService.getConcurso(concursoId!);
  const { user, profile, refreshProfile } = useAuth();
  if (!cat || !concurso) return <Navigate to="/concursos" replace />;

  const isMinha = profile?.categoria_id === cat.id && profile?.concurso_id === concurso.id;
  const totalQuiz = Math.min(20, cat.questoes.length);
  const tempoMin = Math.max(5, totalQuiz * 1.5);

  const definirCategoria = async () => {
    if (!user) return;
    const { error } = await authService.setCategoria(user.id, concurso.id, cat.id, cat.nome);
    if (error) return toast.error("Erro ao definir categoria");
    await refreshProfile();
    toast.success(`Categoria ${cat.nome} definida!`);
  };

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">{cat.nome}</h1>
        <p className="text-sm text-muted-foreground">{cat.descricao}</p>
      </header>

      <Button
        onClick={definirCategoria}
        disabled={isMinha}
        variant={isMinha ? "secondary" : "default"}
        className="mb-4 w-full rounded-full font-semibold"
      >
        {isMinha ? <><Check className="mr-2 h-4 w-4" /> Esta é a sua categoria</> : <><UserCheck className="mr-2 h-4 w-4" /> Definir como minha categoria</>}
      </Button>

      <AccessGate concursoId={concurso.id} categoriaId={cat.id} categoriaNome={cat.nome}>
        <Card className="mb-4 border-0 bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
          <p className="text-xs uppercase tracking-wider opacity-80">Simulado</p>
          <h2 className="mt-1 font-display text-xl font-bold">{totalQuiz} questões comentadas</h2>
          <p className="mt-1 text-xs opacity-90">Cada simulado traz questões diferentes do banco.</p>
          <div className="mt-3 flex items-center gap-4 text-sm opacity-90">
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> ~{Math.round(tempoMin)} min</span>
            <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" /> {cat.disciplinas.length} tópicos</span>
          </div>
          <Button asChild variant="secondary" className="mt-4 w-full rounded-full font-semibold">
            <Link to={`/quiz/${concursoId}/${categoriaId}`}>
              <Play className="mr-2 h-4 w-4" /> Iniciar simulado
            </Link>
          </Button>
        </Card>

        <Card className="mb-5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
                <BookMarked className="h-4 w-4" /> Tópicos & documentos
              </div>
              <p className="mt-1 text-sm font-semibold">Programa oficial e inscrição</p>
              <p className="text-xs text-muted-foreground">{cat.topicos?.length ?? 0} blocos · documentos</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to={`/concursos/${concursoId}/${categoriaId}/topicos`}>Ver</Link>
            </Button>
          </div>
        </Card>

        <h3 className="mb-3 font-display font-semibold">Tópicos</h3>
        <div className="flex flex-wrap gap-2">
          {cat.disciplinas.map((d) => (
            <Badge key={d} variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-medium">
              {d}
            </Badge>
          ))}
        </div>
      </AccessGate>
    </AppShell>
  );
};

export default CategoriaDetail;
