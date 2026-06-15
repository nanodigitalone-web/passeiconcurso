// recursosService — gateway to the gated `recursos` edge function.
//
// Recursos are PAID reference content (doses, drug classes, algorithms,
// protocols, terminology, signs & symptoms). The content lives ONLY on the
// server and is served by an edge function that enforces trial/paid access, so
// it never reaches the client bundle for users without access.
import { supabase } from "@/integrations/supabase/client";

export type RecursoItem = { nome: string; valor: string; nota?: string };
export type RecursoTipo =
  | "doses"
  | "classes"
  | "algoritmos"
  | "protocolos"
  | "terminologias"
  | "sinais";
export type RecursoSeccao = {
  id: string;
  tipo: RecursoTipo;
  titulo: string;
  itens: RecursoItem[];
};

const cache = new Map<string, RecursoSeccao[]>();

export const recursosService = {
  /** Fetch the gated resources for a category. Resolves only for users with access. */
  async getRecursos(concursoId: string, categoriaId: string): Promise<RecursoSeccao[]> {
    const key = `${concursoId}/${categoriaId}`;
    if (cache.has(key)) return cache.get(key)!;

    const { data, error } = await supabase.functions.invoke("recursos", {
      body: { concursoId, categoriaId },
    });
    if (error) throw error;

    const seccoes = (data?.seccoes ?? []) as RecursoSeccao[];
    cache.set(key, seccoes);
    return seccoes;
  },
};
