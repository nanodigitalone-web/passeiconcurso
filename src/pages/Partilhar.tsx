import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Share2, Image as ImageIcon, Award, Copy, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { buildBanner, buildCertificate, shareImage, shareLink } from "@/lib/share";

const CERT_THRESHOLD = 100000;

const Partilhar = () => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"banner" | "cert" | null>(null);

  const pontos = profile?.pontos_globais ?? profile?.pontos ?? 0;
  const code = profile?.friend_code || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.passeii.com";
  const inviteLink = `${origin}/login?convite=${code}`;
  const certPct = Math.min(100, Math.round((pontos / CERT_THRESHOLD) * 100));

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link de convite copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const shareInvite = async () => {
    const r = await shareLink(
      inviteLink,
      "Junta-te a mim no Passei e prepara-te para os concursos públicos em Angola!",
    );
    if (r === "copied") toast.success("Link copiado para partilhares!");
  };

  const shareApp = async () => {
    const r = await shareLink(origin, "Passei: simulados e trilhas para concursos públicos em Angola.");
    if (r === "copied") toast.success("Link da app copiado!");
  };

  const gerarBanner = async () => {
    if (!profile) return;
    setBusy("banner");
    try {
      const blob = await buildBanner(profile, pontos);
      await shareImage(blob, "passei-banner.png", `Os meus ${pontos} pontos no Passei!`);
    } catch {
      toast.error("Não foi possível gerar o banner.");
    } finally {
      setBusy(null);
    }
  };

  const gerarCertificado = async () => {
    if (!profile) return;
    setBusy("cert");
    try {
      const blob = await buildCertificate(profile, pontos);
      await shareImage(blob, "passei-certificado.png", "O meu certificado Passei de 100.000 pontos!");
    } catch {
      toast.error("Não foi possível gerar o certificado.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      {/* ── HERO: convite ────────────────────────────────────────────────────── */}
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-elegant animate-fade-in">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Convida e ganha</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">Partilhar & Convidar</h1>
          <p className="mt-1 text-sm opacity-80">
            Por cada amigo que criar conta com o teu convite ganhas
            <span className="mx-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
              <Zap className="h-3 w-3" /> 50 pontos
            </span>
          </p>

          {/* Código + link */}
          <div className="mt-4 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">O teu código</p>
            <p className="font-display text-2xl font-black tracking-widest">{code || "—"}</p>
            <p className="mt-1 truncate text-[11px] opacity-60">{inviteLink}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={copyInvite}
              variant="ghost"
              size="lg"
              className="rounded-2xl border border-white/25 font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              onClick={shareInvite}
              size="lg"
              className="rounded-2xl bg-white font-bold text-primary shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              <Share2 className="mr-2 h-4 w-4" /> Partilhar
            </Button>
          </div>
        </div>
      </div>

      {/* ── AÇÕES DE PARTILHA ────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {/* Partilhar app */}
        <Card className="flex items-center gap-3 border-border/60 p-3.5 shadow-card">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Share2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold leading-tight">Partilhar a aplicação</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Espalha a palavra e ajuda mais candidatos</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 rounded-full font-semibold" onClick={shareApp}>
            Partilhar
          </Button>
        </Card>

        {/* Banner */}
        <Card className="flex items-center gap-3 border-border/60 p-3.5 shadow-card">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold leading-tight">Banner para redes sociais</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Imagem com o teu nome, foto e pontos</p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-full bg-gradient-primary font-semibold"
            onClick={gerarBanner}
            disabled={busy !== null}
          >
            {busy === "banner" ? "A gerar…" : "Gerar"}
          </Button>
        </Card>

        {/* Certificado */}
        <Card className="border-border/60 p-3.5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold leading-tight">Certificado de 100.000 pontos</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {pontos >= CERT_THRESHOLD
                  ? `Parabéns! Atingiste ${pontos.toLocaleString("pt-PT")} pontos`
                  : `${pontos.toLocaleString("pt-PT")} de ${CERT_THRESHOLD.toLocaleString("pt-PT")} pontos`}
              </p>
            </div>
            {pontos >= CERT_THRESHOLD && (
              <Button
                size="sm"
                className="shrink-0 rounded-full bg-gradient-primary font-semibold"
                onClick={gerarCertificado}
                disabled={busy !== null}
              >
                {busy === "cert" ? "A gerar…" : "Gerar"}
              </Button>
            )}
          </div>
          {pontos < CERT_THRESHOLD && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                  style={{ width: `${Math.max(2, certPct)}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] font-semibold text-muted-foreground">{certPct}%</p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};

export default Partilhar;
