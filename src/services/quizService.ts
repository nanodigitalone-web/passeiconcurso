// quizService — single source of truth for quiz content and quiz logic.
//
// Today the questions come from local bundled data (src/data). Tomorrow this
// module can fetch from Supabase (or any API) WITHOUT any UI change: the UI only
// ever talks to quizService. To migrate, swap the bodies of the functions below.

import {
  concursos as localConcursos,
  getConcurso as localGetConcurso,
  getCategoria as localGetCategoria,
  type Concurso,
  type Categoria,
  type Question,
} from "@/data/concursos";
import type { QuizAnswer, QuizAttempt, QuizResult } from "./types";
import { resultsService } from "./resultsService";
import { supabase } from "@/integrations/supabase/client";

export type { Concurso, Categoria, Question };

// Correct answers + explanations are NOT bundled in the client. They are
// fetched on demand from the gated `quiz-content` edge function (which enforces
// trial/paid access server-side) and patched into the in-memory question
// objects so the rest of the app keeps working unchanged.
const hydrated = new Set<string>();

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const quizService = {
  /** All available concursos. */
  getConcursos(): Concurso[] {
    return localConcursos;
  },

  getConcurso(concursoId: string): Concurso | undefined {
    return localGetConcurso(concursoId);
  },

  getCategoria(concursoId: string, categoriaId: string): Categoria | undefined {
    return localGetCategoria(concursoId, categoriaId);
  },

  /** Full question bank for a category. */
  getQuestions(concursoId: string, categoriaId: string): Question[] {
    return localGetCategoria(concursoId, categoriaId)?.questoes ?? [];
  },

  /** A randomized, capped set of questions for a single quiz session. */
  getSimuladoQuestions(concursoId: string, categoriaId: string, limit = 20): Question[] {
    return this.getSmartQuestions(concursoId, categoriaId, limit);
  },

  /**
   * Smart selection: prioritizes questions never seen or previously answered
   * wrong, avoids repeating already-mastered questions, and only repeats
   * (randomly) once every question has appeared at least once.
   */
  getSmartQuestions(concursoId: string, categoriaId: string, limit = 20): Question[] {
    const quizId = `${concursoId}/${categoriaId}`;
    const all = this.getQuestions(concursoId, categoriaId);
    const cap = Math.min(limit, all.length);
    const stats = resultsService.getQuestionStats(quizId);

    const unseen = all.filter((q) => !stats[q.id]);
    const wrongSeen = all.filter((q) => stats[q.id] && stats[q.id].wrong);
    const correctSeen = all.filter((q) => stats[q.id] && !stats[q.id].wrong);

    // Priority pool: unseen + previously-wrong (shuffled together), then mastered.
    let pool = [...shuffle([...unseen, ...wrongSeen]), ...shuffle(correctSeen)];

    let selected = pool.slice(0, cap);

    // Only when every distinct question has been used do we allow random repeats.
    if (selected.length < cap) {
      while (selected.length < cap) {
        selected = [...selected, ...shuffle(all)];
      }
      selected = selected.slice(0, cap);
    }
    return selected;
  },

  /** Highest completed learn-trail day for a category (-1 if none). */
  getLearnDay(concursoId: string, categoriaId: string): number {
    return resultsService.getLearnDay(`${concursoId}/${categoriaId}`);
  },

  /** Mark a learn-trail day complete. */
  completeLearnDay(concursoId: string, categoriaId: string, dayIndex: number) {
    resultsService.completeLearnDay(`${concursoId}/${categoriaId}`, dayIndex);
  },


  /** Build a normalized attempt object from the raw quiz interaction. */
  buildAttempt(params: {
    userId: string | null;
    concursoId: string;
    categoriaId: string;
    categoriaNome: string;
    questoes: Question[];
    escolhidas: number[];
    startedAt: number;
    finishedAt?: number;
  }): QuizAttempt {
    const { userId, concursoId, categoriaId, categoriaNome, questoes, escolhidas, startedAt } = params;
    const answers: QuizAnswer[] = questoes.map((q, i) => ({
      questaoId: q.id,
      escolhida: escolhidas[i] ?? -1,
      correta: q.correta,
      disciplina: q.disciplina,
    }));
    return {
      id: crypto.randomUUID(),
      userId,
      quizId: `${concursoId}/${categoriaId}`,
      concursoId,
      categoriaId,
      categoriaNome,
      answers,
      startedAt,
      finishedAt: params.finishedAt ?? Date.now(),
    };
  },

  /** Number of correct answers in an attempt. */
  scoreAttempt(attempt: QuizAttempt): number {
    return attempt.answers.reduce((s, a) => s + (a.escolhida === a.correta ? 1 : 0), 0);
  },

  /**
   * Build the attempt from the raw quiz interaction AND persist it, returning the
   * derived result. This is the single entry point the UI uses to finish a quiz,
   * so it never has to orchestrate persistence itself.
   */
  submitAnswers(params: {
    userId: string | null;
    concursoId: string;
    categoriaId: string;
    categoriaNome: string;
    questoes: Question[];
    escolhidas: number[];
    startedAt: number;
    finishedAt?: number;
  }): QuizResult {
    const attempt = this.buildAttempt(params);
    return resultsService.saveAttempt(attempt);
  },

  /** Past quiz results (delegates to resultsService). */
  getResults(): QuizResult[] {
    return resultsService.getResults();
  },

  getResultById(id: string): QuizResult | undefined {
    return resultsService.getResultById(id);
  },
};
