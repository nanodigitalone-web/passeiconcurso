import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Share2, Image as ImageIcon, Award, Copy, Check } from "lucide-react";
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
      "Junta-te a mim no Passei — prepara-te para os concursos da saúde em Angola! 🎯",
    );
    if (r === "copied") toast.success("Link copiado para partilhares!");
  };

  const shareApp = async () => {
    const r = await shareLink(origin, "Passei — simulados e trilhas para concursos da saúde em Angola.");
    if (r === "copied") toast.success("Link da app copiado!");
  };

  const gerarBanner = async () => {
    if (!profile) return;
    setBusy("banner");
    try {
      const blob = await buildBanner(profile, pontos);
      await shareImage(blob, "passei-banner.png", `Os meus ${pontos} pontos no Passei! 🏆`);
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
      await shareImage(blob, "passei-certificado.png", "O meu certificado Passei de 100.000 pontos! 🎓");
    } catch {
      toast.error("Não foi possível gerar o certificado.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">Partilhar & Convidar</h1>
        <p className="text-sm text-muted-foreground">Convida amigos, partilha o teu progresso e ganha pontos.</p>
      </header>

      {/* Convite */}
      <Card className="mb-4 p-5 shadow-card border-border/60">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Gift className="h-4 w-4 text-primary" /> Convidar amigos
        </div>
        <p className="text-sm text-muted-foreground">
          Por cada amigo que criar conta com o teu convite, ganhas <b className="text-primary">50 pontos</b>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">{inviteLink}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-full" onClick={copyInvite}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button className="rounded-full bg-gradient-primary" onClick={shareInvite}>
            <Share2 className="mr-2 h-4 w-4" /> Partilhar convite
          </Button>
        </div>
      </Card>

      {/* Partilhar app */}
      <Card className="mb-4 p-5 shadow-card border-border/60">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Share2 className="h-4 w-4 text-primary" /> Partilhar a aplicação
        </div>
        <p className="text-sm text-muted-foreground">Espalha a palavra e ajuda mais candidatos a prepararem-se.</p>
        <Button variant="outline" className="mt-3 w-full rounded-full" onClick={shareApp}>
          <Share2 className="mr-2 h-4 w-4" /> Partilhar o Passei
        </Button>
      </Card>

      {/* Banner */}
      <Card className="mb-4 p-5 shadow-card border-border/60">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <ImageIcon className="h-4 w-4 text-primary" /> Banner para redes sociais
        </div>
        <p className="text-sm text-muted-foreground">
          Gera uma imagem com o teu nome, foto e pontos para partilhares.
        </p>
        <Button className="mt-3 w-full rounded-full bg-gradient-primary" onClick={gerarBanner} disabled={busy !== null}>
          <ImageIcon className="mr-2 h-4 w-4" /> {busy === "banner" ? "A gerar…" : "Gerar banner"}
        </Button>
      </Card>

      {/* Certificado */}
      <Card className="mb-4 p-5 shadow-card border-border/60">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Award className="h-4 w-4 text-primary" /> Certificado de 100.000 pontos
        </div>
        {pontos >= CERT_THRESHOLD ? (
          <>
            <p className="text-sm text-muted-foreground">
              Parabéns! Atingiste {pontos.toLocaleString("pt-PT")} pontos. Gera o teu certificado.
            </p>
            <Button className="mt-3 w-full rounded-full bg-gradient-primary" onClick={gerarCertificado} disabled={busy !== null}>
              <Award className="mr-2 h-4 w-4" /> {busy === "cert" ? "A gerar…" : "Gerar certificado"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Disponível ao atingires 100.000 pontos. Tens {pontos.toLocaleString("pt-PT")} —
            faltam {(CERT_THRESHOLD - pontos).toLocaleString("pt-PT")}.
          </p>
        )}
      </Card>
    </AppShell>
  );
};

export default Partilhar;
