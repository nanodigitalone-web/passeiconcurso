import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check, Star, Users, Zap, Crown, ArrowRight, Loader2, BookOpen,
  Calendar, Lock, Search, Plus, X, AlertTriangle,
  Stethoscope, Heart, Activity, Pill, Microscope, TrendingUp, Scale, Calculator, Settings,
} from "lucide-react";
import { subscriptionService, type Plan, type UserSubscription, type UserMembership, type FamilyMember } from "@/services/subscriptionService";
import { AREAS, slugify } from "@/data/disciplinas";

const AREA_ICON: Record<string, React.ReactNode> = {
  "Medicina":          <Stethoscope className="h-4 w-4" />,
  "Enfermagem":        <Heart className="h-4 w-4" />,
  "Fisioterapia":      <Activity className="h-4 w-4" />,
  "Farmácia":          <Pill className="h-4 w-4" />,
  "Análises Clínicas": <Microscope className="h-4 w-4" />,
  "Economia":          <TrendingUp className="h-4 w-4" />,
  "Direito":           <Scale className="h-4 w-4" />,
  "Contabilidade":     <Calculator className="h-4 w-4" />,
  "Gestão":            <BookOpen className="h-4 w-4" />,
  "Engenharias":       <Settings className="h-4 w-4" />,
};
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.ReactNode; color: string; highlight?: boolean; bg?: string; features: string[] }> = {
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
    bg: "border-amber-200 bg-amber-50/40",
    features: ["10 disciplinas à escolha", "Todos os modos de estudo", "Ranking e batalhas", "30 dias de acesso"],
  },
  familia: {
    icon: <Users className="h-5 w-5 text-emerald-500" />,
    color: "text-emerald-600",
    features: ["Até 5 utilizadores", "20 disciplinas por utilizador", "Cada membro escolhe as suas", "30 dias de acesso"],
  },
};

// Slug → display name lookup
const slugToName = (() => {
  const map: Record<string, string> = {};
  for (const area of AREAS) {
    for (const d of area.disciplinas) map[slugify(d)] = d;
  }
  return (s: string) => map[s] ?? s;
})();

type Tab = "disponivel" | "meu";

const Planos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("disponivel");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activating, setActivating] = useState<string | null>(null);

  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Discipline selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fixedDiscs, setFixedDiscs] = useState<Set<string>>(new Set()); // already saved, can't be removed
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Family member search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; nome: string; email: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getMySubscription(),
    ]).then(([p, { subscription, membership: m, members: mems }]) => {
      setPlans(p);
      setSub(subscription);
      setMembership(m);
      setMembers(mems);
      const existing = (subscription?.disciplines ?? m?.disciplines ?? []) as string[];
      if (existing.length > 0) {
        setSelected(new Set(existing));
        setFixedDiscs(new Set(existing));
      }
      if (subscription?.status === "active" || m?.sub_status === "active") {
        setTab("meu");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Debounced member search
  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await subscriptionService.searchUsers(searchQ);
        const addedIds = new Set(members.map(m => m.member_user_id));
        setSearchResults(res.filter(u => !addedIds.has(u.id)));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [searchQ, members]);

  // Derived plan state
  const activeSub  = sub?.status === "active" ? sub : null;
  const activeMem  = membership?.sub_status === "active" ? membership : null;
  const isPending  = sub?.status === "pending";
  const hasPlan    = !!(activeSub || activeMem);
  const planId     = activeSub?.plan_id ?? activeMem?.plan_id ?? "";
  const planName   = activeSub?.plan_name ?? activeMem?.plan_name ?? planId;
  const discArr    = (activeSub?.disciplines ?? activeMem?.disciplines ?? []) as string[];
  const isLocked   = !!(activeSub?.disciplines_locked ?? activeMem?.disciplines_locked);
  const expiresAt  = activeSub?.expires_at ?? activeMem?.sub_expires_at;
  const isFamilia  = planId === "familia";
  const isOwner    = !!activeSub;
  const maxMembers = activeSub?.max_members ?? 0;
  const maxDisc    = activeSub?.max_disciplines ?? activeMem?.max_disciplines ?? 1;
  const subId      = activeSub?.id ?? membership?.subscription_id ?? "";

  const handleSelect = async (plan: Plan) => {
    if (!user) return navigate("/login");
    if (activeSub) {
      if (activeSub.status === "active") { setTab("meu"); return; }
      if (activeSub.status === "pending") { toast.info("Tens uma subscrição pendente de aprovação."); return; }
    }
    if (plan.price_aoa === 0) {
      setActivating(plan.id);
      try {
        const { subscription } = await subscriptionService.subscribe(plan.id);
        setSub(subscription);
        setTab("meu");
        toast.success("Plano gratuito activado! Escolhe a tua disciplina.");
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("already_subscribed")) toast.info("Já tens uma subscrição activa.");
        else toast.error("Erro ao activar plano.");
      } finally { setActivating(null); }
    } else {
      navigate(`/planos/${plan.id}/pagar`);
    }
  };

  const toggle = (slug: string) => {
    if (isLocked || fixedDiscs.has(slug)) return; // fixed = already saved, can't remove
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); }
      else {
        if (next.size >= maxDisc) { toast.error(`Máximo ${maxDisc} disciplina${maxDisc > 1 ? "s" : ""}.`); return prev; }
        next.add(slug);
      }
      return next;
    });
  };

  const confirmar = async () => {
    const newOnes = Array.from(selected).filter(s => !fixedDiscs.has(s));
    if (selected.size === 0) return toast.error("Selecciona pelo menos 1 disciplina.");
    if (newOnes.length === 0) return toast.info("Não há disciplinas novas para guardar.");
    if (!confirmed) { setConfirmed(true); return; }
    setSaving(true);
    try {
      const result = await subscriptionService.chooseDisciplines(subId, Array.from(selected));
      toast.success("Disciplinas guardadas.");
      setSub(p => p ? { ...p, disciplines: result.disciplines, disciplines_locked: result.disciplines_locked } : p);
      setMembership(p => p ? { ...p, disciplines: result.disciplines, disciplines_locked: result.disciplines_locked } : p);
      setFixedDiscs(new Set(result.disciplines));
      setConfirmed(false);
    } catch (e: any) {
      if ((e?.message ?? "").includes("already_locked")) toast.info("As disciplinas já foram definidas.");
      else { toast.error("Erro ao guardar disciplinas."); setConfirmed(false); }
    } finally { setSaving(false); }
  };

  const addMember = async (userId: string) => {
    if (!activeSub) return;
    setAdding(userId);
    try {
      await subscriptionService.addFamilyMember(activeSub.id, userId);
      const u = searchResults.find(x => x.id === userId)!;
      setMembers(prev => [...prev, {
        id: crypto.randomUUID(), member_user_id: userId,
        nome: u.nome, email: u.email, avatar_url: u.avatar_url,
        disciplines: [], disciplines_locked: false, added_at: new Date().toISOString(),
      }]);
      setSearchResults(prev => prev.filter(x => x.id !== userId));
      setSearchQ("");
      toast.success(`${u.nome} adicionado ao plano.`);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("max_members_reached")) toast.error("Limite de membros atingido.");
      else if (msg.includes("already_member")) toast.info("Este utilizador já é membro.");
      else toast.error("Erro ao adicionar membro.");
    } finally { setAdding(null); }
  };

  return (
    <AppShell>
      <header className="mb-4 text-center">
        <h1 className="font-display text-2xl font-bold">Planos de Estudo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolhe o plano, selecciona as tuas disciplinas e começa a estudar.
        </p>
      </header>

      {/* ── TABS ── */}
      <div className="mb-5 flex gap-1 rounded-xl border bg-muted/40 p-1">
        {([
          { id: "disponivel" as Tab, label: "Disponíveis" },
          { id: "meu" as Tab, label: "Meu Plano" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            {t.id === "meu" && hasPlan && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════ TAB: Disponíveis ═══════════════════════ */}
      {tab === "disponivel" && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {isPending && (
              <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Subscrição pendente de aprovação</p>
                <p className="text-xs text-amber-600">O teu comprovativo está a ser analisado. Receberás uma notificação em até 24h.</p>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {plans.filter(p => p.id !== "familia").map(plan => {
                const meta = PLAN_META[plan.id] || PLAN_META.free;
                const isActive = activeSub?.plan_id === plan.id;
                return (
                  <Card key={plan.id}
                    className={`relative overflow-hidden p-5 transition-all ${meta.highlight ? "border-purple-300 shadow-md ring-2 ring-purple-200" : (meta.bg ?? "border-border/60")}`}>
                    {meta.highlight && (
                      <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-500 px-2 py-0.5 text-[10px] font-bold text-white">POPULAR</div>
                    )}
                    <div className={`mb-2 flex items-center gap-2 font-display font-bold text-lg ${meta.color}`}>
                      {meta.icon} {plan.name}
                    </div>
                    <div className="mb-3">
                      {plan.price_aoa === 0
                        ? <span className="text-2xl font-bold">Grátis</span>
                        : <><span className="text-2xl font-bold">{plan.price_aoa.toLocaleString("pt-PT")}</span><span className="text-sm text-muted-foreground"> Kz/mês</span></>}
                    </div>
                    <ul className="mb-4 space-y-1.5">
                      {meta.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    {isActive ? (
                      <button onClick={() => setTab("meu")}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-100 py-2 text-sm font-semibold text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> Activo — Ver plano
                      </button>
                    ) : (
                      <Button onClick={() => handleSelect(plan)} disabled={activating === plan.id}
                        className={`w-full rounded-full font-semibold ${meta.highlight ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                        variant={meta.highlight ? "default" : "outline"}>
                        {activating === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {plan.price_aoa === 0 ? "Activar grátis" : "Subscrever"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Família — full width */}
            {plans.filter(p => p.id === "familia").map(plan => {
              const meta = PLAN_META.familia;
              const isActive = activeSub?.plan_id === plan.id;
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
                        <button onClick={() => setTab("meu")}
                          className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                          Activo ✓
                        </button>
                      ) : (
                        <Button onClick={() => handleSelect(plan)}
                          className="rounded-full bg-emerald-600 font-semibold hover:bg-emerald-700">
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
          </>
        )
      )}

      {/* ═══════════════════════════════ TAB: Meu Plano ════════════════════════ */}
      {tab === "meu" && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasPlan ? (
          <Card className="p-6 text-center">
            <p className="font-semibold">
              {isPending ? "Subscrição pendente de aprovação" : "Sem plano activo"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPending
                ? "O teu comprovativo está a ser analisado. Receberás uma notificação em até 24h."
                : "Escolhe um plano para começar a estudar pelas tuas disciplinas."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => setTab("disponivel")}>Ver planos disponíveis</Button>
          </Card>
        ) : (
          <div className="space-y-5">

            {/* ── Cartão do plano ── */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    {PLAN_META[planId]?.icon ?? <Star className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg leading-tight">{planName}</p>
                    {activeMem && (
                      <p className="text-xs text-muted-foreground">Plano de {activeMem.owner_nome}</p>
                    )}
                  </div>
                </div>
                <Badge className="rounded-full bg-emerald-100 text-emerald-700 shrink-0">Activo</Badge>
              </div>
              {expiresAt && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
                  <Calendar className="h-3.5 w-3.5" />
                  Válido até {new Date(expiresAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
            </Card>

            {/* ── CTAs de estudo ── */}
            {discArr.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5 p-4">
                <p className="mb-3 text-sm font-semibold text-primary">Estudar com as tuas disciplinas</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button className="w-full rounded-full font-semibold"
                    onClick={() => navigate("/aprender/sessao/plano/meu-plano")}>
                    Modo Aprender
                  </Button>
                  <Button variant="outline" className="w-full rounded-full font-semibold"
                    onClick={() => navigate("/quiz/plano/meu-plano")}>
                    Simulado
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Disciplinas ── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Disciplinas
                  {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </h2>
                {!isLocked && (
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {selected.size} / {maxDisc} escolhidas
                  </span>
                )}
              </div>

              {isLocked ? (
                /* Disciplines locked — show list */
                discArr.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {discArr.map(slug => (
                      <Badge key={slug} variant="secondary" className="rounded-full py-1 px-3 text-sm">
                        {slugToName(slug)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma disciplina registada.</p>
                )
              ) : (
                /* Discipline picker */
                <>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Podes escolher até <strong>{maxDisc}</strong> disciplina{maxDisc > 1 ? "s" : ""}.
                    {fixedDiscs.size > 0 && ` As ${fixedDiscs.size} já escolhidas não podem ser removidas.`}
                    {maxDisc > selected.size && ` Podes adicionar mais ${maxDisc - selected.size}.`}
                  </p>

                  {confirmed && (
                    <Card className="mb-4 border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Confirmar adição</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            As disciplinas adicionadas não poderão ser removidas.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {AREAS.filter(a => a.saude).map(area => {
                      const areaDiscs = area.disciplinas.map(d => ({ nome: d, slug: slugify(d) }));
                      const anySelected = areaDiscs.some(d => selected.has(d.slug));
                      return (
                        <div key={area.area}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">
                              {AREA_ICON[area.area] ?? <BookOpen className="h-4 w-4" />}
                            </span>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{area.area}</h3>
                            {anySelected && (
                              <Badge variant="secondary" className="ml-auto text-[10px]">
                                {areaDiscs.filter(d => selected.has(d.slug)).length} sel.
                              </Badge>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {areaDiscs.map(({ nome, slug }) => {
                              const isSel = selected.has(slug);
                              const isFixed = fixedDiscs.has(slug);
                              const isDisabled = isFixed || (!isSel && selected.size >= maxDisc);
                              return (
                                <button key={slug} onClick={() => toggle(slug)}
                                  disabled={isDisabled}
                                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all
                                    ${isSel ? "border-primary bg-primary/8 font-medium" : "border-border/60 bg-background"}
                                    ${isFixed ? "cursor-default" : isDisabled ? "cursor-not-allowed opacity-40" : "hover:border-primary/40"}`}>
                                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
                                    ${isSel ? "border-primary bg-primary text-white" : "border-muted-foreground/40"}`}>
                                    {isSel && (isFixed ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                                  </div>
                                  <span className="leading-tight">{nome}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {Array.from(selected).some(s => !fixedDiscs.has(s)) && (
                  <div className="sticky bottom-4 mt-6 space-y-2">
                    <Button onClick={confirmar} disabled={saving}
                      className={`w-full rounded-full py-3 text-base font-semibold shadow-lg ${confirmed ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {confirmed
                        ? `Confirmar adição (não reversível)`
                        : `Guardar ${Array.from(selected).filter(s => !fixedDiscs.has(s)).length} nova${Array.from(selected).filter(s => !fixedDiscs.has(s)).length !== 1 ? "s" : ""} disciplina${Array.from(selected).filter(s => !fixedDiscs.has(s)).length !== 1 ? "s" : ""}`}
                    </Button>
                    {confirmed && (
                      <button onClick={() => setConfirmed(false)} className="w-full text-center text-xs text-muted-foreground underline">
                        Cancelar
                      </button>
                    )}
                  </div>
                  )}
                </>
              )}
            </div>

            {/* ── Membros da Família (only for familia plan owner) ── */}
            {isFamilia && isOwner && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display font-semibold">
                    <Users className="h-4 w-4 text-emerald-500" /> Membros da Família
                  </h2>
                  <span className="text-xs text-muted-foreground">{members.length + 1} / {maxMembers}</span>
                </div>

                {/* Owner row */}
                <Card className="mb-2 flex items-center gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">Tu</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Titular do plano</p>
                    <p className="text-xs text-muted-foreground">
                      {discArr.length > 0 ? `${discArr.length} disciplina${discArr.length !== 1 ? "s" : ""}` : "Disciplinas por escolher"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">Titular</Badge>
                </Card>

                {/* Members */}
                {members.map(m => (
                  <Card key={m.id} className="mb-2 flex items-center gap-3 p-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={m.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{m.nome?.charAt(0) ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.disciplines_locked
                          ? `${m.disciplines.length} disciplina${m.disciplines.length !== 1 ? "s" : ""}`
                          : "Disciplinas por escolher"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {m.disciplines_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      <Badge variant="outline" className="text-[10px]">Membro</Badge>
                    </div>
                  </Card>
                ))}

                {/* Add member */}
                {members.length + 1 < maxMembers && (
                  <Card className="mt-3 p-4">
                    <p className="mb-1 text-sm font-semibold">Adicionar membro</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Pesquisa por nome ou email. Uma vez adicionado, não pode ser removido antes do plano expirar.
                    </p>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                        placeholder="Nome ou email..." className="pl-9 rounded-full" />
                      {searchQ && (
                        <button onClick={() => { setSearchQ(""); setSearchResults([]); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searching && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> A pesquisar...
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {searchResults.map(u => (
                          <div key={u.id} className="flex items-center gap-3 rounded-xl border p-2">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={u.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">{u.nome?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <Button size="sm" className="rounded-full shrink-0"
                              disabled={adding === u.id} onClick={() => addMember(u.id)}>
                              {adding === u.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar</>}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">Nenhum utilizador encontrado.</p>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        )
      )}
    </AppShell>
  );
};

export default Planos;
