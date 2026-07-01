import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useIsPromoActive } from "@/contexts/PromoContext";
import { accessService, clearAccessCache } from "@/services";

const TRIAL_HOURS = 2;

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
  const isPromoActive = useIsPromoActive();
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

      // Active promotion → free access for everyone.
      if (isPromoActive) {
        if (!active) return;
        setState({ loading: false, hasAccess: true, isTrial: false, trialHoursLeft: 0, trialExpired: false });
        return;
      }

      const now = Date.now();
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
  }, [user, concursoId, categoriaId, isPromoActive]);

  return state;
};
