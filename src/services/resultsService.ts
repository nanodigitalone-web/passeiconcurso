// resultsService — encapsulates ALL persistence of quiz results & history.
//
// Currently backed by localStorage (offline-first). The UI never touches
// localStorage directly; it only calls this service. Migrating to Supabase means
// reimplementing these methods against a `quiz_attempts`/`quiz_results` table.

import type { QuizAttempt, QuizResult } from "./types";

const KEY_RESULTS = "passei.results.v1";

const read = (): QuizResult[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY_RESULTS) || "[]");
  } catch {
    return [];
  }
};

const write = (all: QuizResult[]) => {
  localStorage.setItem(KEY_RESULTS, JSON.stringify(all));
};

/** Derive a displayable result from a normalized attempt. */
const toResult = (attempt: QuizAttempt): QuizResult => {
  const acertos = attempt.answers.reduce((s, a) => s + (a.escolhida === a.correta ? 1 : 0), 0);
  return {
    id: attempt.id,
    userId: attempt.userId,
    quizId: attempt.quizId,
    concursoId: attempt.concursoId,
    categoriaId: attempt.categoriaId,
    categoriaNome: attempt.categoriaNome,
    data: attempt.finishedAt,
    total: attempt.answers.length,
    acertos,
    tempoSegundos: Math.max(0, Math.round((attempt.finishedAt - attempt.startedAt) / 1000)),
    respostas: attempt.answers,
  };
};

export const resultsService = {
  /** Persist a finished attempt and return its derived result. */
  saveAttempt(attempt: QuizAttempt): QuizResult {
    const result = toResult(attempt);
    const all = read();
    all.unshift(result);
    write(all);
    return result;
  },

  getResults(): QuizResult[] {
    return read();
  },

  getResultById(id: string): QuizResult | undefined {
    return read().find((r) => r.id === id);
  },

  clearResults() {
    localStorage.removeItem(KEY_RESULTS);
  },
};
