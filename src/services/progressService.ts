// progressService — diagnóstico de prontidão e streak freeze via backend API.

import { api } from "@/lib/api";

export type ReadinessDiscipline = {
  disciplina: string;
  nome: string;
  total: number;
  accuracy: number;   // 0–100
  mastered: number;
  bank: number;
  coverage: number;   // 0–100
  readiness: number;  // 0–100
};

export type Readiness = {
  overall: {
    score: number;
    accuracy: number;
    attempted: number;
    mastered: number;
    disciplines: number;
  };
  disciplines: ReadinessDiscipline[];
};

export const progressService = {
  async getReadiness(): Promise<Readiness | null> {
    try {
      return await api.get<Readiness>("/profile/readiness");
    } catch {
      return null;
    }
  },

  /** Compra 1 congelamento de streak (300 moedas, máx. 2 em posse). */
  buyStreakFreeze() {
    return api.post<{ ok: boolean; streak_freezes: number; cost: number }>(
      "/profile/streak-freeze/buy",
    );
  },
};
