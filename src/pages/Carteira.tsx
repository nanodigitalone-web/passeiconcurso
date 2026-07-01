import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  coinsService,
  COIN_RULES,
  friendsService,
  quizService,
  paymentsService,
  type CoinTx,
  type FriendRow,
} from "@/services";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Repeat,
  Banknote,
  Upload,
  Loader2,
  Copy,
  Plus,
  Zap,
  TrendingUp,
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const IBAN = "AO06005900000251657910155";
const TITULAR = "NANODIGITALONE CONSULT E PREST DE SERV";

type Modal = null | "carregar" | "converter" | "presentear" | "sacar";

// ── Transaction type metadata ─────────────────────────────────────────────────
const TX_META: Record<string, { label: string; color: string; bg: string }> = {
  topup:          { label: "Carregamento",   color: "text-emerald-700", bg: "bg-emerald-100" },
  convert:        { label: "Conversão",      color: "text-blue-700",   bg: "bg-blue-100"   },
  gift_sent:      { label: "Oferta enviada", color: "text-orange-700", bg: "bg-orange-100" },
  gift_received:  { label: "Oferta recebida",color: "text-emerald-700",bg: "bg-emerald-100"},
  gift_access:    { label: "Acesso oferec.", color: "text-orange-700", bg: "bg-orange-100" },
  purchase_access:{ label: "Acesso comprado",color: "text-purple-700", bg: "bg-purple-100" },
  withdrawal:     { label: "Saque",          color: "text-red-700",    bg: "bg-red-100"    },
  hide_account:   { label: "Conta ocultada", color: "text-slate-600",  bg: "bg-slate-100"  },
};

const txMeta = (tipo: string) =>
  TX_META[tipo] ?? { label: tipo, color: "text-foreground", bg: "bg-muted" };

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPI = ({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) => (
  <Card className="flex items-start gap-3 border-border/60 p-4 shadow-card">
    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </Card>
);

// ── Action card ───────────────────────────────────────────────────────────────
const ActionCard = ({
  icon: Icon,
  label,
  description,
  accent,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  accent: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex w-full flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-card transition-all hover:shadow-elegant hover:border-primary/30 hover:-translate-y-0.5"
  >
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent} transition-transform group-hover:scale-110`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-display font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground leading-snug">{description}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground self-end mt-auto" />
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const Carteira = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [txs, setTxs] = useState<CoinTx[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!user) return;
    const [b, t] = await Promise.all([
      coinsService.getBalance(user.id),
      coinsService.listTransactions(),
    ]);
    setSaldo(b);
    setTxs(t);
    refreshProfile();
  };

  useEffect(() => {
    reload();
    friendsService.list().then((f) => setFriends(f.filter((x) => x.status === "accepted")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const pontos = profile?.pontos ?? 0;
  const pontosGlobais = profile?.pontos_globais ?? 0;

  return (
    <AppShell>
      {/* ── Page Title ──────────────────────────────────────────────────────── */}
      <div className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Carteira</h1>
        <p className="text-sm text-muted-foreground">Gerencie as suas moedas e pontos</p>
      </div>

      {/* ── Credit-card style hero (dourado) ────────────────────────────────── */}
      <div className="relative mb-5 overflow-hidden rounded-3xl p-6 text-white shadow-elegant animate-fade-in" style={{ background: "linear-gradient(135deg, #92700a 0%, #c9960c 30%, #f5c518 55%, #d4a017 75%, #8b6008 100%)" }}>
        {/* Top row */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.75)" }}>Passei Wallet</p>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>{profile?.nome ?? "Utilizador"}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.18)" }}>
            <Coins className="h-7 w-7" style={{ color: "rgba(255,255,255,0.95)" }} />
          </div>
        </div>

        {/* Balance */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>Saldo disponível</p>
          <p className="mt-1 font-display text-4xl font-extrabold leading-none tracking-tight" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
            {saldo.toLocaleString("pt-PT")}
            <span className="ml-2 text-xl font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>moedas</span>
          </p>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>≡ {saldo.toLocaleString("pt-PT")} AOA</p>
        </div>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 translate-x-16 -translate-y-12 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="pointer-events-none absolute right-12 top-10 h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }} />
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 border-border/60 p-3 shadow-card text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(245,197,24,0.18)" }}>
            <Coins className="h-5 w-5" style={{ color: "#b8860b" }} />
          </div>
          <p className="font-display text-lg font-bold leading-tight" style={{ color: "#92700a" }}>{saldo.toLocaleString("pt-PT")}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">Moedas</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 border-border/60 p-3 shadow-card text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Zap className="h-5 w-5" />
          </div>
          <p className="font-display text-lg font-bold leading-tight">{pontos.toLocaleString("pt-PT")}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">Pontos</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 border-border/60 p-3 shadow-card text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="font-display text-lg font-bold leading-tight">{pontosGlobais.toLocaleString("pt-PT")}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">Total vida</p>
        </Card>
      </div>

      {/* ── Action cards grid ────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <ActionCard
          icon={Plus}
          label="Carregar"
          description="Transferência bancária IBAN"
          accent="bg-emerald-100 text-emerald-700"
          onClick={() => setModal("carregar")}
        />
        <ActionCard
          icon={Repeat}
          label="Converter"
          description={`${COIN_RULES.pointsPerCoinUnit} pts → ${COIN_RULES.coinsPerUnit} moedas`}
          accent="bg-blue-100 text-blue-700"
          onClick={() => setModal("converter")}
        />
        <ActionCard
          icon={Gift}
          label="Presentear"
          description="Envie moedas ou acesso a um amigo"
          accent="bg-orange-100 text-orange-700"
          onClick={() => setModal("presentear")}
        />
        <ActionCard
          icon={Banknote}
          label="Sacar"
          description={`Mín. ${COIN_RULES.minWithdrawCoins.toLocaleString("pt-PT")} moedas`}
          accent="bg-red-100 text-red-700"
          onClick={() => setModal("sacar")}
        />
      </div>

      {/* ── Como funciona ────────────────────────────────────────────────────── */}
      <Card className="mb-5 border-border/60 p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Como funciona</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: "💳", text: "1.000 AOA = 1.000 moedas por transferência bancária" },
            { icon: "⚡", text: `1.000 pontos = ${COIN_RULES.coinsPerUnit} moedas por conversão` },
            { icon: "💸", text: `Saque mínimo: ${COIN_RULES.minWithdrawCoins.toLocaleString("pt-PT")} moedas (= ${COIN_RULES.minWithdrawCoins.toLocaleString("pt-PT")} AOA)` },
            { icon: "🎁", text: "Pode oferecer moedas ou acesso completo a amigos" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
              <span className="text-base leading-none mt-0.5">{r.icon}</span>
              <p className="text-sm text-muted-foreground leading-snug">{r.text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Transaction history ───────────────────────────────────────────────── */}
      <Card className="mb-8 border-border/60 p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(245,197,24,0.18)" }}>
              <Coins className="h-4 w-4" style={{ color: "#b8860b" }} />
            </div>
            <h2 className="font-display font-semibold">Histórico de movimentos</h2>
          </div>
          <span className="text-xs text-muted-foreground">{txs.length} mov.</span>
        </div>

        {txs.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 px-4 py-8 text-center">
            <Coins className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Ainda sem movimentos. Começa por carregar a carteira.</p>
            <Button
              onClick={() => setModal("carregar")}
              size="sm"
              className="mt-4 rounded-full bg-gradient-primary"
            >
              Carregar agora
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => {
              const meta = txMeta(t.tipo);
              const isIn = t.amount > 0;
              const date = new Date(t.created_at).toLocaleDateString("pt-PT", {
                day: "2-digit", month: "short", year: "numeric",
              });
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-colors hover:bg-muted/30"
                >
                  {/* Direction icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isIn ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {isIn
                      ? <ArrowDownLeft className="h-5 w-5" />
                      : <ArrowUpRight className="h-5 w-5" />}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{t.descricao || meta.label}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>

                  {/* Amount */}
                  <span className={`shrink-0 font-display text-base font-bold ${isIn ? "text-emerald-600" : "text-red-600"}`}>
                    {isIn ? "+" : ""}{t.amount.toLocaleString("pt-PT")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === "carregar" && <CarregarModal onClose={() => setModal(null)} onDone={reload} />}
      {modal === "converter" && (
        <ConverterModal pontos={pontos} busy={busy} setBusy={setBusy} onClose={() => setModal(null)} onDone={reload} />
      )}
      {modal === "presentear" && (
        <PresentearModal
          saldo={saldo}
          friends={friends}
          busy={busy}
          setBusy={setBusy}
          onClose={() => setModal(null)}
          onDone={reload}
        />
      )}
      {modal === "sacar" && (
        <SacarModal
          saldo={saldo}
          iban={profile?.iban ?? ""}
          busy={busy}
          setBusy={setBusy}
          onClose={() => setModal(null)}
          onDone={reload}
        />
      )}
    </AppShell>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Carregar (top-up via IBAN)
───────────────────────────────────────────────────────────────────────────── */
const CarregarModal = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("1000");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const copiarIban = async () => {
    await navigator.clipboard.writeText(IBAN);
    toast.success("IBAN copiado");
  };

  const enviar = async () => {
    const val = parseInt(amount, 10);
    if (!val || val < 500) return toast.error("Valor mínimo 500 AOA");
    if (!file) return toast.error("Anexe o comprovativo");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máximo 5 MB");
    setUploading(true);
    try {
      const path = await paymentsService.uploadComprovativo(user!.id, file);
      await coinsService.createTopupRequest({
        userId: user!.id,
        email: user!.email ?? "",
        amountAoa: val,
        comprovativoPath: path,
      });
      toast.success("Pedido enviado! As moedas serão creditadas após aprovação.");
      onDone();
      onClose();
    } catch {
      toast.error("Erro ao enviar pedido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" /> Carregar moedas
          </DialogTitle>
          <DialogDescription>1 AOA = 1 moeda. Transfira e envie o comprovativo.</DialogDescription>
        </DialogHeader>

        {/* IBAN box */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-1">Titular</p>
          <p className="text-sm font-semibold text-emerald-900">{TITULAR}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">IBAN</p>
              <p className="font-mono text-sm font-semibold text-emerald-900">{IBAN}</p>
            </div>
            <Button size="sm" variant="outline" onClick={copiarIban} className="shrink-0 gap-1.5 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-100">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Valor transferido (AOA)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              Receberá <span className="font-semibold text-emerald-600">{parseInt(amount || "0", 10) || 0} moedas</span>.
            </p>
          </div>
          <div>
            <Label>Comprovativo de transferência</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={enviar} disabled={uploading} className="w-full rounded-full bg-gradient-primary">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Enviar comprovativo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Converter pontos
───────────────────────────────────────────────────────────────────────────── */
const ConverterModal = ({
  pontos, busy, setBusy, onClose, onDone,
}: { pontos: number; busy: boolean; setBusy: (b: boolean) => void; onClose: () => void; onDone: () => void }) => {
  const max = Math.floor(pontos / COIN_RULES.pointsPerCoinUnit) * COIN_RULES.pointsPerCoinUnit;
  const [pts, setPts] = useState(String(Math.min(1000, max)));
  const p = parseInt(pts || "0", 10) || 0;
  const moedas = (Math.floor(p / 1000) || 0) * COIN_RULES.coinsPerUnit;

  const go = async () => {
    setBusy(true);
    const r = await coinsService.convertPoints(p);
    setBusy(false);
    if (!r.ok) return toast.error(r.error === "insufficient_points" ? "Pontos insuficientes" : "Valor inválido (múltiplo de 1000)");
    toast.success(`Convertido! +${r.moedas} moedas`);
    onDone();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" /> Converter pontos em moedas
          </DialogTitle>
          <DialogDescription>
            {COIN_RULES.pointsPerCoinUnit} pontos = {COIN_RULES.coinsPerUnit} moedas. Tens <span className="font-semibold">{pontos.toLocaleString("pt-PT")}</span> pontos disponíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Pontos a converter (múltiplo de 1.000)</Label>
            <Input type="number" step={1000} min={1000} max={max} value={pts} onChange={(e) => setPts(e.target.value)} className="mt-1" />
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-xs text-blue-700 font-medium mb-0.5">Receberá</p>
            <p className="font-display text-3xl font-bold text-blue-700">{moedas}</p>
            <p className="text-xs text-blue-600">moedas</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={go} disabled={busy || moedas <= 0} className="w-full rounded-full bg-gradient-primary">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Converter {p > 0 ? `${p.toLocaleString("pt-PT")} pontos` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Presentear amigo
───────────────────────────────────────────────────────────────────────────── */
const PresentearModal = ({
  saldo, friends, busy, setBusy, onClose, onDone,
}: {
  saldo: number; friends: FriendRow[]; busy: boolean;
  setBusy: (b: boolean) => void; onClose: () => void; onDone: () => void;
}) => {
  const [tab, setTab] = useState<"moedas" | "acesso">("moedas");
  const [friend, setFriend] = useState("");
  const [amount, setAmount] = useState("100");
  const [concurso, setConcurso] = useState("");
  const [categoria, setCategoria] = useState("");

  const concursos = quizService.getConcursos();
  const cats = concursos.find((c) => c.id === concurso)?.categorias ?? [];
  const cost = concurso === "licenciatura-medicina" ? 2000 : 1000;

  const sendCoins = async () => {
    const val = parseInt(amount, 10);
    if (!friend) return toast.error("Escolha um amigo");
    if (!val || val <= 0) return toast.error("Valor inválido");
    if (val > saldo) return toast.error("Saldo insuficiente");
    setBusy(true);
    const r = await coinsService.giftCoins(friend, val);
    setBusy(false);
    if (!r.ok) return toast.error("Não foi possível enviar");
    toast.success("Moedas enviadas!");
    onDone(); onClose();
  };

  const sendAccess = async () => {
    if (!friend) return toast.error("Escolha um amigo");
    if (!concurso || !categoria) return toast.error("Escolha o concurso e categoria");
    if (cost > saldo) return toast.error(`Precisa de ${cost} moedas`);
    setBusy(true);
    const r = await coinsService.giftAccess(friend, concurso, categoria);
    setBusy(false);
    if (!r.ok) return toast.error("Não foi possível oferecer acesso");
    toast.success("Acesso oferecido!");
    onDone(); onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-orange-600" /> Presentear um amigo
          </DialogTitle>
          <DialogDescription>Envie moedas ou ofereça acesso completo.</DialogDescription>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1 text-sm">
          {(["moedas", "acesso"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl py-2 font-semibold capitalize transition-colors ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              {t === "moedas" ? "Moedas" : "Acesso completo"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <Label>Amigo</Label>
            <Select value={friend} onValueChange={setFriend}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={friends.length ? "Escolher amigo" : "Sem amigos ainda"} />
              </SelectTrigger>
              <SelectContent>
                {friends.map((f) => (
                  <SelectItem key={f.friend_id} value={f.friend_id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tab === "moedas" ? (
            <div>
              <Label>Quantidade de moedas</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
              {parseInt(amount, 10) > saldo && (
                <p className="mt-1 text-xs text-destructive">Saldo insuficiente ({saldo} disponíveis)</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label>Concurso</Label>
                <Select value={concurso} onValueChange={(v) => { setConcurso(v); setCategoria(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher concurso" /></SelectTrigger>
                  <SelectContent>
                    {concursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} disabled={!concurso}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Escolher categoria" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-center">
                <p className="text-xs text-orange-700 mb-0.5">Custo total</p>
                <p className="font-display text-2xl font-bold text-orange-700">{cost}</p>
                <p className="text-xs text-orange-600">moedas · 4 meses de acesso</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={tab === "moedas" ? sendCoins : sendAccess} disabled={busy} className="w-full rounded-full bg-gradient-primary">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tab === "moedas" ? "Enviar moedas" : "Oferecer acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sacar
───────────────────────────────────────────────────────────────────────────── */
const SacarModal = ({
  saldo, iban, busy, setBusy, onClose, onDone,
}: {
  saldo: number; iban: string; busy: boolean;
  setBusy: (b: boolean) => void; onClose: () => void; onDone: () => void;
}) => {
  const [moedas, setMoedas] = useState(String(Math.max(COIN_RULES.minWithdrawCoins, 0)));
  const [ibanVal, setIbanVal] = useState(iban || "");
  const m = parseInt(moedas || "0", 10) || 0;

  const go = async () => {
    if (m < COIN_RULES.minWithdrawCoins) return toast.error(`Saque mínimo: ${COIN_RULES.minWithdrawCoins.toLocaleString("pt-PT")} moedas`);
    if (m > saldo) return toast.error("Saldo insuficiente");
    if (ibanVal.trim().length < 10) return toast.error("IBAN inválido");
    setBusy(true);
    const r = await coinsService.requestWithdrawal(m, ibanVal.trim());
    setBusy(false);
    if (!r.ok) return toast.error(r.error === "min_2000" ? "Saque mínimo: 2.000 moedas" : "Não foi possível pedir o saque");
    toast.success("Pedido de saque enviado! Será pago no IBAN indicado.");
    onDone(); onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-red-600" /> Sacar para o IBAN
          </DialogTitle>
          <DialogDescription>
            Saldo disponível: <span className="font-semibold">{saldo.toLocaleString("pt-PT")} moedas</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Moedas a sacar</Label>
            <Input type="number" min={COIN_RULES.minWithdrawCoins} value={moedas} onChange={(e) => setMoedas(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              Receberá <span className="font-semibold text-red-600">{m.toLocaleString("pt-PT")} AOA</span> no IBAN indicado.
            </p>
          </div>
          <div>
            <Label>O seu IBAN</Label>
            <Input value={ibanVal} onChange={(e) => setIbanVal(e.target.value)} placeholder="AO06..." className="mt-1 font-mono" />
          </div>
          {m < COIN_RULES.minWithdrawCoins && m > 0 && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              Mínimo de {COIN_RULES.minWithdrawCoins.toLocaleString("pt-PT")} moedas para saque.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={go} disabled={busy} className="w-full rounded-full bg-gradient-primary">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Pedir saque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Carteira;
