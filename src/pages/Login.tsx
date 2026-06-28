import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, BookOpen, Trophy, Target } from "lucide-react";
import { toast } from "sonner";
import { LegalModal } from "@/components/LegalModal";
import { Seo } from "@/components/Seo";

const Login = () => {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e palavra-passe.");
      return;
    }
    setBusy(true);
    const result =
      mode === "login"
        ? await authService.signIn(email.trim(), password)
        : await authService.signUp(email.trim(), password, nome.trim() || undefined);
    setBusy(false);
    if (result.error) {
      const msg =
        result.error === "invalid_credentials"
          ? "Email ou palavra-passe incorretos."
          : result.error === "email_taken"
          ? "Este email já está registado."
          : "Erro ao iniciar sessão. Tente novamente.";
      toast.error(msg);
      return;
    }
    await refresh();
    navigate("/", { replace: true });
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero text-primary-foreground">
      <Seo
        title="Entrar no Passei · Concursos da Saúde em Angola"
        description="Acesse o Passei para estudar com simulados comentados e trilhas de preparação para concursos públicos da saúde em Angola."
        path="/login"
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 opacity-70" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 opacity-70" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Concursos públicos · Angola
          </div>
          <h1 className="font-display text-6xl font-bold tracking-tight">Passei</h1>
          <p className="mt-3 text-lg opacity-90 leading-snug">
            Sua plataforma de preparação para concursos públicos.
          </p>

          <ul className="mt-10 space-y-4">
            <Feature icon={BookOpen} title="Simulados comentados" desc="Questões reais do estilo do concurso." />
            <Feature icon={Target} title="Aprenda com trilhas" desc="Sessões diárias rápidas e divertidas." />
            <Feature icon={Trophy} title="Ranking entre candidatos" desc="Compita com outros profissionais da sua área." />
          </ul>
        </div>

        <div className="mt-10">
          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome"
                className="rounded-full bg-white/95 text-foreground"
              />
            )}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="rounded-full bg-white/95 text-foreground"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Palavra-passe"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="rounded-full bg-white/95 text-foreground"
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={busy}
              className="w-full rounded-full font-semibold shadow-elegant"
            >
              {busy ? "A processar…" : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-3 w-full text-center text-sm underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>

          <p className="mt-4 text-center text-xs opacity-75">
            Ao continuar, você aceita os{" "}
            <LegalModal
              defaultTab="termos"
              trigger={<button type="button" className="underline underline-offset-2 hover:opacity-100">termos de uso</button>}
            />{" "}
            e a{" "}
            <LegalModal
              defaultTab="privacidade"
              trigger={<button type="button" className="underline underline-offset-2 hover:opacity-100">política de privacidade</button>}
            />{" "}
            da plataforma.
          </p>
          <p className="mt-6 text-center">
            <a href="/admin" className="text-[10px] font-light tracking-wide opacity-50 hover:opacity-100 transition-opacity">
              Yetuedu
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <li className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-display font-semibold leading-tight">{title}</p>
      <p className="text-sm opacity-85">{desc}</p>
    </div>
  </li>
);

export default Login;
