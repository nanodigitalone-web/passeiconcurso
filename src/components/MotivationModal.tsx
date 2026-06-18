import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flame, Rocket, Sparkles, Trophy, Zap } from "lucide-react";

export type MotivationVariant = "quarter" | "threequarter";

const CONTENT: Record<
  MotivationVariant,
  { icon: typeof Flame; emoji: string; titles: string[]; subtitles: string[]; cta: string; gradient: string }
> = {
  quarter: {
    icon: Rocket,
    emoji: "🚀",
    titles: ["Estás a voar!", "Bom ritmo!", "Continua assim!"],
    subtitles: [
      "Já passaste 30% do simulado. O segredo é não parar — cada questão conta!",
      "Estás a construir disciplina. Respira fundo e segue em frente!",
      "Os melhores candidatos chegaram aqui treinando exatamente como tu.",
    ],
    cta: "Vamos continuar",
    gradient: "from-primary via-accent to-primary",
  },
  threequarter: {
    icon: Trophy,
    emoji: "🔥",
    titles: ["Estás quase lá!", "Reta final!", "Falta pouco!"],
    subtitles: [
      "Já completaste 75% do simulado. A linha de chegada está à vista — termina com força!",
      "Os últimos passos definem os campeões. Mantém o foco até ao fim!",
      "Tu consegues. Termina este simulado e celebra a tua evolução!",
    ],
    cta: "Terminar com tudo",
    gradient: "from-warning via-accent to-primary",
  },
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const MotivationModal = ({
  open,
  variant,
  progress,
  onClose,
}: {
  open: boolean;
  variant: MotivationVariant;
  progress: number;
  onClose: () => void;
}) => {
  const data = CONTENT[variant];
  const Icon = data.icon;

  useEffect(() => {
    if (open && navigator.vibrate) navigator.vibrate([18, 40, 18]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-sm">
        <div className={cn("relative bg-gradient-to-br p-8 text-center text-white", data.gradient)}>
          <div className="pointer-events-none absolute inset-0 opacity-30">
            {[Sparkles, Zap, Flame, Sparkles, Zap].map((S, i) => (
              <S
                key={i}
                className="absolute h-5 w-5 animate-float"
                style={{
                  left: `${10 + i * 18}%`,
                  top: `${8 + (i % 3) * 26}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm animate-scale-in">
              <Icon className="h-10 w-10 animate-float" />
            </div>

            <p className="mt-5 text-5xl">{data.emoji}</p>
            <h2 className="mt-2 font-display text-2xl font-bold">{pick(data.titles)}</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-95">{pick(data.subtitles)}</p>

            <div className="mt-5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-90">
                {Math.round(progress)}% concluído
              </p>
            </div>

            <Button
              onClick={onClose}
              size="lg"
              variant="secondary"
              className="mt-6 w-full rounded-full font-bold text-foreground"
            >
              {data.cta}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
