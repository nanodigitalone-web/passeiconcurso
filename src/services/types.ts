// Normalized data models shared across the services layer.
// These models are designed to map 1:1 to future Supabase tables so the
// migration only requires swapping the service implementations, never the UI.

/** A single answer inside a quiz attempt. */
export type QuizAnswer = {
  questaoId: string;
  escolhida: number; // index chosen by the user (-1 = unanswered)
  correta: number; // index of the correct option
  disciplina: string;
};

/**
 * Canonical quiz attempt model used everywhere in the app.
 * Compatible with a future `quiz_attempts` table in Supabase.
 */
export type QuizAttempt = {
  id: string;
  userId: string | null;
  quizId: string; // `${concursoId}/${categoriaId}`
  concursoId: string;
  categoriaId: string;
  categoriaNome: string;
  answers: QuizAnswer[];
  startedAt: number; // epoch ms
  finishedAt: number; // epoch ms
};

/**
 * A persisted/displayed quiz result. It is derived from a QuizAttempt and adds
 * computed convenience fields used by the result/history screens.
 */
export type QuizResult = {
  id: string;
  userId: string | null;
  quizId: string;
  concursoId: string;
  categoriaId: string;
  categoriaNome: string;
  data: number; // finishedAt (epoch ms) — kept for backwards compatibility
  total: number;
  acertos: number;
  tempoSegundos: number;
  respostas: QuizAnswer[];
};

export type AccessInfo = {
  hasPaidAccess: boolean;
  expiresAt: number | null; // null = none, Infinity = lifetime
};

export type NotificationInput = {
  userId: string | null;
  title: string;
  body: string;
  createdBy?: string | null;
};
