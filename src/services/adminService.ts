// adminService — encapsulates ALL admin-panel data access so the admin UI never
// touches the Supabase client directly.

import { supabase } from "@/integrations/supabase/client";

const genCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");

export const adminService = {
  // ---- Stats ----
  async getStats() {
    const [u, b, h, p, cu, ca, pr] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("blocked", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("hidden", true),
      supabase.from("category_access").select("id", { count: "exact", head: true }),
      supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("status", "used"),
      supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("status", "available"),
      supabase.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      users: u.count ?? 0,
      blocked: b.count ?? 0,
      hidden: h.count ?? 0,
      paid: p.count ?? 0,
      codesUsed: cu.count ?? 0,
      codesAvail: ca.count ?? 0,
      payments: pr.count ?? 0,
    };
  },

  // ---- Users ----
  async listProfiles(limit = 500) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("last_seen", { ascending: false, nullsFirst: false })
      .limit(limit);
    return data ?? [];
  },

  async listAllAccess(limit = 2000) {
    const { data } = await supabase.from("category_access").select("*").limit(limit);
    return data ?? [];
  },

  updateProfile(id: string, patch: any) {
    return supabase.from("profiles").update(patch).eq("id", id);
  },

  deleteProfile(id: string) {
    return supabase.from("profiles").delete().eq("id", id);
  },

  // ---- Access management ----
  async grantAccess(params: {
    userId: string;
    concursoId: string;
    categoriaId: string;
    categoriaNome: string;
    months?: number;
  }) {
    const code = genCode();
    const { error: e1 } = await supabase.from("access_codes").insert({
      concurso_id: params.concursoId,
      categoria_id: params.categoriaId,
      code,
      status: "used",
      used_by: params.userId,
      used_at: new Date().toISOString(),
    } as any);
    if (e1 && !String(e1.message).includes("duplicate")) throw e1;

    const accessRow: any = {
      user_id: params.userId,
      concurso_id: params.concursoId,
      categoria_id: params.categoriaId,
      code,
    };
    if (params.months) {
      accessRow.expires_at = new Date(Date.now() + params.months * 30 * 86400000).toISOString();
    }
    const { error: e2 } = await supabase.from("category_access").insert(accessRow);
    if (e2 && !String(e2.message).includes("duplicate")) throw e2;
    return code;
  },

  deactivateAccess(accessId: string) {
    return supabase.from("category_access").delete().eq("id", accessId);
  },

  // ---- Codes ----
  async getCodeStats(concursoId: string, categoriaId: string) {
    const [a, u] = await Promise.all([
      supabase
        .from("access_codes")
        .select("id", { count: "exact", head: true })
        .eq("concurso_id", concursoId)
        .eq("categoria_id", categoriaId)
        .eq("status", "available"),
      supabase
        .from("access_codes")
        .select("id", { count: "exact", head: true })
        .eq("concurso_id", concursoId)
        .eq("categoria_id", categoriaId)
        .eq("status", "used"),
    ]);
    return { available: a.count ?? 0, used: u.count ?? 0 };
  },

  async listCodes(concursoId: string, categoriaId: string, status: "available" | "used", limit = 300) {
    const { data } = await supabase
      .from("access_codes")
      .select("code, status, used_at, used_by")
      .eq("concurso_id", concursoId)
      .eq("categoria_id", categoriaId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },

  async generateCodes(concursoId: string, categoriaId: string, count: number) {
    const { data, error } = await supabase.rpc("admin_generate_codes" as any, {
      _conc: concursoId,
      _cat: categoriaId,
      _count: count,
    });
    if (error) throw error;
    return data as number;
  },

  // ---- Notifications ----
  async listUsersBasic(limit = 500) {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },

  async listRecentNotifications(limit = 20) {
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as any[]) ?? [];
  },

  sendNotification(params: { title: string; body: string; createdBy?: string; userId: string | null }) {
    return supabase.from("notifications" as any).insert({
      title: params.title,
      body: params.body,
      created_by: params.createdBy,
      user_id: params.userId,
    } as any);
  },

  // ---- Comprovativos / payment requests ----
  async listPaymentRequests(filter: "all" | "awaiting_review" | "approved" | "rejected", limit = 200) {
    let q = supabase.from("payment_requests").select("*").order("created_at", { ascending: false }).limit(limit);
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    return data ?? [];
  },

  async listProfilesByIds(ids: string[]) {
    if (!ids.length) return [] as any[];
    const { data } = await supabase.from("profiles").select("id, nome, email, avatar_url").in("id", ids);
    return data ?? [];
  },

  async getComprovativoUrl(path: string) {
    const { data, error } = await supabase.storage.from("comprovativos").createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw error ?? new Error("no_url");
    return data.signedUrl;
  },

  async approvePayment(r: any) {
    const code = await this.grantAccess({
      userId: r.user_id,
      concursoId: r.concurso_id,
      categoriaId: r.categoria_id,
      categoriaNome: r.categoria_nome ?? r.categoria_id,
      months: 4,
    });
    await supabase.from("payment_requests").update({ status: "approved" as any }).eq("id", r.id);
    return code;
  },

  rejectPayment(id: string) {
    return supabase.from("payment_requests").update({ status: "rejected" as any }).eq("id", id);
  },

  // ---- Coin top-ups ----
  async listTopupRequests(filter: "all" | "awaiting_review" | "approved" | "rejected", limit = 200) {
    let q = supabase
      .from("coin_topup_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    return (data as any[]) ?? [];
  },

  async approveTopup(r: any) {
    const { error } = await supabase.rpc("admin_credit_coins" as any, {
      _user: r.user_id,
      _amount: r.moedas,
      _desc: `Carregamento de ${r.moedas} moedas`,
    });
    if (error) throw error;
    await supabase.from("coin_topup_requests" as any).update({ status: "approved" }).eq("id", r.id);
  },

  rejectTopup(id: string) {
    return supabase.from("coin_topup_requests" as any).update({ status: "rejected" }).eq("id", id);
  },

  // ---- Withdrawals ----
  async listWithdrawals(filter: "all" | "pending" | "paid" | "rejected", limit = 200) {
    let q = supabase
      .from("withdrawal_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    return (data as any[]) ?? [];
  },

  markWithdrawalPaid(id: string) {
    return supabase.from("withdrawal_requests" as any).update({ status: "paid" }).eq("id", id);
  },

  async rejectWithdrawal(r: any) {
    // refund coins back to the user
    await supabase.rpc("admin_credit_coins" as any, {
      _user: r.user_id,
      _amount: r.moedas,
      _desc: "Saque rejeitado — moedas devolvidas",
    });
    return supabase.from("withdrawal_requests" as any).update({ status: "rejected" }).eq("id", r.id);
  },
};
