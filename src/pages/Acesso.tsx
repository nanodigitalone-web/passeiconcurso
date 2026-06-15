import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quizService, paymentsService, notificationsService, clearAccessCache } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound, Upload, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";

const IBAN = "AO06005900000251657910155";
const TITULAR = "NANODIGITALONE CONSULT E PREST DE SERV";

type Step = "instrucoes" | "comprovativo" | "codigo" | "concluido";

const Acesso = () => {
  const { concursoId, categoriaId } = useParams();
  const cat = quizService.getCategoria(concursoId!, categoriaId!);
  const concurso = quizService.getConcurso(concursoId!);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("instrucoes");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);

  if (!cat || !concurso) return <Navigate to="/concursos" replace />;
  if (!user) return <Navigate to="/login" replace />;

  const pricing = paymentsService.getPricing(concurso.id);

  const copiar = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast.success("Copiado");
  };

  // O IBAN angolano começa sempre por "AO06" (padrão nacional que muitos apps
  // de banco já preenchem). Copiamos sem esse prefixo para evitar duplicação.
  const copiarIban = async () => {
    const semPrefixo = IBAN.replace(/^AO06/, "");
    await navigator.clipboard.writeText(semPrefixo);
    toast.success("IBAN copiado (sem o AO06)");
  };

  const enviarComprovativo = async () => {
    if (!file) return toast.error("Selecione o ficheiro do comprovativo");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ficheiro deve ter no máximo 5MB");
    const okType = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type);
    if (!okType) return toast.error("Use imagem (JPG/PNG/WEBP) ou PDF");

    setUploading(true);
    try {
      const path = await paymentsService.uploadComprovativo(user.id, file);

      const id = await paymentsService.createPaymentRequest({
        userId: user.id,
        email: user.email ?? "",
        concursoId: concurso.id,
        categoriaId: cat.id,
        categoriaNome: cat.nome,
        comprovativoPath: path,
      });

      setRequestId(id);
      await notificationsService.create({
        userId: user.id,
        title: "Comprovativo recebido",
        body: `Recebemos o seu comprovativo para ${cat.nome} (${concurso.sigla}). A nossa equipa analisa em até 24h e enviará o código de activação.`,
      });
      toast.success("Comprovativo enviado! Aguarde até 24h pelo seu código.");
      setStep("codigo");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar comprovativo");
    } finally {
      setUploading(false);
    }
  };

  const activarCodigo = async () => {
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) return toast.error("O código tem 6 dígitos");
    setActivating(true);
    try {
      const res = await paymentsService.activateAccessCode(clean, concurso.id, cat.id);
      if (!res.ok) {
        toast.error(res.error === "invalid_or_used" ? "Código inválido ou já usado" : "Erro ao activar");
        return;
      }
      toast.success("Acesso activado!");
      clearAccessCache(user.id);
      await notificationsService.create({
        userId: user.id,
        title: "Conta activada ✅",
        body: `O seu acesso a ${cat.nome} (${concurso.sigla}) foi activado com sucesso. Bons estudos!`,
      });
      await refreshProfile();
      setStep("concluido");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao activar código");
    } finally {
      setActivating(false);
    }
  };

  return (
    <AppShell>
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center text-sm text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
      </button>

      <header className="mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{concurso.sigla} · {cat.nome}</p>
        <h1 className="font-display text-2xl font-bold">Obter acesso completo</h1>
        <p className="text-sm text-muted-foreground">
          {pricing.isPromo && pricing.normalLabel && (
            <span className="line-through opacity-60 mr-1">{pricing.normalLabel}</span>
          )}
          <span className="font-semibold text-foreground">{pricing.valorLabel}</span>
          {pricing.isPromo && (
            <span className="ml-1 inline-flex items-center rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">PROMO</span>
          )}
          {" "}· 4 meses de acesso à categoria
        </p>
      </header>


      {/* Stepper */}
      <div className="mb-5 flex items-center gap-2 text-xs">
        {(["instrucoes", "comprovativo", "codigo"] as Step[]).map((s, i) => {
          const active = step === s;
          const done = ["instrucoes", "comprovativo", "codigo"].indexOf(step) > i || step === "concluido";
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      {step === "instrucoes" && (
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">1. Faça o pagamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pague <strong>{pricing.valorLabel}</strong> por <strong>transferência bancária</strong>. Na{" "}
            <strong>descrição/mensagem</strong> da transferência, escreva o seu <strong>e-mail de cadastro</strong>{" "}
            para identificarmos rapidamente.
          </p>


          {/* Transferência Bancária */}
          <div className="mt-3 rounded-2xl border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-primary" /> Transferência Bancária
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">IBAN</div>
                  <div className="break-all font-mono text-sm font-bold">{IBAN}</div>
                </div>
                <Button size="sm" variant="outline" onClick={copiarIban}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Titular</div>
                  <div className="text-sm font-semibold">{TITULAR}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => copiar(TITULAR)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
            </div>
          </div>

          {/* Mensagem + Valor */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/40 p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Mensagem (seu e-mail)</div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <div className="truncate font-mono text-sm font-semibold">{user.email}</div>
                <Button size="sm" variant="outline" onClick={() => copiar(user.email ?? "")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor</div>
              <div className="mt-0.5 font-mono text-lg font-bold">{pricing.valorLabel}</div>
            </div>
          </div>

          <Button onClick={() => setStep("comprovativo")} className="mt-5 w-full rounded-full font-semibold">
            Já paguei, enviar comprovativo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button
            onClick={() => setStep("codigo")}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline"
          >
            Já tenho um código de activação
          </button>
        </Card>
      )}

      {step === "comprovativo" && (
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">2. Carregar comprovativo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie a captura de ecrã ou PDF da confirmação da transferência. Após análise (até 24h),
            receberá um <strong>código de 6 dígitos</strong> exclusivo desta categoria.
          </p>
          <div className="mt-4 space-y-3">
            <Label htmlFor="file" className="text-sm">Ficheiro (JPG, PNG, WEBP ou PDF — máx. 5MB)</Label>
            <Input
              id="file" type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && <p className="text-xs text-muted-foreground">Selecionado: {file.name}</p>}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={() => setStep("instrucoes")} className="rounded-full">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={enviarComprovativo} disabled={uploading || !file} className="flex-1 rounded-full font-semibold">
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar...</> : <><Upload className="mr-2 h-4 w-4" /> Enviar comprovativo</>}
            </Button>
          </div>
        </Card>
      )}

      {step === "codigo" && (
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">3. Activar código</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {requestId
              ? "Comprovativo recebido! Quando receber o código de 6 dígitos, introduza-o abaixo para activar."
              : "Introduza o código de 6 dígitos que recebeu para activar a sua categoria."}
          </p>
          <div className="mt-4">
            <Label htmlFor="code" className="text-sm">Código de activação</Label>
            <Input
              id="code" inputMode="numeric" maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 text-center font-mono text-2xl tracking-[0.5em]"
            />
          </div>
          <Button onClick={activarCodigo} disabled={activating || code.length !== 6} className="mt-4 w-full rounded-full font-semibold">
            {activating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A activar...</> : <><KeyRound className="mr-2 h-4 w-4" /> Activar acesso</>}
          </Button>
        </Card>
      )}

      {step === "concluido" && (
        <Card className="border-0 bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold">Acesso activado!</h2>
          <p className="mt-1 text-sm opacity-90">Já tem acesso completo a {cat.nome}. Bons estudos!</p>
          <Button asChild variant="secondary" className="mt-4 w-full rounded-full font-semibold">
            <a href={`/concursos/${concurso.id}/${cat.id}`}>Ir para a categoria</a>
          </Button>
        </Card>
      )}
    </AppShell>
  );
};

export default Acesso;
