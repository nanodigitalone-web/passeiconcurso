import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Zap, Crown, ArrowRight, Loader2 } from "lucide-react";
import { subscriptionService, type Plan, type UserSubscription } from "@/services/subscriptionService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PLAN_META: Record<string, { icon: React.ReactNode; color: string; highlight?: boolean; features: string[] }> = {
  free: {
    icon: <Star className="h-5 w-5" />,
    color: "text-muted-foreground",
    features: ["1 disciplina à escolha", "Acesso ao modo Aprender", "Modo Simulado básico", "30 dias de acesso"],
  },
  basico: {
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    color: "text-blue-600",
    features: ["3 disciplinas à escolha", "Acesso ao modo Aprender", "Modo Simulado ilimitado", "30 dias de acesso"],
  },
  pro: {
    icon: <Star className="h-5 w-5 text-purple-500" />,
    color: "text-purple-600",
    highlight: true,
    features: ["5 disciplinas à escolha", "Todos os modos de estudo", "Ranking e batalhas", "30 dias de acesso"],
  },
  pro_max: {
    icon: <Crown className="h-5 w-5 text-amber-500" />,
    color: "text-amber-600",
    features: ["10 disciplinas à escolha", "Todos os modos de estudo", "Ranking e batalhas", "30 dias de acesso"],
  },
  familia: {
    icon: <Users className="h-5 w-5 text-emerald-500" />,
    color: "text-emerald-600",
    features: ["Até 5 utilizadores", "20 disciplinas por utilizador", "Cada membro escolhe as suas", "30 dias de acesso"],
  },
};

const Planos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getMySubscription(),
    ]).then(([p, s]) => {
      setPlans(p);
      setActiveSub(s.subscription || (s.membership ? { ...s.membership, plan_id: s.membership.plan_id, status: s.membership.sub_status as any } : null));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (plan: Plan) => {
    if (!user) return navigate("/login");
    if (activeSub) {
      if (activeSub.status === "active") return navigate("/meu-plano");
      if (activeSub.status === "pending") {
        toast.info("Tens uma subscrição pendente de aprovação. Aguarda ou contacta o suporte.");
        return;
      }
    }

    if (plan.price_aoa === 0) {
      // Free plan: activate immediately
      setActivating(plan.id);
      try {
        await subscriptionService.subscribe(plan.id);
        toast.success("Plano gratuito activado! Escolhe a tua disciplina.");
        navigate("/escolher-disciplinas");
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("already_subscribed")) toast.info("Já tens uma subscrição activa.");
        else toast.error("Erro ao activar plano gratuito.");
      } finally {
        setActivating(null);
      }
    } else {
      navigate(`/planos/${plan.id}/pagar`);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold">Planos de Estudo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolhe o plano, escolhe as tuas disciplinas e começa a estudar.
        </p>
      </header>

      {activeSub && activeSub.status === "active" && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Plano activo: {activeSub.plan_name || activeSub.plan_id}</p>
              <p className="text-xs text-emerald-600">
                {activeSub.disciplines_locked
                  ? `${(activeSub.disciplines as string[]).length} disciplinas seleccionadas`
                  : "Ainda não escolheste as tuas disciplinas"}
              </p>
            </div>
            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => navigate(activeSub.disciplines_locked ? "/meu-plano" : "/escolher-disciplinas")}>
              {activeSub.disciplines_locked ? "Ver plano" : "Escolher disciplinas"}
            </Button>
          </div>
        </Card>
      )}

      {activeSub && activeSub.status === "pending" && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Subscrição pendente de aprovação</p>
          <p className="text-xs text-amber-600">O teu comprovativo está a ser analisado. Receberás uma notificação em até 24h.</p>
        </Card>
      )}

      {/* Main plans grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.filter(p => p.id !== "familia").map((plan) => {
          const meta = PLAN_META[plan.id] || PLAN_META.free;
          const isActive = activeSub?.plan_id === plan.id && activeSub?.status === "active";

          return (
            <Card key={plan.id}
              className={`relative overflow-hidden p-5 transition-all ${meta.highlight ? "border-purple-300 shadow-md ring-2 ring-purple-200" : "border-border/60"}`}>
              {meta.highlight && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  POPULAR
                </div>
              )}
              <div className={`mb-2 flex items-center gap-2 font-display font-bold text-lg ${meta.color}`}>
                {meta.icon} {plan.name}
              </div>
              <div className="mb-3">
                {plan.price_aoa === 0 ? (
                  <span className="text-2xl font-bold">Grátis</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold">{plan.price_aoa.toLocaleString("pt-PT")}</span>
                    <span className="text-sm text-muted-foreground"> Kz/mês</span>
                  </>
                )}
              </div>
              <ul className="mb-4 space-y-1.5">
                {meta.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              {isActive ? (
                <Badge className="w-full justify-center rounded-full bg-emerald-100 py-1.5 text-emerald-700">
                  Activo
                </Badge>
              ) : (
                <Button
                  onClick={() => handleSelect(plan)}
                  disabled={activating === plan.id}
                  className={`w-full rounded-full font-semibold ${meta.highlight ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  variant={meta.highlight ? "default" : "outline"}
                >
                  {activating === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {plan.price_aoa === 0 ? "Activar grátis" : "Subscrever"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Família plan — full width */}
      {plans.filter(p => p.id === "familia").map((plan) => {
        const meta = PLAN_META.familia;
        const isActive = activeSub?.plan_id === plan.id && activeSub?.status === "active";
        return (
          <Card key={plan.id} className="mt-3 overflow-hidden border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 font-display font-bold text-lg text-emerald-700">
                  {meta.icon} {plan.name}
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-emerald-800">{plan.price_aoa.toLocaleString("pt-PT")}</span>
                  <span className="text-sm text-muted-foreground"> Kz/mês</span>
                </div>
                <ul className="space-y-1">
                  {meta.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-emerald-700">
                      <Check className="h-3.5 w-3.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                {isActive ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">Activo</Badge>
                ) : (
                  <Button
                    onClick={() => handleSelect(plan)}
                    className="rounded-full bg-emerald-600 font-semibold hover:bg-emerald-700"
                  >
                    Subscrever <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Após o pagamento, o acesso é activado em até 24 horas.<br />
        Depois escolhes as disciplinas — a escolha é permanente.
      </p>
    </AppShell>
  );
};

export default Planos;
