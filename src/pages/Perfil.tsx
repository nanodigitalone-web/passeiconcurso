import { useEffect, useState } from "react";
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
import { CreditCard, EyeOff, Lock, LogOut, Save, Bell, BellOff, BellRing, Coins, ChevronRight, Gift } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

const Perfil = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const { status: pushStatus, toggle: togglePush } = usePushNotifications();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [canHide, setCanHide] = useState(false);
  const [togglingHide, setTogglingHide] = useState(false);
  const [plans, setPlans] = useState<
    { concursoId: string; categoriaId: string; nome: string; expiresAt: number | null }[]
  >([]);

  const pushLabel =
    {
      granted: { icon: BellRing, text: "Activas", desc: "Recebe lembretes de estudo no dispositivo." },
      denied: { icon: BellOff, text: "Bloqueadas", desc: "A permissão foi negada no browser." },
      prompt: { icon: Bell, text: "Desactivadas", desc: "Activa para receber lembretes de estudo." },
      unsupported: { icon: BellOff, text: "Não suportado", desc: "O teu dispositivo/browser não suporta notificações." },
      loading: { icon: Bell, text: "A verificar...", desc: "" },
    }[pushStatus] ?? { icon: Bell, text: "Desactivadas", desc: "Activa para receber lembretes de estudo." };

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setBio(profile.bio || "");
      setAvatar(profile.avatar_url || "");
      setHidden(!!profile.hidden);
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
          nome:
            quizService.getCategoria(r.concursoId, r.categoriaId)?.nome ??
            r.categoriaId,
        }))
      );
    });
  }, [user]);

  const fmtDate = (ms: number | null) =>
    ms === null
      ? "Vitalício"
      : new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await authService.updateProfile(user.id, { nome, bio, avatar_url: avatar || null });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar perfil");
    await refreshProfile();
    toast.success("Perfil atualizado!");
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

  return (
    <AppShell>
      <Card className="mb-6 overflow-hidden border-border/60 shadow-card">
        <div className="relative h-28 bg-gradient-hero">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_120%,white,transparent_45%)]" />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-elegant">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display font-bold">
                {nome?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <h1 className="mt-3 font-display text-xl font-bold">{nome || "Utilizador"}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {profile?.categoria_nome && (
              <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {profile.categoria_nome}
              </span>
            )}
          </div>

          {(() => {
            const disponiveis = profile?.pontos ?? 0;
            const totais = profile?.pontos_globais ?? disponiveis;
            const trocados = Math.max(0, totais - disponiveis);
            return (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-primary/5 p-4 text-center">
                  <p className="font-display text-3xl font-bold text-primary">{totais.toLocaleString("pt-PT")}</p>
                  <p className="text-xs text-muted-foreground">Pontos totais · contam no ranking</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-muted/40 p-3 text-center">
                    <p className="font-display text-lg font-bold">{disponiveis.toLocaleString("pt-PT")}</p>
                    <p className="text-[11px] text-muted-foreground">Disponíveis</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3 text-center">
                    <p className="font-display text-lg font-bold">{trocados.toLocaleString("pt-PT")}</p>
                    <p className="text-[11px] text-muted-foreground">Trocados</p>
                  </div>
                  <div className="rounded-2xl bg-accent/5 p-3 text-center">
                    <p className="font-display text-lg font-bold text-accent">{profile?.streak || 0}🔥</p>
                    <p className="text-[11px] text-muted-foreground">Sequência</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>

      <Link to="/carteira" className="mb-6 block">
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

      <Link to="/partilhar" className="mb-6 block">
        <Card className="flex items-center justify-between gap-3 p-4 shadow-card border-border/60 transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Partilhar & Convidar</p>
              <p className="text-xs text-muted-foreground">
                Convida amigos (+100 pontos), banner e certificado
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>



      <Card className="mb-6 p-6 shadow-card border-border/60">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Save className="h-4 w-4 text-primary" /> Informações pessoais
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" placeholder="Conte um pouco sobre você..." />
          </div>
          <Button onClick={save} disabled={saving} className="w-full rounded-full bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </Card>




      <Card className="mb-6 p-4 shadow-card border-border/60">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <CreditCard className="h-4 w-4 text-primary" /> Os meus planos
        </div>
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
                  <p className="text-xs text-muted-foreground">
                    Expira em {fmtDate(p.expiresAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                  Activo
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-6 p-4 shadow-card border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              {pushStatus === "granted" ? (
                <BellRing className="h-4 w-4 text-primary" />
              ) : pushStatus === "denied" || pushStatus === "unsupported" ? (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bell className="h-4 w-4 text-primary" />
              )}
              Notificações no dispositivo — {pushLabel.text}
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

      <Card className="mb-6 p-4 shadow-card border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              <EyeOff className="h-4 w-4 text-primary" /> Ocultar a minha conta
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Quando activo, o seu perfil deixa de aparecer no ranking para os outros utilizadores. Continuará visível apenas para si.
            </p>
            {!canHide && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-warning">
                <Lock className="h-3 w-3" /> Funcionalidade paga — 500 AOA. Exclusiva para contas com acesso pago.
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
