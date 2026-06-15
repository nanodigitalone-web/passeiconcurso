import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { quizService, recursosService, type RecursoSeccao, type RecursoTipo } from "@/services";
import { AccessGate } from "@/components/AccessGate";
import {
  Sparkles, Pill, FlaskConical, GitBranch, ClipboardList, BookA, Activity, Loader2, AlertTriangle,
} from "lucide-react";

const TIPO_META: Record<RecursoTipo, { label: string; icon: typeof Pill }> = {
  doses: { label: "Doses", icon: Pill },
  classes: { label: "Classes", icon: FlaskConical },
  algoritmos: { label: "Algoritmos", icon: GitBranch },
  protocolos: { label: "Protocolos", icon: ClipboardList },
  terminologias: { label: "Terminologias", icon: BookA },
  sinais: { label: "Sinais & sintomas", icon: Activity },
};

const RecursosInner = ({ concursoId, categoriaId }: { concursoId: string; categoriaId: string }) => {
  const [seccoes, setSeccoes] = useState<RecursoSeccao[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let active = true;
    recursosService
      .getRecursos(concursoId, categoriaId)
      .then((s) => active && setSeccoes(s))
      .catch(() => active && setErro(true));
    return () => {
      active = false;
    };
  }, [concursoId, categoriaId]);

  if (erro) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Não foi possível carregar os recursos. Tente novamente.
      </Card>
    );
  }
  if (!seccoes) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (seccoes.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Recursos a serem adicionados em breve para esta categoria.
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Conteúdo de estudo. Confirme doses e protocolos nas normas oficiais antes do uso clínico.</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {seccoes.map((s) => {
          const meta = TIPO_META[s.tipo];
          const Icon = meta.icon;
          return (
            <Card key={s.id} className="p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{meta.label}</p>
                  <h3 className="font-display text-sm font-bold leading-tight">{s.titulo}</h3>
                </div>
              </div>
              <ul className="space-y-2.5">
                {s.itens.map((it, i) => (
                  <li key={i} className="rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-sm font-semibold">{it.nome}</p>
                    <p className="text-xs text-muted-foreground">{it.valor}</p>
                    {it.nota && <p className="mt-0.5 text-[11px] italic text-primary/80">{it.nota}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
};

const Recursos = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const concurso = quizService.getConcurso(concursoId!);
  if (!cat || !concurso) return <Navigate to="/concursos" replace />;

  return (
    <AppShell>
      <header className="mb-5 animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Recursos clínicos
        </div>
        <h1 className="font-display text-2xl font-bold">{cat.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Doses, fármacos por classe, algoritmos, protocolos, terminologias e sinais & sintomas.
        </p>
      </header>

      <AccessGate concursoId={concurso.id} categoriaId={cat.id} categoriaNome={cat.nome}>
        <RecursosInner concursoId={concurso.id} categoriaId={cat.id} />
      </AccessGate>
    </AppShell>
  );
};

export default Recursos;
