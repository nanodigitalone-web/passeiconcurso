// paymentsService — access-purchase flow: proof upload, payment requests,
// and access-code activation (backend API).

import { api } from "@/lib/api";

export type Pricing = {
  valor: number; // current price in Kz
  valorLabel: string; // formatted current price
  normal: number | null; // strikethrough "before" price (null = no promo)
  normalLabel: string | null;
  isPromo: boolean;
};

const fmtKz = (n: number) => `${n.toLocaleString("pt-PT")} Kz`;

const PRICING: Record<string, { valor: number; normal: number | null }> = {
  "licenciatura-medicina": { valor: 2000, normal: null },
};
const DEFAULT_PRICING = { valor: 1000, normal: 3700 };

export const paymentsService = {
  /** Price for a given concurso. Used by the UI to render purchase screens. */
  getPricing(concursoId: string): Pricing {
    const p = PRICING[concursoId] ?? DEFAULT_PRICING;
    return {
      valor: p.valor,
      valorLabel: fmtKz(p.valor),
      normal: p.normal,
      normalLabel: p.normal != null ? fmtKz(p.normal) : null,
      isPromo: p.normal != null,
    };
  },

  /** Upload a payment proof and return the stored relative path. */
  async uploadComprovativo(_userId: string, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const r = await api.upload<{ path: string; url: string }>("/payments/upload", form);
    return r.path;
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
    const r = await api.post<{ id: string }>("/payments/request", {
      concursoId: params.concursoId,
      categoriaId: params.categoriaId,
      categoriaNome: params.categoriaNome,
      comprovativoPath: params.comprovativoPath,
    });
    return r.id;
  },

  /** Activate a 6-digit access code. */
  async activateAccessCode(code: string, concursoId: string, categoriaId: string) {
    return await api.post<{ ok: boolean; error?: string }>("/payments/activate-code", {
      code,
      concursoId,
      categoriaId,
    });
  },
};
