// resultsService — encapsulates ALL persistence of quiz results & history.
//
// Currently backed by localStorage (offline-first). The UI never touches
// localStorage directly; it only calls this service. Migrating to Supabase means
// reimplementing these methods against a `quiz_attempts`/`quiz_results` table.

import type { QuizAttempt, QuizResult } from "./types";

const KEY_RESULTS = "passei.results.v1";
const KEY_QSTATS = "passei.qstats.v1";
const KEY_LEARN = "passei.learn.v1";

// ---- quiz results history -------------------------------------------------

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

// ---- per-question statistics (for smart selection) ------------------------

type QStat = { seen: number; wrong: boolean };
type QStatsMap = Record<string, Record<string, QStat>>; // quizId -> questaoId -> stat

const readQStats = (): QStatsMap => {
  try {
    return JSON.parse(localStorage.getItem(KEY_QSTATS) || "{}");
  } catch {
    return {};
  }
};

const writeQStats = (m: QStatsMap) => {
  localStorage.setItem(KEY_QSTATS, JSON.stringify(m));
};

const recordStats = (attempt: QuizAttempt) => {
  const m = readQStats();
  const bucket = m[attempt.quizId] || {};
  attempt.answers.forEach((a) => {
    const prev = bucket[a.questaoId] || { seen: 0, wrong: false };
    const wrongNow = a.escolhida !== a.correta;
    bucket[a.questaoId] = {
      seen: prev.seen + 1,
      // mark as "wrong" if wrong now; clear once answered correctly
      wrong: wrongNow ? true : false,
    };
  });
  m[attempt.quizId] = bucket;
  writeQStats(m);
};

// ---- learn (trilha) day progress ------------------------------------------

type LearnMap = Record<string, number>; // quizId -> highest completed day index (0-based, -1 = none)

const readLearn = (): LearnMap => {
  try {
    return JSON.parse(localStorage.getItem(KEY_LEARN) || "{}");
  } catch {
    return {};
  }
};

const writeLearn = (m: LearnMap) => {
  localStorage.setItem(KEY_LEARN, JSON.stringify(m));
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
    recordStats(attempt);
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

  /** Per-question stats for a quiz: which were seen and which were last wrong. */
  getQuestionStats(quizId: string): Record<string, QStat> {
    return readQStats()[quizId] || {};
  },

  /** Highest completed learn-trail day for a quiz (-1 if none done yet). */
  getLearnDay(quizId: string): number {
    const m = readLearn();
    return quizId in m ? m[quizId] : -1;
  },

  /** Mark a learn-trail day as completed (keeps the furthest reached). */
  completeLearnDay(quizId: string, dayIndex: number) {
    const m = readLearn();
    m[quizId] = Math.max(m[quizId] ?? -1, dayIndex);
    writeLearn(m);
  },
};
