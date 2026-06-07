import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
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
  const [state, setState] = useState<GateState>({
    loading: true, hasAccess: false, isTrial: false, trialDaysLeft: 0, trialExpired: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !concursoId || !categoriaId) {
        setState({ loading: false, hasAccess: false, isTrial: false, trialDaysLeft: 0, trialExpired: false });
        return;
      }
      const created = new Date(user.created_at).getTime();
      const trialEnd = created + TRIAL_DAYS * 86400000;
      const now = Date.now();
      const trialDaysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
      const isTrial = now < trialEnd;

      const { hasPaidAccess: paid } = await accessService.getAccess(user.id, concursoId, categoriaId);

      if (!active) return;
      setState({
        loading: false,
        hasAccess: isTrial || paid,
        isTrial: isTrial && !paid,
        trialDaysLeft,
        trialExpired: !isTrial && !paid,
      });
    })();
    return () => { active = false; };
  }, [user, concursoId, categoriaId]);

  return state;
};
