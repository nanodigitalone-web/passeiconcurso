import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/concursos", label: "Concursos", icon: BookOpen },
  { to: "/percurso", label: "Percurso", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  // Hide on quiz screen for focus
  if (pathname.startsWith("/quiz/")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-2xl px-2">
        <ul className="grid grid-cols-4">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-smooth",
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
