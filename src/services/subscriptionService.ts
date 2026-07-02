import { api } from "@/lib/api";

export type Plan = {
  id: string;
  name: string;
  price_aoa: number;
  max_disciplines: number;
  max_members: number;
  duration_days: number;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  max_disciplines: number;
  max_members: number;
  price_aoa: number;
  status: "pending" | "active" | "expired" | "rejected";
  disciplines: string[];
  disciplines_locked: boolean;
  expires_at: string | null;
  activated_at: string | null;
  comprovativo_url: string | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  member_user_id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  disciplines: string[];
  disciplines_locked: boolean;
  added_at: string;
};

export type UserMembership = {
  id: string;
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  max_disciplines: number;
  sub_expires_at: string | null;
  sub_status: string;
  owner_nome: string;
  owner_email: string;
  disciplines: string[];
  disciplines_locked: boolean;
};

export const subscriptionService = {
  async getPlans(): Promise<Plan[]> {
    const r = await api.get<{ plans: Plan[] }>("/subscriptions/plans");
    return r.plans;
  },

  async getMySubscription(): Promise<{
    subscription: UserSubscription | null;
    membership: UserMembership | null;
    members: FamilyMember[];
  }> {
    return await api.get("/subscriptions/me");
  },

  async subscribe(plan_id: string, comprovativo_url?: string): Promise<{ ok: boolean; subscription: UserSubscription }> {
    return await api.post("/subscriptions", { plan_id, comprovativo_url });
  },

  async uploadComprovativo(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const r = await api.upload<{ path: string; url: string }>("/payments/upload", form);
    return r.url || r.path;
  },

  async chooseDisciplines(subscriptionId: string, disciplines: string[]): Promise<{ ok: boolean; disciplines: string[]; disciplines_locked: boolean }> {
    return await api.post(`/subscriptions/${subscriptionId}/disciplines`, { disciplines });
  },

  async addFamilyMember(subscriptionId: string, member_user_id: string): Promise<{ ok: boolean }> {
    return await api.post(`/subscriptions/${subscriptionId}/members/add`, { member_user_id });
  },

  async searchUsers(q: string): Promise<{ id: string; nome: string; email: string; avatar_url: string | null }[]> {
    const r = await api.get<{ users: any[] }>(`/subscriptions/search-users?q=${encodeURIComponent(q)}`);
    return r.users;
  },

  async getUserAccessPlans(): Promise<{ concursoId: string; categoriaId: string; expiresAt: number | null }[]> {
    const r = await api.get<{ plans: any[] }>("/access/plans");
    return r.plans;
  },
};
