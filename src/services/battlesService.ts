// battlesService — side-by-side quiz battles between friends.

import { supabase } from "@/integrations/supabase/client";
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
    const { data } = await supabase.rpc("get_battles");
    return (data ?? []) as BattleRow[];
  },

  /** Create a battle against a friend using the challenger's category. */
  async create(opponentId: string, concursoId: string, categoriaId: string) {
    const userRes = await supabase.auth.getUser();
    const me = userRes.data.user?.id;
    if (!me) return { ok: false, error: "not_authenticated" as const };

    const ids = quizService
      .getSmartQuestions(concursoId, categoriaId, BATTLE_SIZE)
      .map((q) => q.id);
    if (ids.length === 0) return { ok: false, error: "no_questions" as const };

    const { data, error } = await supabase
      .from("battles")
      .insert({
        challenger_id: me,
        opponent_id: opponentId,
        concurso_id: concursoId,
        categoria_id: categoriaId,
        question_ids: ids,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (data as any).id as string };
  },

  async get(id: string): Promise<BattleRow | null> {
    const all = await this.list();
    return all.find((b) => b.id === id) ?? null;
  },

  async submitResult(battleId: string, score: number): Promise<boolean> {
    const { error } = await supabase.rpc("submit_battle_result", {
      _battle: battleId,
      _score: score,
    });
    return !error;
  },
};
