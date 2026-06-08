import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService, resultsService, type QuizResult } from "@/services";
import { Award, Check, Clock, Home, RotateCcw, X } from "lucide-react";

const Resultado = () => {
  const { id } = useParams();
  const loc = useLocation();
  const stored = (loc.state as QuizResult) || resultsService.getResultById(id!);
  if (!stored) return (
    <AppShell>
      <p className="py-12 text-center text-muted-foreground">Resultado não encontrado.</p>
    </AppShell>
  );

  const cat = quizService.getCategoria(stored.concursoId, stored.categoriaId);
  const taxa = Math.round((stored.acertos / stored.total) * 100);
  const erros = stored.respostas.filter((r) => r.escolhida !== r.correta);
  const mm = String(Math.floor(stored.tempoSegundos / 60)).padStart(2, "0");
  const ss = String(stored.tempoSegundos % 60).padStart(2, "0");

  const msg = taxa >= 80 ? "Excelente!" : taxa >= 60 ? "Bom trabalho!" : taxa >= 40 ? "Continue praticando" : "Revise o conteúdo";

  return (
    <AppShell>
      <Card className="mb-6 overflow-hidden border-0 bg-gradient-hero p-6 text-center text-primary-foreground shadow-elegant animate-scale-in">
        <Award className="mx-auto h-12 w-12 animate-float" />
        <p className="mt-3 text-sm opacity-90">{msg}</p>
        <p className="font-display text-5xl font-bold leading-none">{taxa}%</p>
        <p className="mt-2 text-sm opacity-90">{stored.acertos} de {stored.total} corretas · {mm}:{ss}</p>
        <p className="mt-1 text-xs opacity-75">{stored.categoriaNome}</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-success">
            <Check className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Acertos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{stored.acertos}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-card">
          <div className="flex items-center gap-2 text-destructive">
            <X className="h-4 w-4" /> <span className="text-xs font-semibold uppercase">Erros</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{stored.total - stored.acertos}</p>
        </Card>
      </div>

      {erros.length > 0 && cat && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Relatório de erros comentados</h2>
          <div className="space-y-3">
            {erros.map((r) => {
              const q = cat.questoes.find((qq) => qq.id === r.questaoId)!;
              return (
                <Card key={r.questaoId} className="border-l-4 border-destructive p-4 shadow-card">
                  <p className="mb-3 font-medium leading-snug">{q.enunciado}</p>
                  <div className="space-y-1.5 text-sm">
                    {r.escolhida >= 0 && (
                      <p className="text-destructive">
                        <span className="font-semibold">Sua resposta:</span> {q.opcoes[r.escolhida]}
                      </p>
                    )}
                    <p className="text-success">
                      <span className="font-semibold">Correta:</span> {q.opcoes[q.correta]}
                    </p>
                  </div>
                  <div className="mt-3 rounded-lg bg-primary/5 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Explicação</p>
                    <p className="mt-1 text-sm leading-relaxed">{q.comentario}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> Início</Link>
        </Button>
        <Button asChild className="rounded-full bg-gradient-primary">
          <Link to={`/quiz/${stored.concursoId}/${stored.categoriaId}`}>
            <RotateCcw className="mr-2 h-4 w-4" /> Refazer
          </Link>
        </Button>
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1 w-full">
        <Clock className="h-3 w-3" /> Concluído agora
      </div>
    </AppShell>
  );
};

export default Resultado;
