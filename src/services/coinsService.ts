// coinsService — wallet / coins feature (backend API).
// 1000 AOA = 1000 moedas. 1000 pontos = 200 moedas. Saque mínimo 2000 moedas (= 2000 AOA).

import { api } from "@/lib/api";

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

export const COIN_RULES = {
  pointsPerCoinUnit: 1000,
  coinsPerUnit: 200,
  minWithdrawCoins: 2000,
  aoaPerCoin: 1,
};

type Result = { ok: boolean; error?: string; moedas?: number };

export const coinsService = {
  async getBalance(userId: string): Promise<number> {
    try {
      const p = await api.get<{ moedas: number }>(`/profile/${userId}`);
      return p?.moedas ?? 0;
    } catch {
      return 0;
    }
  },

  async getIban(userId: string): Promise<string | null> {
    try {
      const p = await api.get<{ iban: string | null }>(`/profile/${userId}`);
      return p?.iban ?? null;
    } catch {
      return null;
    }
  },

  async listTransactions(): Promise<CoinTx[]> {
    try {
      return await api.get<CoinTx[]>("/coins/transactions");
    } catch {
      return [];
    }
  },

  async listMyWithdrawals(): Promise<WithdrawalRequest[]> {
    try {
      return await api.get<WithdrawalRequest[]>("/coins/withdrawals");
    } catch {
      return [];
    }
  },

  async convertPoints(points: number): Promise<Result> {
    try {
      return await api.post("/coins/convert", { points });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async giftCoins(toUserId: string, amount: number): Promise<Result> {
    try {
      return await api.post("/coins/gift", { to: toUserId, amount });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async giftAccess(toUserId: string, concursoId: string, categoriaId: string): Promise<Result> {
    try {
      return await api.post("/coins/gift-access", { to: toUserId, conc: concursoId, cat: categoriaId });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async purchaseAccess(concursoId: string, categoriaId: string): Promise<Result> {
    try {
      return await api.post("/coins/purchase-access", { conc: concursoId, cat: categoriaId });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  async requestWithdrawal(moedas: number, iban: string): Promise<Result> {
    try {
      return await api.post("/coins/withdraw", { moedas, iban });
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  /** Create a coin top-up request (proof of IBAN transfer, reviewed by admin). */
  async createTopupRequest(params: { userId: string; email: string; amountAoa: number; comprovativoPath: string }) {
    await api.post("/coins/topup", {
      amount_aoa: params.amountAoa,
      moedas: params.amountAoa, // 1 AOA = 1 moeda
      comprovativo_url: params.comprovativoPath,
    });
  },
};
