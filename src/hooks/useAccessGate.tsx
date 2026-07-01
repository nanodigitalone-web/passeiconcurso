import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { accessService, clearAccessCache } from "@/services";

const TRIAL_HOURS = 2;
// Promoção: todas as categorias gratuitas até 5 de julho de 2026 (inclusive).
const PROMO_END = new Date("2026-07-06T00:00:00Z").getTime();

export { clearAccessCache };

export type GateState = {
  loading: boolean;
  hasAccess: boolean;
  isTrial: boolean;
  trialHoursLeft: number;
  trialExpired: boolean;
};

export const useAccessGate = (concursoId?: string, categoriaId?: string): GateState => {
  const { user } = useAuth();
  const [state, setState] = useState<GateState>({
    loading: true, hasAccess: false, isTrial: false, trialHoursLeft: 0, trialExpired: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !concursoId || !categoriaId) {
        setState({ loading: false, hasAccess: false, isTrial: false, trialHoursLeft: 0, trialExpired: false });
        return;
      }
      const now = Date.now();

      // Promoção ativa → acesso livre a todos.
      if (now < PROMO_END) {
        if (!active) return;
        setState({ loading: false, hasAccess: true, isTrial: false, trialHoursLeft: 0, trialExpired: false });
        return;
      }

      const created = new Date(user.created_at).getTime();
      const trialEnd = created + TRIAL_HOURS * 3600000;
      const trialHoursLeft = Math.max(0, Math.ceil((trialEnd - now) / 3600000));
      const isTrial = now < trialEnd;

      const { hasPaidAccess: paid } = await accessService.getAccess(user.id, concursoId, categoriaId);

      if (!active) return;
      setState({
        loading: false,
        hasAccess: isTrial || paid,
        isTrial: isTrial && !paid,
        trialHoursLeft,
        trialExpired: !isTrial && !paid,
      });
    })();
    return () => { active = false; };
  }, [user, concursoId, categoriaId]);

  return state;
};
