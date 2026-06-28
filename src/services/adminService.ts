// adminService — encapsulates ALL admin-panel data access via the backend API.

import { api } from "@/lib/api";

export const adminService = {
  // ---- Stats ----
  async getStats() {
    try {
      return await api.get("/admin/stats");
    } catch {
      return { users: 0, blocked: 0, hidden: 0, paid: 0, codesUsed: 0, codesAvail: 0, payments: 0 };
    }
  },

  // ---- Users ----
  async listProfiles(limit = 500) {
    try {
      return await api.get<any[]>(`/admin/profiles?limit=${limit}`);
    } catch {
      return [];
    }
  },

  async listAllAccess(limit = 2000) {
    try {
      return await api.get<any[]>(`/admin/access?limit=${limit}`);
    } catch {
      return [];
    }
  },

  updateProfile(id: string, patch: any) {
    return api.patch(`/admin/profiles/${id}`, patch);
  },

  deleteProfile(id: string) {
    return api.delete(`/admin/profiles/${id}`);
  },

  // ---- Access management ----
  async grantAccess(params: {
    userId: string;
    concursoId: string;
    categoriaId: string;
    categoriaNome: string;
    months?: number;
  }) {
    const r = await api.post<{ code: string }>("/admin/access/grant", {
      userId: params.userId,
      concursoId: params.concursoId,
      categoriaId: params.categoriaId,
      months: params.months,
    });
    return r.code;
  },

  deactivateAccess(accessId: string) {
    return api.delete(`/admin/access/${accessId}`);
  },

  // ---- Codes ----
  async getCodeStats(concursoId: string, categoriaId: string) {
    try {
      return await api.get<{ available: number; used: number }>(
        `/admin/codes/stats?conc=${encodeURIComponent(concursoId)}&cat=${encodeURIComponent(categoriaId)}`,
      );
    } catch {
      return { available: 0, used: 0 };
    }
  },

  async listCodes(concursoId: string, categoriaId: string, status: "available" | "used", _limit = 300) {
    try {
      return await api.get<any[]>(
        `/admin/codes/list?conc=${encodeURIComponent(concursoId)}&cat=${encodeURIComponent(categoriaId)}&status=${status}`,
      );
    } catch {
      return [];
    }
  },

  async generateCodes(concursoId: string, categoriaId: string, count: number) {
    const r = await api.post<{ created: number }>("/admin/codes/generate", {
      conc: concursoId,
      cat: categoriaId,
      count,
    });
    return r.created;
  },

  // ---- Notifications ----
  async listUsersBasic(limit = 500) {
    const profiles = await this.listProfiles(limit);
    return profiles.map((p: any) => ({ id: p.id, nome: p.nome, email: p.email }));
  },

  async listRecentNotifications(_limit = 20) {
    try {
      return await api.get<any[]>("/admin/notifications");
    } catch {
      return [];
    }
  },

  sendNotification(params: { title: string; body: string; createdBy?: string; userId: string | null }) {
    return api.post("/admin/notifications/broadcast", {
      title: params.title,
      body: params.body,
      userId: params.userId,
    });
  },

  // ---- Comprovativos / payment requests ----
  async listPaymentRequests(filter: "all" | "awaiting_review" | "approved" | "rejected", _limit = 200) {
    try {
      const all = await api.get<any[]>("/admin/payments");
      return filter === "all" ? all : all.filter((r) => r.status === filter);
    } catch {
      return [];
    }
  },

  async listProfilesByIds(ids: string[]) {
    if (!ids.length) return [] as any[];
    const results = await Promise.all(
      ids.map((id) =>
        api
          .get<any>(`/profile/${id}`)
          .then((p) => ({ id: p.id, nome: p.nome, email: p.email, avatar_url: p.avatar_url }))
          .catch(() => null),
      ),
    );
    return results.filter(Boolean);
  },

  async getComprovativoUrl(path: string) {
    // Files are served statically from the backend at /uploads.
    return `${api.baseUrl}/uploads/${path}`;
  },

  async approvePayment(r: any) {
    await api.post(`/admin/payments/${r.id}/approve`);
    return "";
  },

  rejectPayment(id: string) {
    return api.post(`/admin/payments/${id}/reject`);
  },

  // ---- Coin top-ups ----
  async listTopupRequests(filter: "all" | "awaiting_review" | "approved" | "rejected", _limit = 200) {
    try {
      const all = await api.get<any[]>("/admin/topups");
      return filter === "all" ? all : all.filter((r) => r.status === filter);
    } catch {
      return [];
    }
  },

  async approveTopup(r: any) {
    await api.post(`/admin/topups/${r.id}/approve`);
  },

  rejectTopup(id: string) {
    return api.post(`/admin/topups/${id}/reject`);
  },

  // ---- Withdrawals ----
  async listWithdrawals(filter: "all" | "pending" | "paid" | "rejected", _limit = 200) {
    try {
      const all = await api.get<any[]>("/admin/withdrawals");
      return filter === "all" ? all : all.filter((r) => r.status === filter);
    } catch {
      return [];
    }
  },

  markWithdrawalPaid(id: string) {
    return api.post(`/admin/withdrawals/${id}/paid`);
  },

  async rejectWithdrawal(r: any) {
    return api.post(`/admin/withdrawals/${r.id}/reject`);
  },
};
