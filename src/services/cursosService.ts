// cursosService — gateway for "Cursos Preparatórios" (preparatory courses).
//
// Courses are managed by admins and shown to all authenticated users inside the
// Recursos section. The UI must never touch the Supabase client directly.
import { supabase } from "@/integrations/supabase/client";

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
    const { data } = await supabase
      .from("cursos_preparatorios")
      .select("*")
      .eq("concurso_id", concursoId)
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as CursoPreparatorio[];
  },

  /** All active courses, grouped usage in the Recursos hub. */
  async listAll(): Promise<CursoPreparatorio[]> {
    const { data } = await supabase
      .from("cursos_preparatorios")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as CursoPreparatorio[];
  },

  // ---- Admin ----
  async adminList(): Promise<CursoPreparatorio[]> {
    const { data } = await supabase
      .from("cursos_preparatorios")
      .select("*")
      .order("concurso_id", { ascending: true })
      .order("ordem", { ascending: true });
    return (data ?? []) as CursoPreparatorio[];
  },

  create(curso: Omit<CursoPreparatorio, "id">) {
    return supabase.from("cursos_preparatorios").insert(curso as any);
  },

  update(id: string, patch: Partial<CursoPreparatorio>) {
    return supabase.from("cursos_preparatorios").update(patch as any).eq("id", id);
  },

  remove(id: string) {
    return supabase.from("cursos_preparatorios").delete().eq("id", id);
  },
};
