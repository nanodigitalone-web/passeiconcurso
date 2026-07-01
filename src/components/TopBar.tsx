import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { PlanBadge } from "./PlanBadge";

const ROOT_ROUTES = ["/", "/concursos", "/percurso", "/ranking", "/aprender"];

export const TopBar = () => {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const showBack = !ROOT_ROUTES.includes(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background shadow-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 md:px-6 md:py-3">
        <div className="flex items-center gap-1 min-w-0">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-gradient">
            Passei
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {profile && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
              <Flame className="h-3.5 w-3.5" /> {profile.pontos} pts
            </span>
          )}
          <NotificationBell />
          <Link to="/perfil" aria-label="Perfil">
            <PlanBadge planId={profile?.plan_id}>
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/50 transition-smooth">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
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
