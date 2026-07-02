import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, GraduationCap, Target, Trophy, Zap } from "lucide-react";
import { LegalModal } from "@/components/LegalModal";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Seo } from "@/components/Seo";

const Login = () => {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  // Remember an invite code so the inviter gets rewarded after Google sign-up.
  useEffect(() => {
    const code = params.get("convite");
    if (code) localStorage.setItem("passei.invite", code.trim().toUpperCase());
  }, [params]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-indigo-800 text-white">
      <Seo
        title="Entrar no Passei · Preparação para Concursos em Angola"
        description="Acede ao Passei para estudar com simulados comentados, trilhas de aprendizagem e ranking nacional. Preparação para concursos públicos em Angola."
        path="/login"
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute right-10 top-1/3 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white font-display text-3xl font-black text-primary shadow-lg">
              P
            </span>
            <h1 className="font-display text-5xl font-bold tracking-tight">Passei</h1>
          </div>
          <p className="mt-4 text-lg leading-snug opacity-90">
            Estuda, compete e conquista a tua aprovação.
          </p>

          {/* Prova social em números */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: BookOpen, value: "35 mil+", label: "Questões" },
              { icon: GraduationCap, value: "75+", label: "Disciplinas" },
              { icon: Trophy, value: "Nacional", label: "Ranking" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
                <s.icon className="h-4 w-4 opacity-60" />
                <p className="font-display text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] opacity-60 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-8 space-y-3.5">
            <Feature icon={BookOpen} title="Simulados comentados" desc="Questões no estilo real do concurso, com explicação." />
            <Feature icon={Zap} title="Trilha Aprender" desc="Sessões diárias rápidas com vidas e sequências." />
            <Feature icon={Target} title="Simulado Nacional e ligas" desc="Compete com candidatos de todo o país." />
          </ul>
        </div>

        <div className="mt-10">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-elegant backdrop-blur-md">
            <p className="mb-4 text-center text-sm font-medium opacity-90">
              Entra com a tua conta Google para começar.
            </p>
            <GoogleSignInButton
              onSuccess={async () => {
                await refresh();
                navigate("/", { replace: true });
              }}
            />
            <p className="mt-4 text-center text-[11px] leading-relaxed opacity-70">
              Ao continuar aceitas os{" "}
              <LegalModal
                defaultTab="termos"
                trigger={<button type="button" className="underline underline-offset-2 hover:opacity-100">termos de uso</button>}
              />{" "}
              e a{" "}
              <LegalModal
                defaultTab="privacidade"
                trigger={<button type="button" className="underline underline-offset-2 hover:opacity-100">política de privacidade</button>}
              />
              .
            </p>
          </div>
          <p className="mt-5 text-center text-xs">
            <a href="/admin" className="transition-opacity hover:opacity-80">
              <span className="font-light opacity-60">By </span>
              <span className="font-bold text-white">Yetuedu</span>
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <li className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-display font-semibold leading-tight">{title}</p>
      <p className="text-sm opacity-80">{desc}</p>
    </div>
  </li>
);

export default Login;
