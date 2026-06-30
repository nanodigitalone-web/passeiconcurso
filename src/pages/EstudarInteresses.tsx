import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AREAS, slugify } from "@/data/disciplinas";
import { BookMarked, Zap, Target, ArrowRight, Lock } from "lucide-react";

const EstudarInteresses = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const interesses: string[] = profile?.interesses ?? [];
  const hasInteresses = interesses.length > 0;

  // Collect discipline names for display
  const disciplinasNomes = AREAS.flatMap((a) =>
    a.disciplinas
      .filter((nome) => interesses.includes(slugify(nome)))
      .map((nome) => nome)
  );

  return (
    <AppShell>
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600">
          <BookMarked className="h-3.5 w-3.5" /> Estudo personalizado
        </div>
        <h1 className="font-display text-2xl font-bold">Por Interesses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulado e Aprender filtrados pelas tuas áreas de interesse.
        </p>
      </header>

      {!hasInteresses ? (
        <Card className="border-dashed border-border p-8 text-center shadow-card">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold">Nenhum interesse selecionado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura as tuas áreas de interesse no perfil para ativar este modo.
          </p>
          <Button
            className="mt-4 rounded-full"
            onClick={() => navigate("/interesses")}
          >
            Configurar interesses
          </Button>
        </Card>
      ) : (
        <>
          {/* Interests summary */}
          <Card className="mb-5 border-border/60 p-4 shadow-card">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              As tuas disciplinas ({disciplinasNomes.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {disciplinasNomes.map((nome) => (
                <span
                  key={nome}
                  className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700"
                >
                  {nome}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate("/interesses")}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              Editar interesses
            </button>
          </Card>

          {/* Mode cards */}
          <div className="space-y-3">
            <button
              className="w-full text-left"
              onClick={() => navigate("/quiz/interesses/interesses")}
            >
              <Card className="group flex items-center gap-4 border-border/60 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.99]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Target className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Simulado</p>
                  <p className="text-xs text-muted-foreground">
                    Questões comentadas filtradas pelos teus temas
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            </button>

            <button
              className="w-full text-left"
              onClick={() => navigate("/aprender/sessao/interesses/interesses")}
            >
              <Card className="group flex items-center gap-4 border-border/60 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.99]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <Zap className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Aprender</p>
                  <p className="text-xs text-muted-foreground">
                    Trilha infinita por níveis com os teus temas
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Card>
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Funcionalidade exclusiva para contas com acesso pago. O acesso livre de trial não inclui este modo.
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default EstudarInteresses;
