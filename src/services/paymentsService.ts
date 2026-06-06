// paymentsService — encapsulates the access-purchase flow:
// proof upload (storage), payment requests, and access-code activation.

import { supabase } from "@/integrations/supabase/client";

export const paymentsService = {
  /** Upload a payment proof to storage and return the stored path. */
  async uploadComprovativo(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("comprovativos").upload(path, file);
    if (error) throw error;
    return path;
  },

  /** Create a payment request row. Returns the new row id. */
  async createPaymentRequest(params: {
    userId: string;
    email: string;
    concursoId: string;
    categoriaId: string;
    categoriaNome: string;
    comprovativoPath: string;
  }): Promise<string> {
    const { data, error } = await supabase
      .from("payment_requests")
      .insert({
        user_id: params.userId,
        email: params.email,
        concurso_id: params.concursoId,
        categoria_id: params.categoriaId,
        categoria_nome: params.categoriaNome,
        comprovativo_url: params.comprovativoPath,
        status: "awaiting_review",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  },

  /** Activate a 6-digit access code. Returns the RPC result. */
  async activateAccessCode(code: string, concursoId: string, categoriaId: string) {
    const { data, error } = await supabase.rpc("activate_access_code", {
      _code: code,
      _conc: concursoId,
      _cat: categoriaId,
    });
    if (error) throw error;
    return data as { ok: boolean; error?: string };
  },
};
