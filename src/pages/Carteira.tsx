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
  clearAccessCache,
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
} from "lucide-react";
import { toast } from "sonner";

const IBAN = "AO06005900000251657910155";
const TITULAR = "NANODIGITALONE CONSULT E PREST DE SERV";

type Modal = null | "carregar" | "converter" | "presentear" | "sacar";

const Carteira = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [txs, setTxs] = useState<CoinTx[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!user) return;
    const [b, t] = await Promise.all([coinsService.getBalance(user.id), coinsService.listTransactions()]);
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

  return (
    <AppShell>
      {/* Balance */}
      <Card className="mb-6 overflow-hidden border-border/60 shadow-card">
        <div className="bg-gradient-hero px-6 py-7 text-center text-primary-foreground">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Coins className="h-7 w-7" />
          </div>
          <p className="text-sm/relaxed opacity-90">O meu saldo</p>
          <p className="font-display text-4xl font-extrabold">{saldo.toLocaleString("pt-PT")}</p>
          <p className="text-xs opacity-80">moedas · {saldo.toLocaleString("pt-PT")} AOA</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
          <ActionBtn icon={Plus} label="Carregar" onClick={() => setModal("carregar")} />
          <ActionBtn icon={Repeat} label="Converter" onClick={() => setModal("converter")} />
          <ActionBtn icon={Gift} label="Presentear" onClick={() => setModal("presentear")} />
          <ActionBtn icon={Banknote} label="Sacar" onClick={() => setModal("sacar")} />
        </div>
      </Card>

      {/* Rules */}
      <Card className="mb-6 p-4 shadow-card border-border/60">
        <p className="mb-2 text-sm font-semibold">Como funciona</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• 1.000 AOA = 1.000 moedas (carregamento por transferência).</li>
          <li>• 1.000 pontos = 200 moedas (conversão).</li>
          <li>• Saque mínimo: 2.000 moedas = 2.000 AOA, pago no seu IBAN.</li>
          <li>• Pode oferecer moedas ou pagar o acesso completo de um amigo.</li>
        </ul>
      </Card>

      {/* History */}
      <Card className="mb-6 p-4 shadow-card border-border/60">
        <p className="mb-3 text-sm font-semibold">Histórico</p>
        {txs.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">Sem movimentos ainda.</p>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      t.amount >= 0 ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {t.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.descricao || t.tipo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-bold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

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

const ActionBtn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 bg-card py-4 text-xs font-medium transition-colors hover:bg-muted/50"
  >
    <Icon className="h-5 w-5 text-primary" />
    {label}
  </button>
);

/* ---------- Carregar (top-up via IBAN) ---------- */
const CarregarModal = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("1000");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const copiarIban = async () => {
    await navigator.clipboard.writeText(IBAN.replace(/^AO06/, ""));
    toast.success("IBAN copiado (sem o AO06)");
  };

  const enviar = async () => {
    const val = parseInt(amount, 10);
    if (!val || val < 500) return toast.error("Valor mínimo 500 AOA");
    if (!file) return toast.error("Anexe o comprovativo");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máximo 5MB");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carregar moedas</DialogTitle>
          <DialogDescription>1 AOA = 1 moeda. Transfira e envie o comprovativo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-3 text-sm">
            <p className="font-semibold">{TITULAR}</p>
            <button onClick={copiarIban} className="mt-1 flex items-center gap-2 text-primary">
              <Copy className="h-4 w-4" /> {IBAN}
            </button>
          </div>
          <div>
            <Label>Valor transferido (AOA)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Receberá {parseInt(amount || "0", 10) || 0} moedas.</p>
          </div>
          <div>
            <Label>Comprovativo</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1"
            />
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

/* ---------- Converter pontos ---------- */
const ConverterModal = ({
  pontos,
  busy,
  setBusy,
  onClose,
  onDone,
}: {
  pontos: number;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onDone: () => void;
}) => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Converter pontos em moedas</DialogTitle>
          <DialogDescription>1.000 pontos = 200 moedas. Tem {pontos.toLocaleString("pt-PT")} pontos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pontos a converter (múltiplo de 1000)</Label>
            <Input type="number" step={1000} min={1000} max={max} value={pts} onChange={(e) => setPts(e.target.value)} className="mt-1" />
          </div>
          <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm">
            Receberá <span className="font-bold text-primary">{moedas}</span> moedas.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={go} disabled={busy || moedas <= 0} className="w-full rounded-full bg-gradient-primary">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Converter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Presentear amigo ---------- */
const PresentearModal = ({
  saldo,
  friends,
  busy,
  setBusy,
  onClose,
  onDone,
}: {
  saldo: number;
  friends: FriendRow[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onDone: () => void;
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
    toast.success("Moedas enviadas! 🎉");
    onDone();
    onClose();
  };

  const sendAccess = async () => {
    if (!friend) return toast.error("Escolha um amigo");
    if (!concurso || !categoria) return toast.error("Escolha o concurso e a categoria");
    if (cost > saldo) return toast.error(`Precisa de ${cost} moedas`);
    setBusy(true);
    const r = await coinsService.giftAccess(friend, concurso, categoria);
    setBusy(false);
    if (!r.ok) return toast.error("Não foi possível oferecer o acesso");
    toast.success("Acesso oferecido ao amigo! 🎁");
    onDone();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Presentear um amigo</DialogTitle>
          <DialogDescription>Envie moedas ou pague o acesso completo de um amigo.</DialogDescription>
        </DialogHeader>

        <div className="mb-1 grid grid-cols-2 gap-1 rounded-full bg-muted/60 p-1 text-sm">
          <button
            onClick={() => setTab("moedas")}
            className={`rounded-full py-1.5 font-medium ${tab === "moedas" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            Moedas
          </button>
          <button
            onClick={() => setTab("acesso")}
            className={`rounded-full py-1.5 font-medium ${tab === "acesso" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            Acesso completo
          </button>
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
                  <SelectItem key={f.friend_id} value={f.friend_id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tab === "moedas" ? (
            <div>
              <Label>Quantidade de moedas</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
          ) : (
            <>
              <div>
                <Label>Concurso</Label>
                <Select
                  value={concurso}
                  onValueChange={(v) => {
                    setConcurso(v);
                    setCategoria("");
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolher concurso" />
                  </SelectTrigger>
                  <SelectContent>
                    {concursos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} disabled={!concurso}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolher categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm">
                Custo: <span className="font-bold text-primary">{cost}</span> moedas (4 meses de acesso).
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={tab === "moedas" ? sendCoins : sendAccess}
            disabled={busy}
            className="w-full rounded-full bg-gradient-primary"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tab === "moedas" ? "Enviar moedas" : "Oferecer acesso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Sacar ---------- */
const SacarModal = ({
  saldo,
  iban,
  busy,
  setBusy,
  onClose,
  onDone,
}: {
  saldo: number;
  iban: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [moedas, setMoedas] = useState(String(Math.max(COIN_RULES.minWithdrawCoins, 0)));
  const [ibanVal, setIbanVal] = useState(iban || "");
  const m = parseInt(moedas || "0", 10) || 0;

  const go = async () => {
    if (m < COIN_RULES.minWithdrawCoins) return toast.error("Saque mínimo: 2.000 moedas");
    if (m > saldo) return toast.error("Saldo insuficiente");
    if (ibanVal.trim().length < 10) return toast.error("IBAN inválido");
    setBusy(true);
    const r = await coinsService.requestWithdrawal(m, ibanVal.trim());
    setBusy(false);
    if (!r.ok) return toast.error(r.error === "min_2000" ? "Saque mínimo: 2.000 moedas" : "Não foi possível pedir o saque");
    toast.success("Pedido de saque enviado! Será pago no seu IBAN.");
    onDone();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sacar para o IBAN</DialogTitle>
          <DialogDescription>Mínimo 2.000 moedas (= 2.000 AOA). Saldo: {saldo} moedas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Moedas a sacar</Label>
            <Input type="number" min={COIN_RULES.minWithdrawCoins} value={moedas} onChange={(e) => setMoedas(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Receberá {m} AOA no seu IBAN.</p>
          </div>
          <div>
            <Label>O seu IBAN</Label>
            <Input value={ibanVal} onChange={(e) => setIbanVal(e.target.value)} placeholder="AO06..." className="mt-1" />
          </div>
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
