import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { quizService, authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import {
  BadgeCheck, BookMarked, BookOpen, ChevronRight, Clock,
  FileText, Play, Stethoscope, UserCheck,
} from "lucide-react";
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
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {concurso.sigla} · {concurso.ano}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight">{cat.nome}</h1>
          {cat.descricao && (
            <p className="mt-2 text-sm opacity-80 leading-relaxed">{cat.descricao}</p>
          )}

          {isMinha ? (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4" /> Esta é a tua categoria
            </span>
          ) : (
            <Button
              onClick={definirCategoria}
              size="lg"
              className="mt-5 w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <UserCheck className="mr-2 h-4 w-4" /> Definir como minha categoria
            </Button>
          )}
        </div>
      </div>

      <AccessGate concursoId={concurso.id} categoriaId={cat.id} categoriaNome={cat.nome}>
        {/* ── SIMULADO (CTA principal) ─────────────────────────────────────────── */}
        <Card className="mb-4 overflow-hidden border-0 bg-gradient-primary p-5 text-primary-foreground shadow-elegant">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Simulado</p>
          <h2 className="mt-1 font-display text-xl font-bold">Questões comentadas</h2>
          <p className="mt-1 text-xs opacity-80">Cada simulado traz questões diferentes do banco.</p>
          <div className="mt-3 flex items-center gap-4 text-xs font-medium opacity-90">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{Math.round(tempoMin)} min</span>
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {cat.disciplinas.length} tópicos</span>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-4 w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            <Link to={`/quiz/${concursoId}/${categoriaId}`} className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5 fill-primary" /> Iniciar simulado
            </Link>
          </Button>
        </Card>

        {/* ── AÇÕES ────────────────────────────────────────────────────────────── */}
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          {[
            {
              to: `/concursos/${concursoId}/${categoriaId}/topicos`,
              icon: FileText,
              label: "Tópicos & docs",
              desc: `${cat.topicos?.length ?? 0} blocos · programa oficial`,
              accent: "bg-violet-100 text-violet-700",
            },
            {
              to: `/concursos/${concursoId}/${categoriaId}/recursos`,
              icon: Stethoscope,
              label: "Recursos",
              desc: "Material clínico de apoio",
              accent: "bg-emerald-100 text-emerald-700",
            },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="group flex h-full items-center gap-3 border-border/60 p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.accent} transition-transform group-hover:scale-110`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{a.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Card>
            </Link>
          ))}
        </div>

        {/* ── TÓPICOS ──────────────────────────────────────────────────────────── */}
        <section className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100">
              <BookMarked className="h-4 w-4 text-sky-700" />
            </div>
            <h3 className="font-display font-semibold">Tópicos avaliados</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {cat.disciplinas.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
              >
                {d}
              </span>
            ))}
          </div>
        </section>
      </AccessGate>
    </AppShell>
  );
};

export default CategoriaDetail;
