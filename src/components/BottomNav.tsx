import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, BookOpen, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Cada item tem a sua própria cor — o menu fica colorido mesmo em repouso.
const items = [
  { to: "/", label: "Início", icon: Home, idle: "text-blue-500", active: "from-blue-500 to-indigo-600", label_active: "text-blue-600" },
  { to: "/concursos", label: "Concursos", icon: BookOpen, idle: "text-rose-500", active: "from-rose-500 to-pink-600", label_active: "text-rose-600" },
  { to: "/aprender", label: "Aprender", icon: Zap, idle: "text-amber-500", active: "from-amber-500 to-orange-600", label_active: "text-amber-600" },
  { to: "/recursos", label: "Recursos", icon: Sparkles, idle: "text-violet-500", active: "from-violet-500 to-purple-600", label_active: "text-violet-600" },
  { to: "/percurso", label: "Relatório", icon: BarChart3, idle: "text-sky-500", active: "from-sky-500 to-cyan-600", label_active: "text-sky-600" },
  { to: "/ranking", label: "Ranking", icon: Trophy, idle: "text-emerald-500", active: "from-emerald-500 to-teal-600", label_active: "text-emerald-600" },
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
          {items.map(({ to, label, icon: Icon, idle, active, label_active }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                aria-label={label}
                className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-smooth"
              >
                {({ isActive }) => (
                  <>
                    <span className={cn(
                      "flex h-8 w-10 items-center justify-center rounded-2xl transition-smooth",
                      isActive ? `bg-gradient-to-br ${active} text-white shadow-card` : idle,
                    )}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className={cn(isActive ? `font-semibold ${label_active}` : "text-muted-foreground")}>
                      {label}
                    </span>
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
