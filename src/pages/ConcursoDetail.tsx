import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { BadgeCheck, ChevronRight, ExternalLink, GraduationCap, Layers } from "lucide-react";

// Acentos rotativos (mesma paleta das ações rápidas da Home).
const ACCENTS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const ConcursoDetail = () => {
  const { concursoId } = useParams();
  const { profile } = useAuth();
  const concurso = quizService.getConcurso(concursoId!);
  if (!concurso) return <Navigate to="/concursos" replace />;

  return (
    <AppShell>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {concurso.area} · {concurso.ano}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight">{concurso.nome}</h1>
          {concurso.descricao && (
            <p className="mt-2 text-sm opacity-80 leading-relaxed">{concurso.descricao}</p>
          )}
          {concurso.inscricaoUrl && (
            <Button
              asChild
              size="lg"
              className="mt-5 w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <a href={concurso.inscricaoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" /> Inscrever-se no concurso
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ── CATEGORIAS ───────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold">Categorias profissionais</h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" /> {concurso.categorias.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {concurso.categorias.map((cat, i) => {
            const Icon = (Icons as any)[cat.icon] || Icons.GraduationCap;
            const isMinha = profile?.categoria_id === cat.id && profile?.concurso_id === concurso.id;
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <Link key={cat.id} to={`/concursos/${concurso.id}/${cat.id}`}>
                <Card className={cn(
                  "group relative h-full border-border/60 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]",
                  isMinha && "border-primary/30 bg-primary/5",
                )}>
                  {isMinha && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <BadgeCheck className="h-3 w-3" /> A tua
                    </span>
                  )}
                  <span className={cn(
                    "mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                    accent,
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold leading-tight">{cat.nome}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-tight">{cat.disciplinas.length} tópicos</p>
                  <div className="mt-3 inline-flex items-center text-xs font-semibold text-primary">
                    Explorar <ChevronRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
};

export default ConcursoDetail;
