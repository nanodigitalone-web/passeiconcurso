import { useEffect, useMemo, useState, useRef, type ChangeEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { authService, accessService, quizService } from "@/services";
import { api } from "@/lib/api";
import { ALL_DISCIPLINAS, AREAS, slugify } from "@/data/disciplinas";
import { ESCOLAS, escolaByValue } from "@/data/escolas";
import { CURSOS, cursoByValue } from "@/data/cursos";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Check, CreditCard, EyeOff, Lock, LogOut, Save,
  Bell, BellOff, BellRing, Coins, ChevronRight, ChevronDown, Gift,
  Pencil, X, Users, Camera, Loader2, Search, Star, Zap,
  UserCheck, MapPin, GraduationCap, Flame,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FREE_MAX   = 5;
const BASIC_MAX  = 10;
const PRO_MAX    = 30;
const BASIC_COST = 1000;
const PRO_COST   = 2000;

const Perfil = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const { status: pushStatus, toggle: togglePush } = usePushNotifications();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [editing, setEditing]           = useState(false);
  const [nome, setNome]                 = useState("");
  const [bio, setBio]                   = useState("");
  const [universidade, setUniversidade] = useState("");
  const [curso, setCurso]               = useState("");
  const [ano, setAno]                   = useState("");
  const [saving, setSaving]             = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Interests ──────────────────────────────────────────────────────────────
  const [interesses, setInteresses]     = useState<string[]>([]);
  const [interSearch, setInterSearch]   = useState("");
  const [savingInt, setSavingInt]       = useState(false);
  const [buyingTier, setBuyingTier]     = useState<10 | 30 | null>(null);

  // ── Other state ────────────────────────────────────────────────────────────
  const [hidden, setHidden]             = useState(false);
  const [canHide, setCanHide]           = useState(false);
  const [togglingHide, setTogglingHide] = useState(false);
  const [plansOpen, setPlansOpen]       = useState(false);
  const [plans, setPlans]               = useState<
    { concursoId: string; categoriaId: string; nome: string; expiresAt: number | null }[]
  >([]);
  const [followStats, setFollowStats]   = useState<{ followers: number; following: number } | null>(null);

  const pushLabel = {
    granted:     { icon: BellRing, text: "Activas",       desc: "Recebe lembretes de estudo no dispositivo." },
    denied:      { icon: BellOff,  text: "Bloqueadas",    desc: "A permissão foi negada no browser." },
    prompt:      { icon: Bell,     text: "Desactivadas",  desc: "Activa para receber lembretes de estudo." },
    unsupported: { icon: BellOff,  text: "Não suportado", desc: "O teu dispositivo/browser não suporta notificações." },
    loading:     { icon: Bell,     text: "A verificar…",  desc: "" },
  }[pushStatus] ?? { icon: Bell, text: "Desactivadas", desc: "Activa para receber lembretes de estudo." };

  useEffect(() => {
    if (!profile) return;
    setNome(profile.nome);
    setBio(profile.bio || "");
    setHidden(!!profile.hidden);
    setInteresses(profile.interesses ?? []);
    const uniMatch = ESCOLAS.find((e) => e.label === profile.universidade || e.value === profile.universidade);
    setUniversidade(uniMatch?.value ?? profile.universidade ?? "");
    const cursoMatch = CURSOS.find((c) => c.label === profile.curso || c.value === profile.curso);
    setCurso(cursoMatch?.value ?? profile.curso ?? "");
    setAno(profile.ano || "");
  }, [profile]);

  useEffect(() => { if (user) accessService.hasAnyPaidAccess(user.id).then(setCanHide); }, [user]);

  useEffect(() => {
    if (!user) return;
    accessService.getMyPlans(user.id).then((rows) =>
      setPlans(rows.map((r) => ({
        ...r,
        nome: quizService.getCategoria(r.concursoId, r.categoriaId)?.nome ?? r.categoriaId,
      }))),
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get<{ followers_count: number; following_count: number }>(`/profile/${user.id}`)
      .then((p) => setFollowStats({ followers: p.followers_count, following: p.following_count }))
      .catch(() => {});
  }, [user]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const interMax  = profile?.interesses_max === 30 ? PRO_MAX
    : profile?.interesses_max === 10 ? BASIC_MAX
    : FREE_MAX;

  const filteredDisciplinas = useMemo(() => {
    const q = interSearch.toLowerCase().trim();
    if (!q) return ALL_DISCIPLINAS;
    return ALL_DISCIPLINAS.filter(
      (d) => d.nome.toLowerCase().includes(q) || d.area.toLowerCase().includes(q),
    );
  }, [interSearch]);

  const selectedSet = useMemo(() => new Set(interesses), [interesses]);

  const toggleInteresse = (id: string) => {
    setInteresses((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= interMax) {
        toast.error(`Limite de ${interMax} interesses atingido. Faz upgrade para mais.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const saveInteresses = async () => {
    if (!user) return;
    setSavingInt(true);
    try {
      await authService.updateProfile(user.id, { interesses });
      await refreshProfile();
      toast.success("Interesses guardados!");
    } catch {
      toast.error("Erro ao guardar interesses");
    } finally {
      setSavingInt(false);
    }
  };

  const buyTier = async (tier: 10 | 30) => {
    setBuyingTier(tier);
    try {
      const r = await api.post<{ ok: boolean; error?: string }>("/profile/interests-tier", { tier });
      if (!r.ok) {
        if ((r as any).error === "insufficient_coins") {
          toast.error("Moedas insuficientes. Carrega a tua carteira.");
        } else {
          toast.error("Erro ao comprar plano.");
        }
      } else {
        await refreshProfile();
        toast.success(tier === 10 ? "Plano Básico activado!" : "Plano Pro activado!");
      }
    } catch {
      toast.error("Erro ao comprar plano.");
    } finally {
      setBuyingTier(null);
    }
  };

  // ── Save profile info ─────────────────────────────────────────────────────
  const save = async () => {
    if (!user) return;
    setSaving(true);
    const uniLabel  = (escolaByValue(universidade)?.label ?? universidade) || null;
    const cursoLabel = (cursoByValue(curso)?.label ?? curso) || null;
    const { error } = await authService.updateProfile(user.id, {
      nome, bio, universidade: uniLabel, curso: cursoLabel, ano: ano || null,
    });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar perfil");
    await refreshProfile();
    setEditing(false);
    toast.success("Perfil atualizado!");
  };

  const cancelEdit = () => {
    if (profile) {
      setNome(profile.nome);
      setBio(profile.bio || "");
      const uniMatch = ESCOLAS.find((e) => e.label === profile.universidade || e.value === profile.universidade);
      setUniversidade(uniMatch?.value ?? profile.universidade ?? "");
      const cursoMatch = CURSOS.find((c) => c.label === profile.curso || c.value === profile.curso);
      setCurso(cursoMatch?.value ?? profile.curso ?? "");
      setAno(profile.ano || "");
    }
    setEditing(false);
  };

  const toggleHidden = async (value: boolean) => {
    if (!user) return;
    setTogglingHide(true);
    setHidden(value);
    const { error } = await authService.updateProfile(user.id, { hidden: value });
    setTogglingHide(false);
    if (error) { setHidden(!value); return toast.error("Erro ao atualizar privacidade"); }
    await refreshProfile();
    toast.success(value ? "Conta oculta no ranking" : "Conta visível no ranking");
  };

  const handleSignOut = async () => { await signOut(); navigate("/login", { replace: true }); };

  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("Imagem deve ter no máximo 4MB");
    if (!file.type.startsWith("image/")) return toast.error("Selecione um ficheiro de imagem");
    setUploadingAvatar(true);
    try {
      await authService.uploadAvatar(file);
      await refreshProfile();
      toast.success("Foto de perfil atualizada!");
    } catch { toast.error("Erro ao enviar a foto"); }
    finally { setUploadingAvatar(false); }
  };

  const fmtDate = (ms: number | null) =>
    ms === null ? "Vitalício" : new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  const disponiveis = profile?.pontos ?? 0;
  const totais      = profile?.pontos_globais ?? disponiveis;
  const trocados    = Math.max(0, totais - disponiveis);

  return (
    <AppShell>
      <Seo title="Perfil" description="O teu perfil e definições na plataforma Passei." path="/perfil" />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-900 mb-5 shadow-elegant animate-fade-in">
        {/* BG blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative px-5 pt-7 pb-6 text-white">
          {/* Avatar row */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <Avatar className="h-24 w-24 ring-4 ring-white/30 shadow-elegant">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-display font-bold">
                  {profile?.nome?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-primary shadow-elegant ring-2 ring-white/30 transition hover:scale-105"
              >
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={handleAvatarFile} />
            </div>

            <h1 className="font-display text-2xl font-bold leading-tight">{profile?.nome || "Utilizador"}</h1>
            {profile?.bio && <p className="mt-1 text-sm text-white/70 max-w-xs">{profile.bio}</p>}

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {profile?.categoria_nome && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <MapPin className="h-3 w-3 opacity-70" />{profile.categoria_nome}
                </span>
              )}
              {profile?.universidade && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <GraduationCap className="h-3 w-3 opacity-70" />{profile.universidade}
                </span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[
              { label: "Pontos", value: totais.toLocaleString("pt-PT"), icon: Zap },
              { label: "Seguidores", value: String(followStats?.followers ?? "–"), icon: Users, to: `/perfil/${user?.id}` },
              { label: "A seguir",   value: String(followStats?.following ?? "–"), icon: UserCheck, to: `/perfil/${user?.id}` },
              { label: "Sequência",  value: `${profile?.streak ?? 0}d`, icon: Flame },
            ].map((s) => {
              const content = (
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <s.icon className="h-4 w-4 opacity-60" />
                  <p className="font-display text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-[10px] opacity-60 leading-tight">{s.label}</p>
                </div>
              );
              return s.to ? (
                <Link key={s.label} to={s.to}>{content}</Link>
              ) : (
                <div key={s.label}>{content}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ACÇÕES RÁPIDAS ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {[
          { to: "/carteira", icon: Coins,   label: "Carteira",  desc: `${(profile?.moedas ?? 0).toLocaleString("pt-PT")} moedas disponíveis`, accent: "bg-amber-100 text-amber-700" },
          { to: "/partilhar", icon: Gift,   label: "Partilhar", desc: "Convida + banner + certificado", accent: "bg-emerald-100 text-emerald-700" },
        ].map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="group flex items-center gap-3 border-border/60 p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant active:scale-[0.98]">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.accent} transition-transform group-hover:scale-110`}>
                <a.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{a.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Card>
          </Link>
        ))}
      </div>

      {/* ── INTERESSES ───────────────────────────────────────────────────────── */}
      <Card className="mb-5 overflow-hidden border-border/60 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold leading-tight">Interesses de estudo</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {interesses.length}/{interMax} seleccionados
              </p>
            </div>
          </div>
          {/* Tier badge */}
          <span className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            interMax === PRO_MAX   ? "bg-violet-100 text-violet-700"
            : interMax === BASIC_MAX ? "bg-sky-100 text-sky-700"
            : "bg-muted text-muted-foreground",
          )}>
            {interMax === PRO_MAX ? "Pro" : interMax === BASIC_MAX ? "Básico" : "Grátis"}
          </span>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Planos de upgrade */}
          {interMax < PRO_MAX && (
            <div className="space-y-2">
              {interMax < BASIC_MAX && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200/60 bg-sky-50/80 px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Star className="h-5 w-5 text-sky-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-sky-900 leading-tight">Plano Básico</p>
                      <p className="text-xs text-sky-700/80 leading-tight">Até {BASIC_MAX} interesses · {BASIC_COST.toLocaleString("pt-PT")} AOA</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                    disabled={!!buyingTier}
                    onClick={() => buyTier(10)}
                  >
                    {buyingTier === 10 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Activar"}
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-200/60 bg-violet-50/80 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-5 w-5 text-violet-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-violet-900 leading-tight">Plano Pro</p>
                    <p className="text-xs text-violet-700/80 leading-tight">Até {PRO_MAX} interesses · {PRO_COST.toLocaleString("pt-PT")} AOA</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                  disabled={!!buyingTier}
                  onClick={() => buyTier(30)}
                >
                  {buyingTier === 30 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Activar"}
                </Button>
              </div>
            </div>
          )}

          {/* Chips seleccionados */}
          {interesses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interesses.map((id) => {
                const d = ALL_DISCIPLINAS.find((x) => x.id === id);
                if (!d) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleInteresse(id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20"
                  >
                    {d.nome}
                    <X className="h-3 w-3 opacity-60" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Pesquisar disciplina ou área..."
              value={interSearch}
              onChange={(e) => setInterSearch(e.target.value)}
              className="pl-9 rounded-xl border-border/60"
            />
            {interSearch && (
              <button onClick={() => setInterSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Grid de disciplinas por área */}
          <div className="max-h-64 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-border">
            {interSearch
              ? (
                <div className="flex flex-wrap gap-1.5">
                  {filteredDisciplinas.map((d) => {
                    const sel = selectedSet.has(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleInteresse(d.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                          sel
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/60 bg-background text-foreground hover:border-primary/30 hover:text-primary",
                        )}
                      >
                        {sel && <Check className="h-3 w-3 shrink-0" />}
                        {d.nome}
                        <span className="opacity-40">· {d.area}</span>
                      </button>
                    );
                  })}
                  {filteredDisciplinas.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma disciplina encontrada.</p>
                  )}
                </div>
              )
              : AREAS.map((area) => {
                  const disciplinas = area.disciplinas.map((nome) => ({ id: slugify(nome), nome }));
                  return (
                    <div key={area.area}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {area.area}
                        {!area.saude && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-amber-700 normal-case tracking-normal font-medium">
                            em breve
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {disciplinas.map((d) => {
                          const sel = selectedSet.has(d.id);
                          return (
                            <button
                              key={d.id}
                              onClick={() => area.saude ? toggleInteresse(d.id) : null}
                              disabled={!area.saude}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                                !area.saude
                                  ? "border-border/30 bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                                  : sel
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border/60 bg-background text-foreground hover:border-primary/30 hover:text-primary",
                              )}
                            >
                              {sel && <Check className="h-3 w-3 shrink-0" />}
                              {d.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Save button */}
          <Button
            onClick={saveInteresses}
            disabled={savingInt}
            className="w-full rounded-full bg-gradient-primary"
          >
            {savingInt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar interesses
          </Button>
        </div>
      </Card>

      {/* ── INFORMAÇÕES PESSOAIS ─────────────────────────────────────────────── */}
      <Card className="mb-4 overflow-hidden border-border/60 shadow-card">
        <button
          onClick={() => !editing && setEditing(true)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Pencil className="h-4 w-4" />
            </span>
            Informações pessoais
          </div>
          {!editing && (
            <span className="rounded-full border border-border/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
              Editar
            </span>
          )}
        </button>

        {!editing ? (
          <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-2 text-sm">
            {[
              { label: "Nome",     value: profile?.nome },
              { label: "Bio",      value: profile?.bio },
              { label: "Email",    value: user?.email },
              { label: "Escola",   value: profile?.universidade },
              { label: "Curso",    value: profile?.curso },
              { label: "Ano",      value: profile?.ano },
            ].map((row) => row.value ? (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground w-20 shrink-0">{row.label}</span>
                <span className="font-medium text-right">{row.value}</span>
              </div>
            ) : null)}
          </div>
        ) : (
          <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" placeholder="Conta um pouco sobre ti..." />
            </div>
            <p className="text-xs text-muted-foreground">Para trocar a foto, toca no ícone de câmara sobre o avatar.</p>
            <div>
              <Label>Universidade / Escola</Label>
              <div className="mt-1">
                <Combobox options={ESCOLAS} value={universidade} onChange={setUniversidade} placeholder="Selecionar escola…" searchPlaceholder="Pesquisar escola…" emptyMessage="Escola não encontrada." grouped />
              </div>
            </div>
            <div>
              <Label>Curso</Label>
              <div className="mt-1">
                <Combobox options={CURSOS} value={curso} onChange={setCurso} placeholder="Selecionar curso…" searchPlaceholder="Pesquisar curso…" emptyMessage="Curso não encontrado." grouped />
              </div>
            </div>
            <div>
              <Label>Ano / Nível</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar ano…" />
                </SelectTrigger>
                <SelectContent>
                  {["1º Ano","2º Ano","3º Ano","4º Ano","5º Ano","6º Ano",
                    "Internato / Residência","Pós-Graduação","Mestrado","Doutoramento","Já Formado/a"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1 rounded-full bg-gradient-primary">
                <Save className="mr-2 h-4 w-4" /> {saving ? "A guardar…" : "Guardar"}
              </Button>
              <Button onClick={cancelEdit} variant="outline" className="rounded-full px-4">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── PONTOS DETALHE ───────────────────────────────────────────────────── */}
      <Card className="mb-4 border-border/60 shadow-card">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Zap className="h-4 w-4" />
            </span>
            <p className="font-semibold">Os meus pontos</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total (ranking)", value: totais.toLocaleString("pt-PT"), accent: "text-primary" },
              { label: "Disponíveis",     value: disponiveis.toLocaleString("pt-PT"), accent: "text-emerald-600" },
              { label: "Trocados",        value: trocados.toLocaleString("pt-PT"), accent: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/40 p-3 text-center">
                <p className={`font-display text-lg font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── OS MEUS PLANOS ───────────────────────────────────────────────────── */}
      <Card className="mb-4 overflow-hidden border-border/60 shadow-card">
        <button
          onClick={() => setPlansOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <CreditCard className="h-4 w-4" />
            </span>
            Os meus planos
            {plans.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{plans.length}</span>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", plansOpen && "rotate-180")} />
        </button>
        {plansOpen && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3">
            {plans.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground flex items-center gap-3">
                Nenhum plano pago activo.
                <Button asChild variant="link" size="sm" className="px-1">
                  <Link to="/concursos">Ver concursos</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {plans.map((p) => (
                  <li key={`${p.concursoId}/${p.categoriaId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-primary/5 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">Expira em {fmtDate(p.expiresAt)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600">Activo</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* ── DEFINIÇÕES ───────────────────────────────────────────────────────── */}
      <Card className="mb-4 divide-y divide-border/40 border-border/60 shadow-card">
        {/* Notificações */}
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              pushStatus === "granted" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              <pushLabel.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">Notificações — {pushLabel.text}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{pushLabel.desc}</p>
            </div>
          </div>
          <Switch
            checked={pushStatus === "granted"}
            disabled={pushStatus === "unsupported" || pushStatus === "denied" || pushStatus === "loading"}
            onCheckedChange={togglePush}
          />
        </div>

        {/* Ocultar conta */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <EyeOff className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold leading-tight">Ocultar do ranking</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {canHide ? "O teu perfil fica invisível para outros." : "Funcionalidade exclusiva para contas pagas."}
                </p>
              </div>
            </div>
            <Switch checked={hidden} disabled={!canHide || togglingHide} onCheckedChange={toggleHidden} />
          </div>
          {!canHide && (
            <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full">
              <Link to="/concursos">
                <Lock className="mr-2 h-3.5 w-3.5" /> Obter acesso para desbloquear
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {/* ── TERMINAR SESSÃO ──────────────────────────────────────────────────── */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full rounded-full text-destructive border-destructive/30 hover:bg-destructive/5 mb-4"
      >
        <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
      </Button>
    </AppShell>
  );
};

export default Perfil;
