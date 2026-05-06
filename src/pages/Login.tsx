import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const signInGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Erro ao iniciar sessão. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant border-0 bg-gradient-hero text-primary-foreground">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" /> MINSA · Concursos da Saúde
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Passei</h1>
        <p className="mt-2 opacity-90">Sua plataforma de preparação para concursos públicos em Angola.</p>

        <div className="mt-8 space-y-3">
          <Button
            onClick={signInGoogle}
            size="lg"
            variant="secondary"
            className="w-full rounded-full font-semibold"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            Entrar com Google
          </Button>
        </div>

        <p className="mt-6 text-xs opacity-75 text-center">
          Ao continuar, você aceita os termos de uso da plataforma.
        </p>
      </Card>
    </div>
  );
};

export default Login;
