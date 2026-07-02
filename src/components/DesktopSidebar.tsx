import { NavLink } from "react-router-dom";
import {
  Home, Trophy, BarChart3, BookOpen, Zap, User, Sparkles, Coins,
  Medal, Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/concursos", label: "Concursos", icon: BookOpen },
  { to: "/aprender", label: "Aprender", icon: Zap },
  { to: "/simulado-nacional", label: "Simulado Nacional", icon: Medal },
  { to: "/prontidao", label: "Prontidão", icon: Gauge },
  { to: "/recursos", label: "Recursos", icon: Sparkles },
  { to: "/percurso", label: "Relatório", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/carteira", label: "Carteira", icon: Coins },
  { to: "/perfil", label: "Perfil", icon: User },
];

// Sidebar shown only on desktop (>= md). On mobile the BottomNav is used instead.
export const DesktopSidebar = () => {
  const { profile } = useAuth();

  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0">
      <div className="sticky top-20 w-full">
        <nav className="rounded-2xl border border-border/60 bg-card p-2 shadow-card">
          <ul className="space-y-0.5">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {profile && (
          <div className="relative mt-3 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-4 text-white shadow-card">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <p className="text-xs opacity-70">Os teus pontos</p>
            <p className="font-display text-2xl font-bold">{(profile.pontos ?? 0).toLocaleString("pt-PT")}</p>
            <p className="mt-1 truncate text-xs opacity-80">{profile.nome}</p>
          </div>
        )}
      </div>
    </aside>
  );
};
