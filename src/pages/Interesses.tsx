import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services";
import { AREAS, slugify } from "@/data/disciplinas";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Interesses = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.interesses) setSelected(new Set(profile.interesses));
  }, [profile?.interesses]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Só áreas com conteúdo (saúde) por agora; as restantes chegam em breve.
  const areasAtivas = AREAS.filter((a) => a.saude);
  const areasEmBreve = AREAS.filter((a) => !a.saude);

  const guardar = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await authService.updateProfile(user.id, { interesses: [...selected] });
    setSaving(false);
    if (error) return toast.error("Erro ao guardar interesses");
    await refreshProfile();
    toast.success("Interesses guardados!");
    navigate("/");
  };

  return (
    <AppShell>
      <header className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Personaliza o teu estudo
        </div>
        <h1 className="font-display text-2xl font-bold">Áreas e temas de interesse</h1>
        <p className="text-sm text-muted-foreground">
          Escolhe as disciplinas que te interessam. O início e o "Aprender" adaptam-se a ti.
        </p>
      </header>

      <div className="space-y-5">
        {areasAtivas.map((a) => (
          <section key={a.area}>
            <h2 className="mb-2.5 flex items-center gap-2 font-display font-semibold">
              <span className="text-lg">{a.emoji}</span> {a.area}
            </h2>
            <div className="flex flex-wrap gap-2">
              {a.disciplinas.map((nome) => {
                const id = slugify(nome);
                const on = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                      on
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border/60 bg-card hover:border-primary/40",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />} {nome}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {areasEmBreve.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mais áreas — em breve
            </h2>
            <div className="flex flex-wrap gap-2">
              {areasEmBreve.map((a) => (
                <span key={a.area} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  {a.emoji} {a.area}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="sticky bottom-4 mt-6">
        <Button
          onClick={guardar}
          disabled={saving}
          className="w-full rounded-full bg-gradient-primary font-semibold shadow-elegant"
        >
          {saving ? "A guardar…" : `Guardar ${selected.size > 0 ? `(${selected.size})` : ""}`}
        </Button>
      </div>
    </AppShell>
  );
};

export default Interesses;
