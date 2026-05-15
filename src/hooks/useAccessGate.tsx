import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

const TRIAL_DAYS = 2;

export type GateState = {
  loading: boolean;
  hasAccess: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
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

      let paid = false;
      const { data } = await supabase
        .from("category_access")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("concurso_id", concursoId)
        .eq("categoria_id", categoriaId)
        .maybeSingle();
      if (data) {
        const exp = (data as any).expires_at ? new Date((data as any).expires_at).getTime() : Infinity;
        paid = exp > Date.now();
      }

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
