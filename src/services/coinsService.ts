// coinsService — wallet / coins feature.
// 1000 AOA = 1000 moedas. 1000 pontos = 200 moedas. Saque mínimo 2000 moedas (= 2000 AOA).

import { supabase } from "@/integrations/supabase/client";

export type CoinTx = {
  id: string;
  tipo: string;
  amount: number;
  descricao: string | null;
  created_at: string;
};

export type TopupRequest = {
  id: string;
  amount_aoa: number;
  moedas: number;
  status: string;
  created_at: string;
};

export type WithdrawalRequest = {
  id: string;
  moedas: number;
  aoa: number;
  iban: string;
  status: string;
  created_at: string;
};

// Conversion / withdrawal rules (kept in sync with the backend RPCs).
export const COIN_RULES = {
  pointsPerCoinUnit: 1000, // 1000 pontos
  coinsPerUnit: 200, // -> 200 moedas
  minWithdrawCoins: 2000, // saque mínimo
  aoaPerCoin: 1, // 1 moeda = 1 AOA
};

export const coinsService = {
  async getBalance(userId: string): Promise<number> {
    const { data } = await supabase.from("profiles").select("moedas").eq("id", userId).maybeSingle();
    return (data as any)?.moedas ?? 0;
  },

  async getIban(userId: string): Promise<string | null> {
    const { data } = await supabase.from("profiles").select("iban").eq("id", userId).maybeSingle();
    return (data as any)?.iban ?? null;
  },

  async listTransactions(): Promise<CoinTx[]> {
    const { data } = await supabase
      .from("coin_transactions" as any)
      .select("id, tipo, amount, descricao, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as any[]) ?? [];
  },

  async listMyWithdrawals(): Promise<WithdrawalRequest[]> {
    const { data } = await supabase
      .from("withdrawal_requests" as any)
      .select("id, moedas, aoa, iban, status, created_at")
      .order("created_at", { ascending: false });
    return (data as any[]) ?? [];
  },

  async convertPoints(points: number) {
    const { data, error } = await supabase.rpc("convert_points_to_coins" as any, { _points: points });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string; moedas?: number };
  },

  async giftCoins(toUserId: string, amount: number) {
    const { data, error } = await supabase.rpc("gift_coins" as any, { _to: toUserId, _amount: amount });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string };
  },

  async giftAccess(toUserId: string, concursoId: string, categoriaId: string) {
    const { data, error } = await supabase.rpc("gift_access_with_coins" as any, {
      _to: toUserId,
      _conc: concursoId,
      _cat: categoriaId,
    });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string };
  },

  async purchaseAccess(concursoId: string, categoriaId: string) {
    const { data, error } = await supabase.rpc("purchase_access_with_coins" as any, {
      _conc: concursoId,
      _cat: categoriaId,
    });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string };
  },

  async requestWithdrawal(moedas: number, iban: string) {
    const { data, error } = await supabase.rpc("request_withdrawal" as any, { _moedas: moedas, _iban: iban });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string };
  },

  /** Create a coin top-up request (proof of IBAN transfer, reviewed by admin). */
  async createTopupRequest(params: { userId: string; email: string; amountAoa: number; comprovativoPath: string }) {
    const { error } = await supabase.from("coin_topup_requests" as any).insert({
      user_id: params.userId,
      email: params.email,
      amount_aoa: params.amountAoa,
      moedas: params.amountAoa, // 1 AOA = 1 moeda
      comprovativo_url: params.comprovativoPath,
      status: "awaiting_review",
    } as any);
    if (error) throw error;
  },
};
