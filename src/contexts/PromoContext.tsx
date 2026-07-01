import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export type Promo = {
  id: string;
  label: string;
  discount_pct: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type PromoState = { loading: boolean; promo: Promo | null };

const PromoContext = createContext<PromoState>({ loading: true, promo: null });

export const PromoProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PromoState>({ loading: true, promo: null });

  useEffect(() => {
    api.get<{ promo: Promo | null }>("/promo/active")
      .then((d) => setState({ loading: false, promo: d.promo }))
      .catch(() => setState({ loading: false, promo: null }));
  }, []);

  return <PromoContext.Provider value={state}>{children}</PromoContext.Provider>;
};

export const usePromo = () => useContext(PromoContext);

export const useIsPromoActive = (): boolean => {
  const { loading, promo } = useContext(PromoContext);
  if (loading || !promo) return false;
  const now = Date.now();
  return promo.is_active
    && now >= new Date(promo.starts_at).getTime()
    && now < new Date(promo.ends_at).getTime();
};

export const usePromoEnd = (): number | null => {
  const { promo } = useContext(PromoContext);
  if (!promo) return null;
  return new Date(promo.ends_at).getTime();
};
