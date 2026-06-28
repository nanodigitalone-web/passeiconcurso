import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, BookOpen, Trophy, Target } from "lucide-react";
import { LegalModal } from "@/components/LegalModal";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Seo } from "@/components/Seo";

const Login = () => {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

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
          <p className="mb-4 text-center text-sm opacity-90">
            Entre com a sua conta Google para começar.
          </p>
          <GoogleSignInButton
            onSuccess={async () => {
              await refresh();
              navigate("/", { replace: true });
            }}
          />

          <p className="mt-6 text-center text-xs opacity-75">
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
