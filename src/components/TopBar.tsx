import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { PlanBadge } from "./PlanBadge";

const ROOT_ROUTES = ["/", "/concursos", "/percurso", "/ranking", "/aprender", "/recursos"];

export const TopBar = () => {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const showBack = !ROOT_ROUTES.includes(pathname);
  const streak = profile?.streak ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 md:px-6 md:py-3">
        <div className="flex min-w-0 items-center gap-1">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="shrink-0 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary font-display text-sm font-black text-primary-foreground shadow-card">
              P
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Passei</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {profile && streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
              <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> {streak}
            </span>
          )}
          {profile && (
            <span className="hidden items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 sm:inline-flex">
              <Zap className="h-3.5 w-3.5" /> {(profile.pontos ?? 0).toLocaleString("pt-PT")}
            </span>
          )}
          <NotificationBell />
          <Link to="/perfil" aria-label="Perfil">
            <PlanBadge planId={profile?.plan_id}>
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-smooth hover:ring-primary/50">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {profile?.nome?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </PlanBadge>
          </Link>
        </div>
      </div>
    </header>
  );
};
