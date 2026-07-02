import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resultsService, friendsService, battlesService, quizService, type FriendRow } from "@/services";
import { notificationsService } from "@/services";
import { getCorpo } from "@/lib/celestial";
import { useAuth } from "@/hooks/useAuth";
import { usePromo, useIsPromoActive } from "@/contexts/PromoContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Play, BookMarked, Flame, Zap, BarChart2,
  Gift, Banknote, Swords, Users, MapPin,
  ChevronRight, Loader2, Plus, Sparkles, X, Megaphone, CreditCard, Crown,
  Trophy, Gauge,
} from "lucide-react";

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const promo = usePromo();
  const isPromoActive = useIsPromoActive();
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [challenging, setChallenging] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState<{ id: string; title: string; body: string } | null>(null);

  useEffect(() => {
    friendsService.list().then((f) => setFriends(f.filter((x) => x.status === "accepted")));
  }, []);

  useEffect(() => {
    if (!profile) return;
    notificationsService.listForUser(profile.id).then((list) => {
      const dismissed: string[] = JSON.parse(localStorage.getItem("dismissed_broadcasts") || "[]");
      const msg = list.find((n) => n.user_id === null && !dismissed.includes(n.id));
      if (msg) setBroadcastMsg({ id: msg.id, title: msg.title, body: msg.body });
    });
  }, [profile?.id]);

  const dismissBroadcast = (id: string) => {
    const dismissed: string[] = JSON.parse(localStorage.getItem("dismissed_broadcasts") || "[]");
    localStorage.setItem("dismissed_broadcasts", JSON.stringify([...dismissed, id].slice(-20)));
    setBroadcastMsg(null);
  };

  // ── Destinos ────────────────────────────────────────────────────────────────
  // plano mode takes absolute priority; interesses only when no explicit mode is set
  const isPlanoMode     = profile?.concurso_id === "plano";
  const interessesAtivo = !isPlanoMode && !!profile?.interesses_ativo && (profile?.interesses?.length ?? 0) > 0;
  const temInteresses   = (profile?.interesses?.length ?? 0) > 0;
  const hasCateg        = !!(profile?.concurso_id && profile?.categoria_id);

  const simuladoTo = isPlanoMode
    ? "/quiz/plano/meu-plano"
    : interessesAtivo
      ? "/quiz/interesses/interesses"
      : hasCateg
        ? `/quiz/${profile!.concurso_id}/${profile!.categoria_id}`
        : "/concursos";

  // Destino da trilha Aprender (mesma lógica do simulado).
  const trilhaIds: [string, string] | null = isPlanoMode
    ? ["plano", "meu-plano"]
    : interessesAtivo
      ? ["interesses", "interesses"]
      : hasCateg
        ? [profile!.concurso_id!, profile!.categoria_id!]
        : null;
  const [trilha, setTrilha] = useState<{ level: number; doneInLevel: number; perLevel: number } | null>(null);
  useEffect(() => {
    if (!trilhaIds) return;
    quizService.getAprenderLevel(trilhaIds[0], trilhaIds[1]).then(setTrilha).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trilhaIds?.[0], trilhaIds?.[1]]);

  // ── Stats locais ────────────────────────────────────────────────────────────
  const results  = resultsService.getResults();
  const totalQ   = results.reduce((s, r) => s + r.total, 0);
  const acertos  = results.reduce((s, r) => s + r.acertos, 0);
  const taxa     = totalQ ? Math.round((acertos / totalQ) * 100) : 0;
  const nome     = profile?.nome?.split(" ")[0] || "Candidato";
  const pontos   = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const streak   = profile?.streak ?? 0;

  const hora     = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 19 ? "Boa tarde" : "Boa noite";

  // ── Desafiar amigo ──────────────────────────────────────────────────────────
  const desafiar = async (friendId: string) => {
    if (!hasCateg) return toast.error("Define a tua categoria nas definições.");
    setChallenging(friendId);
    const r = await battlesService.create(
      friendId,
      profile!.concurso_id!,
      profile!.categoria_id!,
    );
    setChallenging(null);
    if (!r.ok) return toast.error("Não foi possível criar batalha.");
    navigate(`/batalha/${r.id}`);
  };

  return (
    <AppShell>
      <Seo
        title="Passei · Prepara-te para os concursos em Angola"
        description="Simulados comentados, trilha por níveis e ranking. A app de estudo para concursos em Angola."
        path="/"
      />

      {/* ── PROMO BANNER ─────────────────────────────────────────────────────── */}
      {isPromoActive && promo.promo && (() => {
        const promoEnd = new Date(promo.promo!.ends_at).getTime();
        const diasRestantes = Math.max(1, Math.ceil((promoEnd - Date.now()) / 86_400_000));
        const label = promo.promo!.label || "Acesso completo";
        const discount = promo.promo!.discount_pct;
        return (
          <div className="mb-4 flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 px-4 py-3.5 animate-fade-in">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 leading-tight">
                {discount === 100 ? `${label} GRATUITO` : `${discount}% desconto · ${label}`}
              </p>
              <p className="text-xs text-amber-700/80 leading-tight mt-0.5">
                Todas as funcionalidades desbloqueadas até {new Date(promo.promo!.ends_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="rounded-xl bg-amber-500 px-2.5 py-1 text-center shadow-sm">
                <p className="font-display text-lg font-black text-white leading-none">{diasRestantes}</p>
                <p className="text-[9px] font-bold text-white/80 uppercase tracking-wide leading-tight">
                  {diasRestantes === 1 ? "dia" : "dias"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <p className="text-sm font-medium opacity-70">{saudacao},</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">{nome}</h1>

          {hasCateg && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <MapPin className="h-3 w-3 opacity-80" />
              {profile!.categoria_nome}
            </span>
          )}

          {/* Stats do utilizador */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Flame, value: streak > 0 ? `${streak}d` : "0", label: "Sequência" },
              { icon: Zap, value: pontos > 0 ? pontos.toLocaleString("pt-PT") : "0", label: "Pontos" },
              { icon: BarChart2, value: totalQ > 0 ? `${taxa}%` : "0%", label: "Acerto" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 opacity-60" />
                <p className="font-display text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] opacity-60 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {/* CTA principal */}
            <Button
              asChild
              size="lg"
              className="w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <Link to={simuladoTo} className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5 fill-primary" />
                {hasCateg ? "Começar Simulado" : "Escolher Categoria"}
              </Link>
            </Button>

            {/* Minhas Disciplinas (interesses) — só quando não tem plano nem categoria */}
            {temInteresses && !profile?.plan_id && !hasCateg && (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full rounded-2xl border border-white/25 text-white hover:bg-white/10 font-semibold"
              >
                <Link to="/quiz/interesses/interesses" className="flex items-center justify-center gap-2">
                  <BookMarked className="h-4 w-4" />
                  Minhas Disciplinas
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── BANNER: plano activo mas modo de estudo não activado ────────────── */}
      {profile?.plan_id && profile.concurso_id !== "plano" && (
        <Link to="/planos"
          className="mt-4 flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/50 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 transition-all hover:shadow-md animate-fade-in">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 leading-tight">Plano activo: configura o teu modo de estudo</p>
            <p className="text-xs text-amber-700/80 mt-0.5 leading-tight">
              Escolhe as disciplinas e activa o modo de estudo por plano.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-amber-600" />
        </Link>
      )}

      {/* ── TRILHA APRENDER (entra e joga) ───────────────────────────────────── */}
      {trilhaIds && (() => {
        const level = trilha?.level ?? 1;
        const perLevel = trilha?.perLevel ?? 300;
        const done = trilha?.doneInLevel ?? 0;
        const pct = Math.min(100, Math.round((done / perLevel) * 100));
        const corpo = getCorpo(level);
        const proximos = [getCorpo(level + 1), getCorpo(level + 2)];
        return (
          <Link to={`/aprender/sessao/${trilhaIds[0]}/${trilhaIds[1]}`} className="mt-4 block">
            <div
              className="relative overflow-hidden rounded-3xl p-4 text-white shadow-elegant transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              style={{ background: `radial-gradient(ellipse at 78% 25%, ${corpo.brilho}70 0%, #0b0b1c 70%)` }}
            >
              {[[12, 20], [30, 68], [55, 15], [72, 75], [88, 35], [45, 45]].map(([x, y], i) => (
                <span key={i} className="pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-white"
                  style={{ left: `${x}%`, top: `${y}%`, opacity: 0.25 + (i % 3) * 0.15 }} />
              ))}

              <div className="relative flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl animate-float"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${corpo.cor}cc, ${corpo.brilho})`,
                    boxShadow: `0 0 16px ${corpo.cor}55`,
                  }}
                >
                  {corpo.icone}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                    Trilha Aprender · Nível {level}
                  </p>
                  <p className="font-display text-lg font-bold leading-tight">{corpo.nome}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(2, pct)}%`, background: `linear-gradient(90deg, ${corpo.cor}, ${corpo.brilho})` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] opacity-50">{done}/{perLevel} questões</p>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {proximos.map((p, i) => (
                      <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm grayscale opacity-40">
                        {p.icone}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-lg">
                    <Play className="h-3 w-3 fill-slate-900" /> Jogar
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })()}

      {/* ── MENSAGEM DA PLATAFORMA (broadcast) ───────────────────────────────── */}
      {broadcastMsg && (
        <div className="mt-4 relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 to-indigo-50 px-4 py-3.5 animate-fade-in">
          <button
            onClick={() => dismissBroadcast(broadcastMsg.id)}
            aria-label="Fechar"
            className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-500 hover:bg-sky-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100">
              <Megaphone className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-900 leading-tight">{broadcastMsg.title}</p>
              <p className="mt-0.5 text-xs text-sky-800/80 leading-relaxed">{broadcastMsg.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── BATALHA DE AMIGOS ─────────────────────────────────────────────────── */}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100">
              <Swords className="h-4 w-4 text-violet-700" />
            </div>
            <h2 className="font-display font-semibold">Batalha de Amigos</h2>
          </div>
          <Link to="/partilhar" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
            Convidar <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {friends.length === 0 ? (
          /* Estado vazio — nenhum amigo */
          <Card className="flex flex-col items-center gap-3 border-dashed border-border/60 bg-muted/20 p-6 text-center shadow-none">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground/50" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold">Sem amigos ainda</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Convida amigos para batalhar!</p>
            </div>
            <Button asChild size="sm" className="rounded-full bg-gradient-primary">
              <Link to="/partilhar">Convidar agora</Link>
            </Button>
          </Card>
        ) : (
          /* Lista de amigos com avatares */
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {friends.slice(0, 6).map((f) => (
              <button
                key={f.friend_id}
                onClick={() => desafiar(f.friend_id)}
                disabled={!!challenging}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant hover:border-violet-300 active:scale-95 disabled:opacity-60 min-w-[80px]"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 ring-2 ring-transparent group-hover:ring-violet-400 transition-all">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.nome} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-white">
                        {f.nome.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Ícone de espadas */}
                  <div className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {challenging === f.friend_id
                      ? <Loader2 className="h-3 w-3 text-white animate-spin" />
                      : <Swords className="h-3 w-3 text-white" />}
                  </div>
                </div>
                {/* Nome */}
                <span className="max-w-[72px] truncate text-center text-xs font-semibold leading-tight">
                  {f.nome.split(" ")[0]}
                </span>
                {/* Badge pontos */}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {f.pontos.toLocaleString("pt-PT")} pts
                </span>
              </button>
            ))}

            {/* Botão + Adicionar */}
            <Link
              to="/partilhar"
              className="flex min-w-[80px] flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/40">
                <Plus className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <span className="text-center text-xs font-semibold text-muted-foreground">Adicionar</span>
            </Link>
          </div>
        )}
      </section>

      {/* ── ACÇÕES RÁPIDAS (não estão no menu inferior) ───────────────────────── */}
      <section className="mt-5">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              to: "/simulado-nacional",
              icon: Trophy,
              label: "Simulado Nacional",
              desc: "Compete pelo pódio",
              accent: "bg-amber-100 text-amber-700",
            },
            {
              to: "/prontidao",
              icon: Gauge,
              label: "Prontidão",
              desc: "Estás pronto para passar?",
              accent: "bg-sky-100 text-sky-700",
            },
            {
              to: "/planos",
              icon: CreditCard,
              label: "Planos",
              desc: "Ver e aderir a planos",
              accent: "bg-violet-100 text-violet-700",
            },
            {
              to: "/partilhar",
              icon: Gift,
              label: "Convidar",
              desc: "+50 pontos por amigo",
              accent: "bg-emerald-100 text-emerald-700",
            },
            {
              to: "/carteira",
              icon: Banknote,
              label: "Sacar",
              desc: "Levanta os teus pontos",
              accent: "bg-amber-100 text-amber-700",
            },
            {
              to: "/concursos",
              icon: BarChart2,
              label: "Concursos",
              desc: "Explorar categorias",
              accent: "bg-rose-100 text-rose-700",
            },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="group flex items-center gap-3 border-border/60 p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.accent} transition-transform group-hover:scale-110`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{a.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RECENTES ────────────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="mt-6 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recentes</p>
            <Link to="/percurso" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {results.slice(0, 3).map((r) => {
              const p = r.total ? Math.round((r.acertos / r.total) * 100) : 0;
              const green = p >= 60;
              const date = new Date(r.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
              return (
                <Link key={r.id} to={`/resultado/${r.id}`}>
                  <Card className="flex items-center gap-3 border-border/60 p-3 shadow-card transition-all hover:shadow-elegant active:scale-[0.99]">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold"
                      style={{
                        background: green ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.10)",
                        color: green ? "#15803d" : "#dc2626",
                      }}
                    >
                      {p}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.categoriaNome}</p>
                      <p className="text-xs text-muted-foreground">{date} · {r.acertos}/{r.total} acertos</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default Index;
