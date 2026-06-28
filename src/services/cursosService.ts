// cursosService — gateway for "Cursos Preparatórios" (preparatory courses).
// Talks to the backend API.

import { api } from "@/lib/api";

export type CursoPreparatorio = {
  id: string;
  concurso_id: string;
  nome: string;
  logo_url: string | null;
  contacto: string | null;
  link_externo: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
};

export const cursosService = {
  /** Active courses for a concurso, visible to all users. */
  async listByConcurso(concursoId: string): Promise<CursoPreparatorio[]> {
    try {
      return await api.get<CursoPreparatorio[]>(`/cursos?concurso=${encodeURIComponent(concursoId)}`);
    } catch {
      return [];
    }
  },

  /** All active courses. */
  async listAll(): Promise<CursoPreparatorio[]> {
    try {
      return await api.get<CursoPreparatorio[]>("/cursos");
    } catch {
      return [];
    }
  },

  // ---- Admin ----
  async adminList(): Promise<CursoPreparatorio[]> {
    try {
      return await api.get<CursoPreparatorio[]>("/cursos/admin/all");
    } catch {
      return [];
    }
  },

  create(curso: Omit<CursoPreparatorio, "id">) {
    return api.post("/cursos/admin", curso);
  },

  update(id: string, patch: Partial<CursoPreparatorio>) {
    return api.patch(`/cursos/admin/${id}`, patch);
  },

  remove(id: string) {
    return api.delete(`/cursos/admin/${id}`);
  },
};
