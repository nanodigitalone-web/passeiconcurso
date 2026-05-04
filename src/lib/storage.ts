export type SimuladoResult = {
  id: string;
  concursoId: string;
  categoriaId: string;
  categoriaNome: string;
  data: number;
  total: number;
  acertos: number;
  tempoSegundos: number;
  respostas: { questaoId: string; escolhida: number; correta: number; disciplina: string }[];
};

const KEY_RESULTS = "passei.results.v1";
const KEY_USER = "passei.user.v1";

export const getResults = (): SimuladoResult[] => {
  try { return JSON.parse(localStorage.getItem(KEY_RESULTS) || "[]"); } catch { return []; }
};

export const saveResult = (r: SimuladoResult) => {
  const all = getResults();
  all.unshift(r);
  localStorage.setItem(KEY_RESULTS, JSON.stringify(all));
};

export const clearResults = () => localStorage.removeItem(KEY_RESULTS);

export type UserProfile = { nome: string; avatarColor: string };

export const getUser = (): UserProfile => {
  try {
    const u = localStorage.getItem(KEY_USER);
    if (u) return JSON.parse(u);
  } catch {}
  const colors = ["#1e6fd9", "#0ea5e9", "#0284c7", "#1d4ed8", "#0369a1"];
  const u: UserProfile = { nome: "Candidato", avatarColor: colors[Math.floor(Math.random() * colors.length)] };
  localStorage.setItem(KEY_USER, JSON.stringify(u));
  return u;
};

export const saveUser = (u: UserProfile) => localStorage.setItem(KEY_USER, JSON.stringify(u));

// Mock global ranking, augmented with local user
const mockRanking = [
  { nome: "Domingas K.", pontos: 980 },
  { nome: "Mateus A.", pontos: 940 },
  { nome: "Lucrécia P.", pontos: 910 },
  { nome: "Bento M.", pontos: 880 },
  { nome: "Filomena S.", pontos: 860 },
  { nome: "João F.", pontos: 820 },
  { nome: "Esperança T.", pontos: 790 },
  { nome: "Adão N.", pontos: 760 },
  { nome: "Beatriz L.", pontos: 720 },
  { nome: "Hélder G.", pontos: 690 },
];

export const getRanking = (periodo: "geral" | "semanal" | "mensal" = "geral") => {
  const user = getUser();
  const results = getResults();
  const now = Date.now();
  const cutoff = periodo === "semanal" ? 7 * 86400e3 : periodo === "mensal" ? 30 * 86400e3 : Infinity;
  const filtered = results.filter((r) => now - r.data <= cutoff);
  const userPts = filtered.reduce((s, r) => s + Math.round((r.acertos / r.total) * 100) * 10, 0);
  const list = [...mockRanking.map((m) => ({ ...m, isUser: false })), { nome: user.nome + " (você)", pontos: userPts, isUser: true }];
  return list.sort((a, b) => b.pontos - a.pontos);
};
