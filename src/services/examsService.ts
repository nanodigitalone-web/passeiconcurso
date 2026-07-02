// examsService — Simulado Nacional (eventos cronometrados) via backend API.

import { api } from "@/lib/api";

export type ExamSummary = {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  duration_minutes: number;
  entry_cost_moedas: number;
  prize_moedas: number[];
  starts_at: string;
  ends_at: string;
  finalized: boolean;
  participants: number;
  my_entry: {
    joined_at: string;
    started_at: string | null;
    finished_at: string | null;
    score: number | null;
    total: number | null;
  } | null;
};

export type ExamQuestion = {
  id: string;
  disciplina: string | null;
  enunciado: string;
  opcoes: string[];
};

export type ExamStartResponse = {
  exam: Omit<ExamSummary, "participants" | "my_entry">;
  questions: ExamQuestion[];
  started_at: string;
  deadline: string;
  remaining_ms: number;
};

export type ExamSubmitResponse = {
  ok: boolean;
  score: number;
  total: number;
  duration_ms: number;
  pontos: number;
  review: { id: string; correta: number; selected: number; comentario: string | null }[];
};

export type ExamRankRow = {
  id: string;
  nome: string;
  avatar_url: string | null;
  score: number;
  total: number;
  duration_ms: number | null;
  plan_id?: string | null;
};

export type ExamRanking = {
  exam: Omit<ExamSummary, "participants" | "my_entry"> & { ended: boolean };
  my_entry: {
    joined_at: string;
    started_at: string | null;
    finished_at: string | null;
    score: number | null;
    total: number | null;
    duration_ms: number | null;
  } | null;
  standings: ExamRankRow[] | null;
};

export const examsService = {
  async list(): Promise<ExamSummary[]> {
    try {
      return await api.get<ExamSummary[]>("/exams");
    } catch {
      return [];
    }
  },

  join(examId: string) {
    return api.post<{ ok: boolean }>(`/exams/${examId}/join`);
  },

  start(examId: string) {
    return api.post<ExamStartResponse>(`/exams/${examId}/start`);
  },

  submit(examId: string, answers: Record<string, number>) {
    return api.post<ExamSubmitResponse>(`/exams/${examId}/submit`, { answers });
  },

  ranking(examId: string) {
    return api.get<ExamRanking>(`/exams/${examId}/ranking`);
  },
};
