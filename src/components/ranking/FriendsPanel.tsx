import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  friendsService,
  battlesService,
  type FriendRow,
  type FoundUser,
  type BattleRow,
} from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Copy,
  Search,
  UserPlus,
  Check,
  X,
  Swords,
  Clock,
  Trophy,
} from "lucide-react";

export const FriendsPanel = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [battles, setBattles] = useState<BattleRow[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    Promise.all([friendsService.list(), battlesService.list()]).then(([f, b]) => {
      setFriends(f);
      setBattles(b);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.id) friendsService.getMyCode(user.id).then(setCode);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    const r = await friendsService.search(query);
    setResults(r);
    setSearching(false);
  };

  const handleAdd = async (u: FoundUser) => {
    const res = await friendsService.sendRequest(u.id);
    if (res.ok) {
      toast.success(res.status === "accepted" ? "Agora são amigos!" : "Pedido enviado!");
      setResults((prev) => prev.filter((x) => x.id !== u.id));
      refresh();
    } else {
      toast.error("Não foi possível enviar o pedido.");
    }
  };

  const handleCode = async () => {
    if (!query.trim()) return;
    const res = await friendsService.addByCode(query.trim());
    if (res.ok) {
      toast.success(res.status === "accepted" ? "Agora são amigos!" : "Pedido enviado!");
      setQuery("");
      setResults([]);
      refresh();
    } else {
      toast.error(res.error === "not_found" ? "Código não encontrado." : "Erro ao adicionar.");
    }
  };

  const respond = async (f: FriendRow, accept: boolean) => {
    const ok = await friendsService.respond(f.friendship_id, accept);
    if (ok) {
      toast.success(accept ? "Pedido aceite!" : "Pedido removido.");
      refresh();
    }
  };

  const startBattle = async (f: FriendRow) => {
    if (!profile?.concurso_id || !profile?.categoria_id) {
      toast.error("Escolha a sua categoria no perfil antes de desafiar.");
      return;
    }
    const res = await battlesService.create(f.friend_id, profile.concurso_id, profile.categoria_id);
    if (res.ok && res.id) {
      navigate(`/batalha/${res.id}`);
    } else {
      toast.error("Não foi possível criar a batalha.");
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const incoming = friends.filter((f) => f.status === "pending" && f.direction === "incoming");
  const outgoing = friends.filter((f) => f.status === "pending" && f.direction === "outgoing");
  const accepted = friends.filter((f) => f.status === "accepted");
  const myId = user?.id;

  const myTurnBattles = battles.filter((b) => {
    const iAmChallenger = b.challenger_id === myId;
    const iAmDone = iAmChallenger ? b.challenger_done : b.opponent_done;
    return b.status !== "finished" && !iAmDone;
  });
  const finishedBattles = battles.filter((b) => b.status === "finished").slice(0, 5);

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>;
  }

  return (
    <div className="space-y-5">
      {/* My friend code */}
      <Card className="border-border/60 p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O seu código de amigo
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-center font-display text-xl font-black tracking-[0.3em] text-primary">
            {code ?? "------"}
          </span>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={copyCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Partilhe este código para os amigos o adicionarem.
        </p>
      </Card>

      {/* Search / add */}
      <Card className="border-border/60 p-4 shadow-card">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conectar amigos
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Nome, email ou código"
            className="rounded-xl"
          />
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={runSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs text-primary" onClick={handleCode}>
          <UserPlus className="mr-1 h-3.5 w-3.5" /> Adicionar por código
        </Button>

        {searching && <p className="mt-3 text-xs text-muted-foreground">A procurar…</p>}
        {results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {u.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.nome}</p>
                  {u.categoria_nome && (
                    <p className="truncate text-[11px] text-muted-foreground">{u.categoria_nome}</p>
                  )}
                </div>
                <Button size="sm" className="h-8 rounded-full" onClick={() => handleAdd(u)}>
                  <UserPlus className="mr-1 h-3.5 w-3.5" /> Adicionar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <Card className="border-border/60 p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pedidos recebidos
          </p>
          <ul className="space-y-2">
            {incoming.map((f) => (
              <li key={f.friendship_id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {f.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{f.nome}</p>
                <Button size="icon" className="h-8 w-8 rounded-full" onClick={() => respond(f, true)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => respond(f, false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Battles awaiting me */}
      {myTurnBattles.length > 0 && (
        <Card className="border-border/60 p-4 shadow-card">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Swords className="h-3.5 w-3.5" /> Batalhas a aguardar você
          </p>
          <ul className="space-y-2">
            {myTurnBattles.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl bg-primary/5 p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={b.opponent_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {b.opponent_nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">vs {b.opponent_nome}</p>
                  <p className="text-[11px] text-muted-foreground">{b.question_ids.length} perguntas</p>
                </div>
                <Button size="sm" className="h-8 rounded-full" onClick={() => navigate(`/batalha/${b.id}`)}>
                  Jogar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Friends list */}
      <Card className="border-border/60 p-4 shadow-card">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Os meus amigos
        </p>
        {accepted.length === 0 && outgoing.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ainda sem amigos. Pesquise e adicione acima!
          </p>
        ) : (
          <ul className="space-y-2">
            {accepted.map((f) => (
              <li key={f.friendship_id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {f.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{f.pontos} pts</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => startBattle(f)}>
                  <Swords className="mr-1 h-3.5 w-3.5" /> Desafiar
                </Button>
              </li>
            ))}
            {outgoing.map((f) => (
              <li key={f.friendship_id} className="flex items-center gap-3 opacity-60">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {f.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{f.nome}</p>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Pendente
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Finished battles */}
      {finishedBattles.length > 0 && (
        <Card className="border-border/60 p-4 shadow-card">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> Batalhas concluídas
          </p>
          <ul className="space-y-2">
            {finishedBattles.map((b) => {
              const iAmChallenger = b.challenger_id === myId;
              const myScore = iAmChallenger ? b.challenger_score : b.opponent_score;
              const oppScore = iAmChallenger ? b.opponent_score : b.challenger_score;
              const won = b.winner_id === myId;
              const draw = b.winner_id === null;
              return (
                <li key={b.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      draw
                        ? "bg-muted text-muted-foreground"
                        : won
                          ? "bg-amber-500 text-white"
                          : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {draw ? "=" : won ? "🏆" : "—"}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">vs {b.opponent_nome}</p>
                  <p className="font-display text-sm font-bold">
                    {myScore ?? 0} <span className="text-muted-foreground">·</span> {oppScore ?? 0}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
};
