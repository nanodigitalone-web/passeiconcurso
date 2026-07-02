import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Copy, Landmark, Upload, Loader2, Clock } from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PLAN_NAMES: Record<string, string> = {
  basico: "Básico", pro: "Pro", pro_max: "Pro Max", familia: "Família",
};
const PLAN_PRICES: Record<string, number> = {
  basico: 1000, pro: 2000, pro_max: 3000, familia: 10000,
};

const IBAN = "AO06005900000251657910155";
const TITULAR = "NANODIGITALONE CONSULT E PREST DE SERV";

type Step = "instrucoes" | "comprovativo" | "aguardar";

const PlanoPagamento = () => {
  const { planId } = useParams<{ planId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("instrucoes");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const nome = PLAN_NAMES[planId!] ?? planId;
  const preco = PLAN_PRICES[planId!] ?? 0;

  const copiar = async (txt: string, label = "Copiado") => {
    await navigator.clipboard.writeText(txt);
    toast.success(label);
  };

  const enviar = async () => {
    if (!file) return toast.error("Selecione o comprovativo");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ficheiro deve ter no máximo 5MB");
    const okType = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type);
    if (!okType) return toast.error("Use imagem (JPG/PNG/WEBP) ou PDF");

    setUploading(true);
    try {
      const url = await subscriptionService.uploadComprovativo(file);
      await subscriptionService.subscribe(planId!, url);
      setStep("aguardar");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("already_subscribed")) {
        toast.info("Já tens uma subscrição activa ou pendente.");
        navigate("/meu-plano");
      } else {
        toast.error("Erro ao enviar comprovativo. Tenta novamente.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <button onClick={() => navigate("/planos")} className="mb-3 inline-flex items-center text-sm text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Planos
      </button>

      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Subscrição</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Plano {nome}</h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 font-display text-lg font-bold backdrop-blur-sm">
              {preco.toLocaleString("pt-PT")} Kz
            </span>
            <span className="text-xs opacity-80">30 dias de acesso</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-5 flex items-center gap-2 text-xs">
        {(["instrucoes", "comprovativo", "aguardar"] as Step[]).map((s, i) => {
          const labels = ["Pagamento", "Comprovativo", "Aguardar"];
          const idx = ["instrucoes", "comprovativo", "aguardar"].indexOf(step);
          const done = idx > i;
          const active = step === s;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[10px] ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{labels[i]}</span>
              {i < 2 && <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      {step === "instrucoes" && (
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold">1. Faça o pagamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pague <strong>{preco.toLocaleString("pt-PT")} Kz</strong> por transferência bancária.
              Na descrição escreva o seu <strong>email</strong> para identificarmos.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-primary" /> Transferência Bancária
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">IBAN</p>
                <p className="break-all font-mono text-sm font-bold">{IBAN}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copiar(IBAN.replace(/^AO06/, ""), "IBAN copiado (sem AO06)")}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Titular</p>
                <p className="text-sm font-semibold">{TITULAR}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copiar(TITULAR)}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/40 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mensagem (teu email)</p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate font-mono text-sm font-semibold">{user?.email}</p>
                <Button size="sm" variant="outline" onClick={() => copiar(user?.email ?? "")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor</p>
              <p className="mt-0.5 font-mono text-lg font-bold">{preco.toLocaleString("pt-PT")} Kz</p>
            </div>
          </div>

          <Button onClick={() => setStep("comprovativo")} className="w-full rounded-full font-semibold">
            Já paguei, enviar comprovativo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}

      {step === "comprovativo" && (
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">2. Carregar comprovativo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie a captura de ecrã ou PDF da transferência. Após análise (até 24h),
            o plano será activado e receberás uma notificação.
          </p>
          <div className="mt-4 space-y-3">
            <Label htmlFor="file">Ficheiro (JPG, PNG, WEBP ou PDF · máx. 5MB)</Label>
            <Input id="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={() => setStep("instrucoes")} className="rounded-full">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={enviar} disabled={uploading || !file} className="flex-1 rounded-full font-semibold">
              {uploading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar...</>
                : <><Upload className="mr-2 h-4 w-4" /> Enviar comprovativo</>}
            </Button>
          </div>
        </Card>
      )}

      {step === "aguardar" && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-center text-white shadow-elegant animate-scale-in">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Clock className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold">Comprovativo recebido!</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              A nossa equipa vai validar o pagamento em até 24 horas.
              Receberás uma notificação quando o plano for activado.
            </p>
            <Button asChild size="lg" className="mt-5 w-full rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90">
              <a href="/">Voltar ao início</a>
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
};

export default PlanoPagamento;
