import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check as CheckIcon, Lock, Sparkles } from "lucide-react";
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
  const pricing = paymentsService.getPricing(concursoId);


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
          <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning-strong">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Período de teste — restam {gate.trialHoursLeft} hora{gate.trialHoursLeft === 1 ? "" : "s"}.{" "}
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
    <Card className="relative mx-auto max-w-md overflow-hidden border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant">
      <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

      <div className="relative">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-bold">Acesso bloqueado</h2>
        <p className="mt-2 text-sm leading-relaxed opacity-90">
          O período de teste terminou. Desbloqueia{" "}
          <span className="font-semibold">{categoriaNome ?? "esta categoria"}</span> durante 4 meses.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pricing.isPromo && pricing.normalLabel && (
            <span className="text-sm line-through opacity-60">{pricing.normalLabel}</span>
          )}
          <span className="rounded-full bg-white/15 px-3 py-1 font-display text-lg font-bold backdrop-blur-sm">
            {pricing.valorLabel}
          </span>
          {pricing.isPromo && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase text-amber-950">Promo</span>
          )}
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {["Simulados ilimitados", "Trilha Aprender e tópicos", "Ranking, ligas e progresso"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <CheckIcon className="h-3 w-3" />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <Button asChild size="lg" className="mt-5 w-full rounded-2xl bg-white font-bold text-primary shadow-lg transition-all hover:bg-white/90 active:scale-[0.98]">
          <Link to={`/acesso/${concursoId}/${categoriaId}`}>Obter acesso completo</Link>
        </Button>
      </div>
    </Card>
  );
};
