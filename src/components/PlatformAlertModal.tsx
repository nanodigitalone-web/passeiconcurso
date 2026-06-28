import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  accessService,
  battlesService,
  friendsService,
  notificationsService,
} from "@/services";
import { Bell, Crown, Sparkles, Swords, UserPlus, Zap } from "lucide-react";

type Alert = {
  key: string;
  emoji: string;
  icon: typeof Bell;
  title: string;
  body: string;
  primary: { label: string; action: () => void | Promise<void> };
  secondary?: { label: string; action: () => void | Promise<void> };
  avatarUrl?: string | null;
  avatarName?: string | null;
};

const MOTIVATION = [
  { title: "Bom te ver de volta!", body: "Cada simulado aproxima-te da aprovação. Vamos a mais um hoje?" },
  { title: "Constância vence talento!", body: "Os melhores candidatos treinam todos os dias. Continua o teu ritmo!" },
  { title: "Hoje é dia de evoluir!", body: "Reserva uns minutos e responde a algumas questões. O teu futuro agradece." },
  { title: "Foco no objetivo!", body: "Pequenos passos diários constroem grandes resultados. Bora estudar!" },
];

export const PlatformAlertModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Alert[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const sessionKey = `platform-alerts-shown:${user.id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    let active = true;
    (async () => {
      const [friends, battles, notifs, hasPaid] = await Promise.all([
        friendsService.list().catch(() => []),
        battlesService.list().catch(() => []),
        notificationsService.listForUser(user.id, 20).catch(() => []),
        accessService.hasAnyPaidAccess(user.id).catch(() => true),
      ]);
      if (!active) return;

      const alerts: Alert[] = [];

      // Friend requests (incoming pending)
      friends
        .filter((f) => f.status === "pending" && f.direction === "incoming")
        .slice(0, 3)
        .forEach((f) => {
          alerts.push({
            key: `friend-${f.friendship_id}`,
            emoji: "🤝",
            icon: UserPlus,
            title: "Novo pedido de amizade",
            body: `${f.nome} quer conectar-se contigo para trilhas e batalhas da semana.`,
            avatarUrl: f.avatar_url,
            avatarName: f.nome,
            primary: {
              label: "Aceitar",
              action: () => friendsService.respond(f.friendship_id, true),
            },
            secondary: {
              label: "Agora não",
              action: () => {},
            },
          });
        });

      // Battle invites / awaiting battles
      battles
        .filter((b) => b.status !== "finished")
        .slice(0, 3)
        .forEach((b) => {
          alerts.push({
            key: `battle-${b.id}`,
            emoji: "⚔️",
            icon: Swords,
            title: "Batalha de amigos!",
            body: `Tens uma batalha com ${b.opponent_nome} à tua espera. Mostra quem manda!`,
            avatarUrl: b.opponent_avatar,
            avatarName: b.opponent_nome,
            primary: {
              label: "Jogar agora",
              action: () => navigate(`/batalha/${b.id}`),
            },
            secondary: { label: "Mais tarde", action: () => {} },
          });
        });

      // Unread generic notifications
      const unread = notifs.filter((n) => !n.read);
      unread.slice(0, 3).forEach((n) => {
        alerts.push({
          key: `notif-${n.id}`,
          emoji: "🔔",
          icon: Bell,
          title: n.title,
          body: n.body,
          primary: { label: "Ver notificações", action: () => navigate("/notificacoes") },
          secondary: { label: "Fechar", action: () => {} },
        });
      });
      if (unread.length > 0) {
        notificationsService.markAllRead(user.id).catch(() => {});
      }

      // Subscription / full access reminder
      if (!hasPaid) {
        alerts.push({
          key: "subscription",
          emoji: "🔓",
          icon: Crown,
          title: "Desbloqueia o acesso completo",
          body: "Tens acesso limitado. Ativa o acesso completo e estuda sem limites para garantir a tua aprovação.",
          primary: { label: "Obter acesso", action: () => navigate("/concursos") },
          secondary: { label: "Talvez depois", action: () => {} },
        });
      }

      // Always-on motivational card
      const m = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
      alerts.push({
        key: "motivation",
        emoji: "🚀",
        icon: Sparkles,
        title: m.title,
        body: m.body,
        primary: { label: "Vamos lá", action: () => {} },
      });

      setQueue(alerts);
      setIndex(0);
      setOpen(alerts.length > 0);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const current = queue[index];
  if (!current) return null;
  const Icon = current.icon;

  const advance = () => {
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
    } else {
      setOpen(false);
    }
  };

  const run = async (action?: () => void | Promise<void>) => {
    try {
      await action?.();
    } finally {
      advance();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && advance()}>
      <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-sm">
        <div className="relative bg-gradient-primary p-8 text-center text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-25">
            {[Sparkles, Zap, Sparkles, Zap].map((S, i) => (
              <S
                key={i}
                className="absolute h-5 w-5 animate-float"
                style={{ left: `${12 + i * 22}%`, top: `${10 + (i % 2) * 30}%`, animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>

          <div className="relative">
            {current.avatarName ? (
              <Avatar className="mx-auto h-20 w-20 ring-4 ring-white/40 shadow-elegant animate-scale-in">
                <AvatarImage src={current.avatarUrl || undefined} />
                <AvatarFallback className="bg-white/20 font-display text-3xl font-black text-white">
                  {current.avatarName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 animate-scale-in">
                <Icon className="h-10 w-10 animate-float" />
              </div>
            )}

            <p className="mt-5 text-5xl">{current.emoji}</p>
            <h2 className="mt-2 font-display text-2xl font-bold">{current.title}</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-95">{current.body}</p>

            {queue.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {queue.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Button
                onClick={() => run(current.primary.action)}
                size="lg"
                variant="secondary"
                className="w-full rounded-full font-bold text-foreground"
              >
                {current.primary.label}
              </Button>
              {current.secondary && (
                <Button
                  onClick={() => run(current.secondary!.action)}
                  variant="ghost"
                  className="w-full rounded-full font-semibold text-white hover:bg-white/15 hover:text-white"
                >
                  {current.secondary.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
