// recursosService — gateway to the gated `/content/recursos` backend endpoint.

import { api } from "@/lib/api";

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

    const data = await api.post<{ seccoes: RecursoSeccao[] }>("/content/recursos", {
      concursoId,
      categoriaId,
    });

    const seccoes = (data?.seccoes ?? []) as RecursoSeccao[];
    cache.set(key, seccoes);
    return seccoes;
  },
};
