import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService, cursosService } from "@/services";
import type { CursoPreparatorio } from "@/services";
import { temRecursos } from "@/lib/recursosDisponiveis";
import { Sparkles, ArrowRight, Clock, GraduationCap, Phone, ExternalLink } from "lucide-react";

const RecursosIndex = () => {
  const concursos = quizService.getConcursos();
  const [cursos, setCursos] = useState<CursoPreparatorio[]>([]);

  useEffect(() => {
    cursosService.listAll().then(setCursos).catch(() => setCursos([]));
  }, []);

  const concNome = (id: string) => concursos.find((c) => c.id === id)?.nome ?? id;

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

      {/* Cursos Preparatórios */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Cursos preparatórios</h2>
        </div>
        {cursos.length === 0 ? (
          <Card className="flex items-start gap-3 border-dashed bg-muted/30 p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Ainda não há cursos preparatórios disponíveis. Estamos a adicioná-los em breve.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cursos.map((curso) => (
              <Card key={curso.id} className="flex flex-col p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                    {curso.logo_url ? (
                      <img src={curso.logo_url} alt={curso.nome} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <GraduationCap className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {concNome(curso.concurso_id)}
                    </span>
                    <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{curso.nome}</h3>
                  </div>
                </div>

                {curso.descricao && (
                  <p className="mt-3 flex-1 text-xs text-muted-foreground">{curso.descricao}</p>
                )}

                {curso.contacto && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 text-primary" /> {curso.contacto}
                  </p>
                )}

                {curso.link_externo && (
                  <Button asChild className="mt-4 w-full rounded-full font-semibold">
                    <a href={curso.link_externo} target="_blank" rel="noopener noreferrer">
                      Visitar preparatório <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default RecursosIndex;
