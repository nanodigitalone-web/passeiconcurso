// API client — the single low-level gateway from the frontend to the backend
// (Render). Replaces the Supabase client. Stores the JWT in localStorage and
// attaches it as a Bearer token on every request.

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");

const TOKEN_KEY = "passei.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  method: string,
  pathName: string,
  body?: any,
  isForm = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${pathName}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || res.statusText, data?.error);
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => request<T>("GET", p),
  post: <T = any>(p: string, body?: any) => request<T>("POST", p, body),
  patch: <T = any>(p: string, body?: any) => request<T>("PATCH", p, body),
  delete: <T = any>(p: string, body?: any) => request<T>("DELETE", p, body),
  upload: <T = any>(p: string, form: FormData) => request<T>("POST", p, form, true),
  baseUrl: BASE,
};
