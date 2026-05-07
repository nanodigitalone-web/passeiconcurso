import { useParams, Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoria } from "@/data/concursos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, Play } from "lucide-react";

const Topicos = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = getCategoria(concursoId!, categoriaId!);
  if (!cat) return <Navigate to="/concursos" replace />;
  const topicos = cat.topicos ?? [];

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BookMarked className="h-3.5 w-3.5" /> Tópicos de estudo
        </div>
        <h1 className="font-display text-2xl font-bold">{cat.nome}</h1>
        <p className="text-sm text-muted-foreground">Programa oficial do concurso MINSA 2026.</p>
      </header>

      {topicos.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Tópicos a serem actualizados em breve.
        </Card>
      ) : (
        <Card className="p-2">
          <Accordion type="single" collapsible className="w-full">
            {topicos.map((t, i) => (
              <AccordionItem key={i} value={`t-${i}`} className="border-border/60">
                <AccordionTrigger className="px-3 text-left text-sm font-semibold">
                  {t.titulo}
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <ul className="ml-4 list-disc space-y-1.5 text-sm text-muted-foreground">
                    {t.itens.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}

      <Button asChild className="mt-5 w-full rounded-full font-semibold">
        <Link to={`/quiz/${concursoId}/${categoriaId}`}>
          <Play className="mr-2 h-4 w-4" /> Praticar com simulado
        </Link>
      </Button>
    </AppShell>
  );
};

export default Topicos;
