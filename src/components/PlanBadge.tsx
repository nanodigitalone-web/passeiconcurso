import { ReactNode } from "react";
import { Crown, Zap, Star, Users } from "lucide-react";

const BADGES: Record<string, { icon: ReactNode; bg: string; label: string }> = {
  basico:  { icon: <Zap   className="h-2 w-2" />, bg: "bg-blue-500",    label: "Básico"   },
  pro:     { icon: <Star  className="h-2 w-2" />, bg: "bg-purple-500",  label: "Pro"      },
  pro_max: { icon: <Crown className="h-2 w-2" />, bg: "bg-amber-500",   label: "Pro Max"  },
  familia: { icon: <Users className="h-2 w-2" />, bg: "bg-emerald-500", label: "Família"  },
};

interface PlanBadgeProps {
  planId?: string | null;
  children: ReactNode;
  size?: "sm" | "md";
}

export const PlanBadge = ({ planId, children, size = "md" }: PlanBadgeProps) => {
  const badge = planId ? BADGES[planId] : null;
  if (!badge) return <>{children}</>;
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="relative inline-block">
      {children}
      <span
        title={badge.label}
        className={`absolute -bottom-0.5 -right-0.5 flex ${dim} items-center justify-center rounded-full text-white shadow-sm ring-[1.5px] ring-background ${badge.bg}`}
      >
        {badge.icon}
      </span>
    </div>
  );
};

export const PlanPill = ({ planId }: { planId?: string | null }) => {
  const badge = planId ? BADGES[planId] : null;
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${badge.bg}`}>
      {badge.icon} {badge.label}
    </span>
  );
};
