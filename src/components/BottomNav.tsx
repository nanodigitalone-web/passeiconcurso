import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, BookOpen, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/concursos", label: "Concursos", icon: BookOpen },
  { to: "/aprender", label: "Aprender", icon: Zap },
  { to: "/recursos", label: "Recursos", icon: Sparkles },
  { to: "/percurso", label: "Relatório", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  if (
    pathname.startsWith("/quiz/") ||
    pathname.startsWith("/aprender/sessao") ||
    /^\/simulado-nacional\/[^/]+$/.test(pathname)
  ) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-background/95 shadow-elegant backdrop-blur-xl">
        <ul className="grid grid-cols-6 px-1 py-1.5">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn(
                      "flex h-8 w-10 items-center justify-center rounded-2xl transition-smooth",
                      isActive && "bg-gradient-primary text-primary-foreground shadow-card",
                    )}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className={cn(isActive && "font-semibold")}>{label}</span>
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
