import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService } from "@/services";
import { temRecursos } from "@/lib/recursosDisponiveis";
import { Sparkles, ArrowRight, Clock } from "lucide-react";

const RecursosIndex = () => {
  const concursos = quizService.getConcursos();

  // Categorias que já têm recursos clínicos disponíveis.
  const disponiveis = concursos.flatMap((c) =>
    c.categorias
      .filter((cat) => temRecursos(c.id, cat.id))
      .map((cat) => ({ concurso: c, cat })),
  );

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Recursos clínicos
        </div>
        <h1 className="font-display text-2xl font-bold">Recursos</h1>
        <p className="text-sm text-muted-foreground">
          Doses, fármacos por classe, algoritmos, protocolos, terminologias e sinais & sintomas por categoria.
        </p>
      </header>

      {disponiveis.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Recursos a serem adicionados em breve.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {disponiveis.map(({ concurso, cat }) => (
            <Card key={`${concurso.id}/${cat.id}`} className="flex flex-col p-5 shadow-card">
              <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                {concurso.sigla}
              </span>
              <h3 className="font-display text-lg font-bold leading-tight">{cat.nome}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{cat.descricao}</p>
              <Button asChild className="mt-4 w-full rounded-full font-semibold">
                <Link to={`/concursos/${concurso.id}/${cat.id}/recursos`}>
                  Ver recursos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6 flex items-start gap-3 border-dashed bg-muted/30 p-4">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          As restantes categorias ainda não têm recursos clínicos. Estamos a prepará-los e estarão
          disponíveis em breve.
        </p>
      </Card>
    </AppShell>
  );
};

export default RecursosIndex;
