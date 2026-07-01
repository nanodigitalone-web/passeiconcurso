import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Loader2, AlertTriangle } from "lucide-react";
import { AREAS, slugify } from "@/data/disciplinas";
import { subscriptionService, type UserSubscription, type UserMembership } from "@/services/subscriptionService";
import { toast } from "sonner";

const EscolherDisciplinas = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const maxDisc = sub?.max_disciplines ?? membership?.max_disciplines ?? 1;
  const subId = sub?.id ?? membership?.subscription_id ?? "";
  const isLocked = sub?.disciplines_locked || membership?.disciplines_locked;

  useEffect(() => {
    subscriptionService.getMySubscription()
      .then(({ subscription, membership: m }) => {
        setSub(subscription);
        setMembership(m);
        // Pre-fill if already chosen (but locked — show as read-only)
        const existing = subscription?.disciplines ?? m?.disciplines ?? [];
        if (existing.length > 0) setSelected(new Set(existing));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (slug: string) => {
    if (isLocked) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        if (next.size >= maxDisc) {
          toast.error(`O teu plano permite no máximo ${maxDisc} disciplina${maxDisc > 1 ? "s" : ""}.`);
          return prev;
        }
        next.add(slug);
      }
      return next;
    });
  };

  const confirmar = async () => {
    if (selected.size === 0) return toast.error("Selecciona pelo menos 1 disciplina.");
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setSaving(true);
    try {
      await subscriptionService.chooseDisciplines(subId, Array.from(selected));
      toast.success("Disciplinas guardadas! Não podem ser alteradas.");
      navigate("/meu-plano");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("already_locked")) {
        toast.info("As disciplinas já foram definidas.");
        navigate("/meu-plano");
      } else {
        toast.error("Erro ao guardar disciplinas. Tenta novamente.");
        setConfirmed(false);
      }
    } finally {
      setSaving(false);
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

  const activeStatus = sub?.status ?? membership?.sub_status;
  if (!sub && !membership) {
    return (
      <AppShell>
        <Card className="p-6 text-center">
          <p className="font-semibold">Sem plano activo</p>
          <p className="mt-1 text-sm text-muted-foreground">Activa um plano para poderes escolher disciplinas.</p>
          <Button className="mt-4 rounded-full" onClick={() => navigate("/planos")}>Ver planos</Button>
        </Card>
      </AppShell>
    );
  }
  if (activeStatus !== "active") {
    return (
      <AppShell>
        <Card className="p-6 text-center">
          <p className="font-semibold">Plano pendente de aprovação</p>
          <p className="mt-1 text-sm text-muted-foreground">Aguarda a activação do teu plano para escolheres as disciplinas.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/")}>Voltar ao início</Button>
        </Card>
      </AppShell>
    );
  }

  const healthAreas = AREAS.filter(a => a.saude);

  return (
    <AppShell>
      <header className="mb-2">
        <h1 className="font-display text-2xl font-bold">
          {isLocked ? "As tuas disciplinas" : "Escolher disciplinas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLocked
            ? "Já não é possível alterar a tua selecção."
            : `Escolhe até ${maxDisc} disciplina${maxDisc > 1 ? "s" : ""}. Esta escolha é permanente.`}
        </p>
      </header>

      {/* Counter */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2">
        <span className="text-sm font-medium">Seleccionadas</span>
        <span className="font-display font-bold text-primary">
          {selected.size} / {maxDisc}
        </span>
      </div>

      {/* Warning before confirm */}
      {confirmed && !isLocked && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Confirmar selecção permanente</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Depois de confirmares, <strong>não podes mudar</strong> as disciplinas.
                Tens a certeza das {selected.size} disciplinas seleccionadas?
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Discipline list by area */}
      <div className="space-y-4">
        {healthAreas.map(area => {
          const areaDiscs = area.disciplinas.map(d => ({ nome: d, slug: slugify(d) }));
          const anySelected = areaDiscs.some(d => selected.has(d.slug));
          return (
            <div key={area.area}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{area.emoji}</span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{area.area}</h2>
                {anySelected && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {areaDiscs.filter(d => selected.has(d.slug)).length} sel.
                  </Badge>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {areaDiscs.map(({ nome, slug }) => {
                  const isSelected = selected.has(slug);
                  const isDisabled = !isSelected && selected.size >= maxDisc;
                  return (
                    <button
                      key={slug}
                      onClick={() => toggle(slug)}
                      disabled={isLocked || isDisabled}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all
                        ${isSelected ? "border-primary bg-primary/8 font-medium" : "border-border/60 bg-background"}
                        ${isDisabled ? "cursor-not-allowed opacity-40" : "hover:border-primary/40"}
                        ${isLocked ? "cursor-default" : ""}
                      `}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
                        ${isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/40"}`}>
                        {isSelected && (isLocked ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
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

      {!isLocked && (
        <div className="sticky bottom-4 mt-6">
          <Button
            onClick={confirmar}
            disabled={saving || selected.size === 0}
            className={`w-full rounded-full py-3 text-base font-semibold shadow-lg
              ${confirmed ? "bg-amber-600 hover:bg-amber-700" : ""}`}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmed
              ? `Confirmar ${selected.size} disciplina${selected.size !== 1 ? "s" : ""} (permanente)`
              : `Guardar ${selected.size} disciplina${selected.size !== 1 ? "s" : ""}`}
          </Button>
          {confirmed && (
            <button onClick={() => setConfirmed(false)} className="mt-2 w-full text-center text-xs text-muted-foreground underline">
              Cancelar e continuar a editar
            </button>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default EscolherDisciplinas;
