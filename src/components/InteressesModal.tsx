import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services";
import { AREAS, slugify } from "@/data/disciplinas";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const InteressesModal = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen]       = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving]   = useState(false);

  // Mostrar apenas quando o utilizador está autenticado e NUNCA configurou os
  // interesses (undefined = coluna null na BD; [] = configurado mas vazio).
  useEffect(() => {
    if (profile && profile.interesses === undefined) setOpen(true);
  }, [profile]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const areasAtivas = AREAS.filter((a) => a.saude);

  const guardar = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await authService.updateProfile(user.id, {
      interesses: [...selected],
    });
    setSaving(false);
    if (error) return toast.error("Erro ao guardar preferências");
    await refreshProfile();
    setOpen(false);
  };

  // Pular: guarda [] para marcar como "já visto" (não volta a aparecer).
  const pular = async () => {
    if (!user) { setOpen(false); return; }
    await authService.updateProfile(user.id, { interesses: [] });
    await refreshProfile();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="flex max-h-[88dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md [&>button.absolute]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Cabeçalho fixo */}
        <div className="border-b border-border/60 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Personaliza o teu estudo</DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              Escolhe as disciplinas que te interessam. O conteúdo adapta-se às tuas preferências.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Área de scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {areasAtivas.map((a) => (
              <section key={a.area}>
                <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {a.area}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {a.disciplinas.map((nome) => {
                    const id = slugify(nome);
                    const on = selected.has(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggle(id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-100",
                          on
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/70 bg-card text-foreground hover:border-primary/50"
                        )}
                      >
                        {on && <Check className="h-3 w-3 shrink-0" />}
                        {nome}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              Mais áreas (Direito, Economia, Engenharias...) chegam em breve.
            </p>
          </div>
        </div>

        {/* Rodapé fixo */}
        <div className="flex gap-3 border-t border-border/60 px-6 py-4">
          <Button
            variant="ghost"
            onClick={pular}
            disabled={saving}
            className="flex-1 text-muted-foreground"
          >
            Pular por agora
          </Button>
          <Button
            onClick={guardar}
            disabled={saving}
            className="flex-1 bg-gradient-primary font-semibold"
          >
            {saving
              ? "A guardar…"
              : selected.size > 0
              ? `Guardar (${selected.size})`
              : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
