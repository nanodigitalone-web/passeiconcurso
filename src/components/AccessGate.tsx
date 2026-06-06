import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useAccessGate } from "@/hooks/useAccessGate";
import { paymentsService } from "@/services";

type Props = {
  concursoId: string;
  categoriaId: string;
  categoriaNome?: string;
  children: ReactNode;
};

export const AccessGate = ({ concursoId, categoriaId, categoriaNome, children }: Props) => {
  const gate = useAccessGate(concursoId, categoriaId);

  if (gate.loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (gate.hasAccess) {
    return (
      <>
        {gate.isTrial && (
          <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning-foreground">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Período de teste — restam {gate.trialDaysLeft} dia{gate.trialDaysLeft === 1 ? "" : "s"}.{" "}
            <Link to={`/acesso/${concursoId}/${categoriaId}`} className="underline font-semibold">
              Adquirir acesso
            </Link>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <Card className="mx-auto max-w-md border-0 bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="font-display text-xl font-bold">Acesso bloqueado</h2>
      <p className="mt-1 text-sm opacity-90">
        O período de teste de 2 dias terminou. Adquira o acesso completo a{" "}
        <span className="font-semibold">{categoriaNome ?? "esta categoria"}</span> por apenas{" "}
        <span className="line-through opacity-70">3.700 Kz</span>{" "}
        <span className="font-semibold">1.000 Kz</span> (promo) · 4 meses.
      </p>
      <ul className="mt-3 space-y-1 text-sm opacity-90">
        <li>• Simulados ilimitados</li>
        <li>• Aprender (trilha) e tópicos</li>
        <li>• Ranking e progresso</li>
      </ul>
      <Button asChild variant="secondary" className="mt-4 w-full rounded-full font-semibold">
        <Link to={`/acesso/${concursoId}/${categoriaId}`}>Obter acesso completo</Link>
      </Button>
    </Card>
  );
};
