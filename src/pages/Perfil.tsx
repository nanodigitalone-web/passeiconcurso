import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
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
import { AREAS, slugify } from "@/data/disciplinas";
import { ESCOLAS, escolaByValue } from "@/data/escolas";
import { CURSOS, cursoByValue } from "@/data/cursos";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Check, CreditCard, EyeOff, Lock, LogOut, Save, Bell, BellOff,
  BellRing, Coins, ChevronRight, ChevronDown, Gift, Pencil, X, UserCheck, Users
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Perfil = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const { status: pushStatus, toggle: togglePush } = usePushNotifications();
  const navigate = useNavigate();

  // --- edit mode ---
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [universidade, setUniversidade] = useState("");
  const [curso, setCurso] = useState("");
  const [ano, setAno] = useState("");
  const [saving, setSaving] = useState(false);

  // --- other state ---
  const [hidden, setHidden] = useState(false);
  const [canHide, setCanHide] = useState(false);
  const [togglingHide, setTogglingHide] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [plans, setPlans] = useState<
    { concursoId: string; categoriaId: string; nome: string; expiresAt: number | null }[]
  >([]);
  const [followStats, setFollowStats] = useState<{ followers: number; following: number } | null>(null);

  const pushLabel =
    {
      granted:     { icon: BellRing, text: "Activas",       desc: "Recebe lembretes de estudo no dispositivo." },
      denied:      { icon: BellOff,  text: "Bloqueadas",    desc: "A permissão foi negada no browser." },
      prompt:      { icon: Bell,     text: "Desactivadas",  desc: "Activa para receber lembretes de estudo." },
      unsupported: { icon: BellOff,  text: "Não suportado", desc: "O teu dispositivo/browser não suporta notificações." },
      loading:     { icon: Bell,     text: "A verificar…",  desc: "" },
    }[pushStatus] ?? { icon: Bell, text: "Desactivadas", desc: "Activa para receber lembretes de estudo." };

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setBio(profile.bio || "");
      setAvatar(profile.avatar_url || "");
      setHidden(!!profile.hidden);
      const uniMatch = ESCOLAS.find(
        (e) => e.label === profile.universidade || e.value === profile.universidade
      );
      setUniversidade(uniMatch?.value ?? profile.universidade ?? "");
      const cursoMatch = CURSOS.find(
        (c) => c.label === profile.curso || c.value === profile.curso
      );
      setCurso(cursoMatch?.value ?? profile.curso ?? "");
      setAno(profile.ano || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) accessService.hasAnyPaidAccess(user.id).then(setCanHide);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    accessService.getMyPlans(user.id).then((rows) => {
      setPlans(
        rows.map((r) => ({
          ...r,
          nome: quizService.getCategoria(r.concursoId, r.categoriaId)?.nome ?? r.categoriaId,
        }))
      );
    });
  }, [user]);

  // Fetch follower/following counts from public profile endpoint
  useEffect(() => {
    if (!user) return;
    api.get<{ followers_count: number; following_count: number }>(`/profile/${user.id}`)
      .then((p) => setFollowStats({ followers: p.followers_count, following: p.following_count }))
      .catch(() => {});
  }, [user]);

  const groupedInteresses = useMemo(() => {
    const ids = new Set(profile?.interesses ?? []);
    if (ids.size === 0) return [];
    return AREAS.flatMap((a) => {
      const selecionadas = a.disciplinas
        .map((nome) => ({ id: slugify(nome), nome }))
        .filter(({ id }) => ids.has(id));
      return selecionadas.length > 0 ? [{ area: a.area, disciplinas: selecionadas }] : [];
    });
  }, [profile?.interesses]);

  const fmtDate = (ms: number | null) =>
    ms === null
      ? "Vitalício"
      : new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const uniLabel = (escolaByValue(universidade)?.label ?? universidade) || null;
    const cursoLabel = (cursoByValue(curso)?.label ?? curso) || null;
    const { error } = await authService.updateProfile(user.id, {
      nome, bio, avatar_url: avatar || null,
      universidade: uniLabel, curso: cursoLabel, ano: ano || null,
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
      setAvatar(profile.avatar_url || "");
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
    if (error) {
      setHidden(!value);
      return toast.error("Erro ao atualizar privacidade");
    }
    await refreshProfile();
    toast.success(value ? "A sua conta está oculta no ranking" : "A sua conta voltou a ser pública");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const disponiveis = profile?.pontos ?? 0;
  const totais = profile?.pontos_globais ?? disponiveis;
  const trocados = Math.max(0, totais - disponiveis);

  return (
    <AppShell>
      {/* ── Hero card ── */}
      <Card className="mb-5 overflow-hidden border-border/60 shadow-card">
        <div className="relative h-28 bg-gradient-hero">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_120%,white,transparent_45%)]" />
        </div>
        <div className="px-5 pb-5 -mt-12">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-elegant">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display font-bold">
                {profile?.nome?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <h1 className="mt-3 font-display text-xl font-bold">{profile?.nome || "Utilizador"}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {profile?.categoria_nome && (
              <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {profile.categoria_nome}
              </span>
            )}
          </div>

          {/* Pontos + stats */}
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-primary/5 p-4 text-center">
              <p className="font-display text-3xl font-bold text-primary">{totais.toLocaleString("pt-PT")}</p>
              <p className="text-xs text-muted-foreground">Pontos totais · contam no ranking</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Disponíveis", value: disponiveis.toLocaleString("pt-PT") },
                { label: "Trocados",    value: trocados.toLocaleString("pt-PT") },
                { label: "Sequência",   value: String(profile?.streak || 0) },
              ].map((s) => (
                <div key={s.label} className="col-span-1 rounded-2xl bg-muted/40 p-3 text-center">
                  <p className="font-display text-base font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
              {/* Seguidores */}
              <Link to={`/perfil/${user?.id}`} className="col-span-1">
                <div className="rounded-2xl bg-primary/5 p-3 text-center">
                  <p className="font-display text-base font-bold text-primary">
                    {followStats?.followers ?? "–"}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Seguidores</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Carteira ── */}
      <Link to="/carteira" className="mb-4 block">
        <Card className="flex items-center justify-between gap-3 p-4 shadow-card border-border/60 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">A minha carteira</p>
              <p className="text-xs text-muted-foreground">
                {(profile?.moedas ?? 0).toLocaleString("pt-PT")} moedas · carregar, presentear e sacar
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      {/* ── Seguir ── */}
      <Link to={`/perfil/${user?.id}`} className="mb-4 block">
        <Card className="flex items-center justify-between gap-3 p-4 shadow-card border-border/60 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Seguidores e a seguir</p>
              <p className="text-xs text-muted-foreground">
                {followStats ? `${followStats.followers} seguidores · ${followStats.following} a seguir` : "Ver perfil público"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      {/* ── Áreas de interesse ── */}
      <Card className="mb-4 border-border/60 shadow-card">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <p className="font-semibold">Áreas de interesse</p>
          </div>
          <Link
            to="/interesses"
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Pencil className="h-3 w-3" /> Editar
          </Link>
        </div>
        <div className="px-4 pb-4">
          {groupedInteresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma área selecionada.{" "}
                <Link to="/interesses" className="font-medium text-primary underline-offset-2 hover:underline">
                  Personalizar agora
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedInteresses.map(({ area, disciplinas }) => (
                <div key={area}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {area}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {disciplinas.map((d) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        <Check className="h-3 w-3 shrink-0" />
                        {d.nome}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── Partilhar ── */}
      <Link to="/partilhar" className="mb-4 block">
        <Card className="flex items-center justify-between gap-3 p-4 shadow-card border-border/60 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Partilhar & Convidar</p>
              <p className="text-xs text-muted-foreground">Convida amigos (+100 pontos), banner e certificado</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      {/* ── Informações pessoais (edit mode toggle) ── */}
      <Card className="mb-4 overflow-hidden border-border/60 shadow-card">
        <button
          onClick={() => !editing && setEditing(true)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Pencil className="h-4 w-4 text-primary" /> Informações pessoais
          </div>
          {!editing && (
            <span className="rounded-full border border-border/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
              Editar
            </span>
          )}
        </button>

        {/* View mode */}
        {!editing && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-2 text-sm">
            <div className="flex items-start justify-between">
              <span className="text-muted-foreground w-28 shrink-0">Nome</span>
              <span className="font-medium text-right">{profile?.nome || "—"}</span>
            </div>
            {profile?.bio && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground w-28 shrink-0">Bio</span>
                <span className="font-medium text-right">{profile.bio}</span>
              </div>
            )}
            {profile?.universidade && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground w-28 shrink-0">Escola</span>
                <span className="font-medium text-right">{profile.universidade}</span>
              </div>
            )}
            {profile?.curso && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground w-28 shrink-0">Curso</span>
                <span className="font-medium text-right">{profile.curso}</span>
              </div>
            )}
            {profile?.ano && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground w-28 shrink-0">Ano</span>
                <span className="font-medium text-right">{profile.ano}</span>
              </div>
            )}
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" placeholder="Conte um pouco sobre você..." />
            </div>
            <div>
              <Label htmlFor="avatar">URL do Avatar</Label>
              <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="mt-1" placeholder="https://..." />
            </div>
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
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                  <SelectItem value="4º Ano">4º Ano</SelectItem>
                  <SelectItem value="5º Ano">5º Ano</SelectItem>
                  <SelectItem value="6º Ano">6º Ano</SelectItem>
                  <SelectItem value="Internato / Residência">Internato / Residência</SelectItem>
                  <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
                  <SelectItem value="Mestrado">Mestrado</SelectItem>
                  <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                  <SelectItem value="Já Formado/a">Já Formado/a</SelectItem>
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

      {/* ── Os meus planos (accordion) ── */}
      <Card className="mb-4 overflow-hidden border-border/60 shadow-card">
        <button
          onClick={() => setPlansOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-4 w-4 text-primary" /> Os meus planos
            {plans.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {plans.length}
              </span>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", plansOpen && "rotate-180")} />
        </button>

        {plansOpen && (
          <div className="border-t border-border/40 px-4 pb-4 pt-3">
            {plans.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                Ainda não tem nenhum plano pago activo.
                <Button asChild variant="link" size="sm" className="px-1">
                  <Link to="/concursos">Ver concursos</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {plans.map((p) => (
                  <li
                    key={`${p.concursoId}/${p.categoriaId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-primary/5 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">Expira em {fmtDate(p.expiresAt)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                      Activo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* ── Notificações ── */}
      <Card className="mb-4 p-4 shadow-card border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              {pushStatus === "granted" ? <BellRing className="h-4 w-4 text-primary" />
                : pushStatus === "denied" || pushStatus === "unsupported" ? <BellOff className="h-4 w-4 text-muted-foreground" />
                : <Bell className="h-4 w-4 text-primary" />}
              Notificações — {pushLabel.text}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{pushLabel.desc}</p>
          </div>
          <Switch
            checked={pushStatus === "granted"}
            disabled={pushStatus === "unsupported" || pushStatus === "denied" || pushStatus === "loading"}
            onCheckedChange={togglePush}
          />
        </div>
      </Card>

      {/* ── Ocultar conta ── */}
      <Card className="mb-6 p-4 shadow-card border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              <EyeOff className="h-4 w-4 text-primary" /> Ocultar a minha conta
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Quando activo, o seu perfil deixa de aparecer no ranking para os outros utilizadores.
            </p>
            {!canHide && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-warning">
                <Lock className="h-3 w-3" /> Funcionalidade paga — exclusiva para contas com acesso pago.
              </p>
            )}
          </div>
          <Switch
            checked={hidden}
            disabled={!canHide || togglingHide}
            onCheckedChange={toggleHidden}
          />
        </div>
        {!canHide && (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full">
            <Link to="/concursos">Obter acesso para desbloquear</Link>
          </Button>
        )}
      </Card>

      <Button variant="outline" onClick={handleSignOut} className="w-full rounded-full text-destructive border-destructive/30 hover:bg-destructive/5">
        <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
      </Button>
    </AppShell>
  );
};

export default Perfil;
