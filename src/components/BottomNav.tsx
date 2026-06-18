import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, BookOpen, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/concursos", label: "Concursos", icon: BookOpen },
  { to: "/aprender", label: "Aprender", icon: Zap },
  { to: "/recursos", label: "Recursos", icon: Sparkles },
  { to: "/percurso", label: "Percurso", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/quiz/") || pathname.startsWith("/aprender/sessao")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background shadow-card md:hidden">
      <div className="mx-auto max-w-2xl px-1">
        <ul className="grid grid-cols-5">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-2xl transition-smooth", isActive && "bg-primary/10")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
