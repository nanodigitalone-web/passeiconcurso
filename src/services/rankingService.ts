// rankingService — encapsulates ranking queries.

import { supabase } from "@/integrations/supabase/client";

export type RankRow = {
  id: string;
  nome: string;
  avatar_url: string | null;
  pontos: number;
  categoria_nome: string | null;
};

export const rankingService = {
  async getRanking(categoria: string | null): Promise<RankRow[]> {
    const { data } = await supabase.rpc("get_ranking", { _categoria: categoria });
    return (data ?? []) as RankRow[];
  },
};
