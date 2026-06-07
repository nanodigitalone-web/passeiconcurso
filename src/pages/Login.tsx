import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, BookOpen, Trophy, Target } from "lucide-react";
import { toast } from "sonner";
import { LegalModal } from "@/components/LegalModal";
import { Seo } from "@/components/Seo";

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const signInGoogle = async () => {
    const result = await authService.signInWithGoogle(window.location.origin);
    if (result.error) {
      toast.error("Erro ao iniciar sessão. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero text-primary-foreground">
      <Seo
        title="Entrar no Passei · Concursos da Saúde em Angola"
        description="Acesse o Passei para estudar com simulados comentados e trilhas de preparação para concursos públicos da saúde em Angola."
        path="/login"
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
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
          <Button
            onClick={signInGoogle}
            size="lg"
            variant="secondary"
            className="w-full rounded-full font-semibold shadow-elegant"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Entrar com Google
          </Button>
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
              Nano Digital One
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <li className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-display font-semibold leading-tight">{title}</p>
      <p className="text-sm opacity-85">{desc}</p>
    </div>
  </li>
);

export default Login;
