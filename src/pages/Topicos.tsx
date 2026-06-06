import { useParams, Navigate, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService } from "@/services";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, Play, FileText, ExternalLink, FileCheck2 } from "lucide-react";
import { AccessGate } from "@/components/AccessGate";

const Topicos = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const concurso = quizService.getConcurso(concursoId!);
  if (!cat || !concurso) return <Navigate to="/concursos" replace />;
  const topicos = cat.topicos ?? [];
  const docs = concurso.documentosInscricao ?? [];

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BookMarked className="h-3.5 w-3.5" /> Tópicos & documentos
        </div>
        <h1 className="font-display text-2xl font-bold">{cat.nome}</h1>
        <p className="text-sm text-muted-foreground">Programa oficial do concurso {concurso.sigla} {concurso.ano}.</p>
      </header>

      <AccessGate concursoId={concurso.id} categoriaId={cat.id} categoriaNome={cat.nome}>
        {docs.length > 0 && (
          <Card className="mb-5 p-4 border-border/60 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 className="h-4 w-4 text-primary" /> Documentos para inscrição
            </div>
            <ul className="space-y-2">
              {docs.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            {concurso.inscricaoUrl && (
              <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full">
                <a href={concurso.inscricaoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Site oficial de inscrição
                </a>
              </Button>
            )}
          </Card>
        )}

        <h2 className="mb-2 font-display font-semibold">Tópicos de estudo</h2>
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
      </AccessGate>
    </AppShell>
  );
};

export default Topicos;
