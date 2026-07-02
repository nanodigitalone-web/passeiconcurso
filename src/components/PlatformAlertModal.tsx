import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { battlesService, friendsService } from "@/services";
import { Swords, UserPlus } from "lucide-react";

type AlertColor = "rose" | "indigo";

type Alert = {
  key: string;
  icon: typeof Swords;
  color: AlertColor;
  kicker: string;
  title: string;
  body: string;
  primary: { label: string; action: () => void | Promise<void> };
  secondary?: { label: string; action: () => void };
  avatarUrl?: string | null;
  avatarName?: string | null;
};

const GRADIENT: Record<AlertColor, string> = {
  rose:   "bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700",
  indigo: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700",
};

const BUTTON_TEXT: Record<AlertColor, string> = {
  rose:   "text-rose-600",
  indigo: "text-indigo-600",
};

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
      const [friends, battles] = await Promise.all([
        friendsService.list().catch(() => []),
        battlesService.list().catch(() => []),
      ]);
      if (!active) return;

      const alerts: Alert[] = [];

      // Pedido de amizade pendente mais recente (máx 1)
      const pendingFriend = friends.find(
        (f) => f.status === "pending" && f.direction === "incoming",
      );
      if (pendingFriend) {
        alerts.push({
          key: `friend-${pendingFriend.friendship_id}`,
          icon: UserPlus,
          color: "indigo",
          kicker: "Novo pedido",
          title: "Pedido de amizade",
          body: `${pendingFriend.nome} quer conectar-se contigo para batalhas.`,
          avatarUrl: pendingFriend.avatar_url,
          avatarName: pendingFriend.nome,
          primary: {
            label: "Aceitar",
            action: async () => {
              await friendsService.respond(pendingFriend.friendship_id, true);
            },
          },
          secondary: { label: "Agora não", action: () => {} },
        });
      }

      // Batalha pendente mais recente (máx 1)
      const pendingBattle = battles.find((b) => b.status !== "finished");
      if (pendingBattle) {
        alerts.push({
          key: `battle-${pendingBattle.id}`,
          icon: Swords,
          color: "rose",
          kicker: "Desafio pendente",
          title: "Batalha à tua espera",
          body: `${pendingBattle.opponent_nome} desafiou-te. Aceita e mostra quem manda!`,
          avatarUrl: pendingBattle.opponent_avatar,
          avatarName: pendingBattle.opponent_nome,
          primary: {
            label: "Jogar agora",
            action: () => navigate(`/batalha/${pendingBattle.id}`),
          },
          secondary: { label: "Mais tarde", action: () => {} },
        });
      }

      if (alerts.length === 0) return;
      setQueue(alerts);
      setIndex(0);
      setOpen(true);
    })();

    return () => { active = false; };
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
    try { await action?.(); } finally { advance(); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && advance()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border-0 p-0">
        <div className={cn("relative p-7 text-center text-white", GRADIENT[current.color])}>
          {/* Círculos de blur — mesma linguagem dos heros da plataforma */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="relative mx-auto w-fit">
              <Avatar className="h-20 w-20 shadow-elegant ring-4 ring-white/40 animate-scale-in">
                <AvatarImage src={current.avatarUrl || undefined} />
                <AvatarFallback className="bg-white/20 font-display text-3xl font-black text-white">
                  {current.avatarName?.charAt(0).toUpperCase() ?? <Icon className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card">
                <Icon className={cn("h-4 w-4", BUTTON_TEXT[current.color])} />
              </span>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wider opacity-70">{current.kicker}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{current.title}</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{current.body}</p>

            {queue.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {queue.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index ? "w-5 bg-white" : "w-1.5 bg-white/40",
                    )}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Button
                onClick={() => run(current.primary.action)}
                size="lg"
                className={cn(
                  "w-full rounded-2xl bg-white font-bold shadow-lg transition-all hover:bg-white/90 active:scale-[0.98]",
                  BUTTON_TEXT[current.color],
                )}
              >
                {current.primary.label}
              </Button>
              {current.secondary && (
                <Button
                  onClick={() => run(current.secondary!.action)}
                  variant="ghost"
                  className="w-full rounded-2xl font-semibold text-white hover:bg-white/15 hover:text-white"
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
