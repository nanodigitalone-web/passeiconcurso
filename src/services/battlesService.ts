// battlesService — side-by-side quiz battles between friends (backend API).

import { api } from "@/lib/api";
import { quizService } from "./quizService";

export type BattleRow = {
  id: string;
  opponent_id: string;
  opponent_nome: string;
  opponent_avatar: string | null;
  concurso_id: string;
  categoria_id: string;
  question_ids: string[];
  status: "pending" | "active" | "finished";
  challenger_id: string;
  challenger_score: number | null;
  opponent_score: number | null;
  challenger_done: boolean;
  opponent_done: boolean;
  winner_id: string | null;
  created_at: string;
};

const BATTLE_SIZE = 8;

export const battlesService = {
  async list(): Promise<BattleRow[]> {
    try {
      return await api.get<BattleRow[]>("/battles");
    } catch {
      return [];
    }
  },

  /** Create a battle against a friend using the challenger's category.
   *  Questions come from the SERVER engine, so it also works for the virtual
   *  plano/interesses categories (the local bundled bank is empty for those). */
  async create(opponentId: string, concursoId: string, categoriaId: string) {
    let ids: string[] = [];
    try {
      const qs = await quizService.loadQuestionSet(concursoId, categoriaId, BATTLE_SIZE);
      ids = qs.map((q) => q.id);
    } catch { /* fall through to local bank */ }
    if (ids.length === 0) {
      ids = quizService.getSmartQuestions(concursoId, categoriaId, BATTLE_SIZE).map((q) => q.id);
    }
    if (ids.length === 0) return { ok: false, error: "no_questions" as const };

    try {
      const r = await api.post<{ ok: boolean; id?: string; error?: string }>("/battles", {
        opponentId,
        concursoId,
        categoriaId,
        questionIds: ids,
      });
      return r;
    } catch (e: any) {
      return { ok: false, id: undefined, error: e?.message };
    }
  },

  /** The battle's question set (same for both players), served by the API. */
  async getQuestions(battleId: string) {
    try {
      const r = await api.get<{ questions: any[] }>(`/battles/${battleId}/questions`);
      return r.questions ?? [];
    } catch {
      return [];
    }
  },

  async get(id: string): Promise<BattleRow | null> {
    const all = await this.list();
    return all.find((b) => b.id === id) ?? null;
  },

  async submitResult(battleId: string, score: number): Promise<boolean> {
    try {
      await api.post(`/battles/${battleId}/result`, { score });
      return true;
    } catch {
      return false;
    }
  },
};
