import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Home, Trophy, BookOpen, Zap, MoreHorizontal,
  Medal, Gauge, CreditCard, Banknote, Gift, Sparkles, BarChart3, User,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// Cada item tem a sua própria cor, mesmo em repouso.
const items = [
  { to: "/", label: "Início", icon: Home, idle: "text-blue-500", active: "from-blue-500 to-indigo-600", label_active: "text-blue-600" },
  { to: "/concursos", label: "Concursos", icon: BookOpen, idle: "text-rose-500", active: "from-rose-500 to-pink-600", label_active: "text-rose-600" },
  { to: "/aprender", label: "Aprender", icon: Zap, idle: "text-amber-500", active: "from-amber-500 to-orange-600", label_active: "text-amber-600" },
  { to: "/ranking", label: "Ranking", icon: Trophy, idle: "text-emerald-500", active: "from-emerald-500 to-teal-600", label_active: "text-emerald-600" },
];

// Atalhos dentro da gaveta "···".
const MORE = [
  { to: "/simulado-nacional", label: "Simulado", icon: Medal, accent: "bg-amber-100 text-amber-700" },
  { to: "/prontidao", label: "Prontidão", icon: Gauge, accent: "bg-sky-100 text-sky-700" },
  { to: "/planos", label: "Planos", icon: CreditCard, accent: "bg-violet-100 text-violet-700" },
  { to: "/carteira", label: "Sacar", icon: Banknote, accent: "bg-emerald-100 text-emerald-700" },
  { to: "/partilhar", label: "Convidar", icon: Gift, accent: "bg-rose-100 text-rose-700" },
  { to: "/recursos", label: "Recursos", icon: Sparkles, accent: "bg-indigo-100 text-indigo-700" },
  { to: "/percurso", label: "Relatório", icon: BarChart3, accent: "bg-cyan-100 text-cyan-700" },
  { to: "/perfil", label: "Perfil", icon: User, accent: "bg-slate-100 text-slate-700" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  if (
    pathname.startsWith("/quiz/") ||
    pathname.startsWith("/aprender/sessao") ||
    /^\/simulado-nacional\/[^/]+$/.test(pathname)
  ) return null;

  const moreActive = MORE.some((m) => pathname === m.to || pathname.startsWith(m.to + "/"));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-background/95 shadow-elegant backdrop-blur-xl">
          <ul className="grid grid-cols-5 px-1 py-1.5">
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
            <li>
              <button
                onClick={() => setMoreOpen(true)}
                aria-label="Mais opções"
                className="flex w-full flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-smooth"
              >
                <span className={cn(
                  "flex h-8 w-10 items-center justify-center rounded-2xl transition-smooth",
                  moreActive ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-card" : "text-violet-500",
                )}>
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </span>
                <span className={cn(moreActive ? "font-semibold text-violet-600" : "text-muted-foreground")}>
                  Mais
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Gaveta de atalhos */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="rounded-t-3xl">
          <div className="mx-auto w-full max-w-2xl px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">
            <DrawerTitle className="mb-4 text-center font-display text-base font-bold">
              Mais opções
            </DrawerTitle>
            <div className="grid grid-cols-4 gap-3">
              {MORE.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", m.accent)}>
                    <m.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
