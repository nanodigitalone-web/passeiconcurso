// rankingService — encapsulates ranking queries (backend API).

import { api } from "@/lib/api";

export type RankRow = {
  id: string;
  nome: string;
  avatar_url: string | null;
  pontos: number;
  categoria_nome: string | null;
};

export const rankingService = {
  async getRanking(categoria: string | null): Promise<RankRow[]> {
    try {
      const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
      return await api.get<RankRow[]>(`/ranking${q}`);
    } catch {
      return [];
    }
  },

  /** Weekly ranking — points earned since Monday, resets every week. */
  async getWeeklyRanking(): Promise<RankRow[]> {
    try {
      return await api.get<RankRow[]>("/ranking/weekly");
    } catch {
      return [];
    }
  },
};
