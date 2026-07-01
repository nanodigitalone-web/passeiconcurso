import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Users, Lock, Calendar, Search, Plus, Loader2, X,
  Crown, Zap, Star
} from "lucide-react";
import { subscriptionService, type UserSubscription, type UserMembership, type FamilyMember } from "@/services/subscriptionService";
import { AREAS, slugify } from "@/data/disciplinas";
import { toast } from "sonner";

const PLAN_ICON: Record<string, React.ReactNode> = {
  free: <Star className="h-4 w-4 text-muted-foreground" />,
  basico: <Zap className="h-4 w-4 text-blue-500" />,
  pro: <Star className="h-4 w-4 text-purple-500" />,
  pro_max: <Crown className="h-4 w-4 text-amber-500" />,
  familia: <Users className="h-4 w-4 text-emerald-500" />,
};

// Resolve slug → readable name
const slugToName = (() => {
  const map: Record<string, string> = {};
  for (const area of AREAS) {
    for (const d of area.disciplinas) {
      map[slugify(d)] = d;
    }
  }
  return (slug: string) => map[slug] ?? slug;
})();

const MeuPlano = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Member search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; nome: string; email: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    subscriptionService.getMySubscription()
      .then(({ subscription, membership: m, members: mems }) => {
        setSub(subscription);
        setMembership(m);
        setMembers(mems);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await subscriptionService.searchUsers(searchQ);
        // Filter out already-added members and owner
        const addedIds = new Set(members.map(m => m.member_user_id));
        setSearchResults(res.filter(u => !addedIds.has(u.id)));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [searchQ, members]);

  const addMember = async (userId: string) => {
    if (!sub) return;
    setAdding(userId);
    try {
      await subscriptionService.addFamilyMember(sub.id, userId);
      const user = searchResults.find(u => u.id === userId)!;
      setMembers(prev => [...prev, {
        id: crypto.randomUUID(),
        member_user_id: userId,
        nome: user.nome,
        email: user.email,
        avatar_url: user.avatar_url,
        disciplines: [],
        disciplines_locked: false,
        added_at: new Date().toISOString(),
      }]);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setSearchQ("");
      toast.success(`${user.nome} adicionado ao plano.`);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("max_members_reached")) toast.error("Atingiste o limite de membros.");
      else if (msg.includes("already_member")) toast.info("Este utilizador já é membro.");
      else toast.error("Erro ao adicionar membro.");
    } finally {
      setAdding(null);
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

  // Determine active access (own or as member)
  const activeSub = sub?.status === "active" ? sub : null;
  const activeMember = membership?.sub_status === "active" ? membership : null;

  if (!activeSub && !activeMember) {
    return (
      <AppShell>
        <header className="mb-4">
          <h1 className="font-display text-2xl font-bold">Meu Plano</h1>
        </header>
        <Card className="p-6 text-center">
          <p className="font-semibold">Sem plano activo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sub?.status === "pending"
              ? "O teu comprovativo está a ser analisado. Aguarda até 24h."
              : "Activa um plano para começar a estudar pelas tuas disciplinas."}
          </p>
          <Button className="mt-4 rounded-full" onClick={() => navigate("/planos")}>Ver planos</Button>
        </Card>
      </AppShell>
    );
  }

  const planId = activeSub?.plan_id ?? activeMember?.plan_id ?? "";
  const planName = activeSub?.plan_name ?? activeMember?.plan_name ?? planId;
  const disciplines: string[] = activeSub?.disciplines ?? activeMember?.disciplines ?? [];
  const isLocked = activeSub?.disciplines_locked ?? activeMember?.disciplines_locked ?? false;
  const expiresAt = activeSub?.expires_at ?? activeMember?.sub_expires_at;
  const isFamilia = planId === "familia";
  const isOwner = !!activeSub;
  const maxMembers = activeSub?.max_members ?? 0;

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">Meu Plano</h1>
      </header>

      {/* Plan card */}
      <Card className="mb-4 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {PLAN_ICON[planId] ?? PLAN_ICON.free}
            <div>
              <p className="font-display font-bold">{planName}</p>
              {activeMember && (
                <p className="text-xs text-muted-foreground">
                  Plano de {activeMember.owner_nome}
                </p>
              )}
            </div>
          </div>
          <Badge className="rounded-full bg-emerald-100 text-emerald-700">Activo</Badge>
        </div>
        {expiresAt && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Válido até {new Date(expiresAt).toLocaleDateString("pt-PT")}
          </div>
        )}
      </Card>

      {/* Disciplines */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" /> Disciplinas
          </h2>
          {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        {!isLocked ? (
          <Card className="border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Ainda não escolheste as tuas disciplinas de estudo.
            </p>
            <Button className="rounded-full" onClick={() => navigate("/escolher-disciplinas")}>
              Escolher disciplinas
            </Button>
          </Card>
        ) : disciplines.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {disciplines.map(slug => (
              <Badge key={slug} variant="secondary" className="rounded-full text-sm py-1 px-3">
                {slugToName(slug)}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {/* CTA to study */}
      {isLocked && disciplines.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Button className="w-full rounded-full" onClick={() => navigate("/aprender/sessao/plano/meu-plano")}>
            Modo Aprender
          </Button>
          <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/quiz/plano/meu-plano")}>
            Simulado
          </Button>
        </div>
      )}

      {/* Family members — only visible to owner of familia plan */}
      {isFamilia && isOwner && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-500" />
              Membros da família
            </h2>
            <span className="text-xs text-muted-foreground">
              {members.length + 1} / {maxMembers}
            </span>
          </div>

          {/* Owner row */}
          <Card className="mb-2 flex items-center gap-3 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              Tu
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Titular do plano</p>
              <p className="text-xs text-muted-foreground">
                {disciplines.length > 0 ? `${disciplines.length} disciplina${disciplines.length !== 1 ? "s" : ""}` : "Disciplinas por escolher"}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">Titular</Badge>
          </Card>

          {/* Member rows */}
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

          {/* Add member — only if slots available */}
          {members.length + 1 < maxMembers && (
            <Card className="mt-3 p-4">
              <p className="mb-2 text-sm font-medium">Adicionar membro</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Pesquisa por nome ou email. Uma vez adicionado, não pode ser removido antes do plano expirar.
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Nome ou email..."
                  className="pl-9 rounded-full"
                />
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
                        disabled={adding === u.id}
                        onClick={() => addMember(u.id)}>
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
    </AppShell>
  );
};

export default MeuPlano;
