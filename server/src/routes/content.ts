import { Router } from "express";
import { createRequire } from "module";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { hasCategoryAccess } from "../lib/access.js";
import { query } from "../lib/db.js";
// @ts-ignore - resolved at runtime by tsx
import { getRecursos } from "../../data/_source/recursos.ts";

const require = createRequire(import.meta.url);
// Full quiz bank including correct answers + explanations (server-only).
const bank: any[] = require("../../data/quiz-bank.json");

export const contentRouter = Router();

// Gated correct answers + explanations for a category.
contentRouter.post("/quiz", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  const categoria = bank
    .find((c) => c.id === concursoId)
    ?.categorias.find((cat: any) => cat.id === categoriaId);
  if (!categoria) return res.status(404).json({ error: "not_found" });

  const questions = categoria.questoes.map((q: any) => ({
    id: q.id,
    correta: q.correta,
    comentario: q.comentario,
  }));
  res.json({ questions });
});

// Gated clinical resources for a category.
contentRouter.post("/recursos", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  const data = getRecursos(concursoId, categoriaId);
  res.json({ seccoes: data?.seccoes ?? [] });
});

// Record per-question answers (the adaptive-learning signal). Batched: the
// frontend sends a whole quiz session at once. Fire-and-forget from the client.
contentRouter.post("/attempts", requireAuth, async (req: AuthedRequest, res) => {
  const { attempts } = req.body || {};
  if (!Array.isArray(attempts) || attempts.length === 0)
    return res.status(400).json({ error: "no_attempts" });

  const rows = attempts.slice(0, 200); // cap per request
  const params: any[] = [];
  const tuples = rows
    .map((a: any) => {
      params.push(
        req.userId,
        String(a.questionId ?? ""),
        String(a.concursoId ?? ""),
        String(a.categoriaId ?? ""),
        a.disciplina != null ? String(a.disciplina) : null,
        !!a.correct,
        Number.isInteger(a.selected) ? a.selected : null,
        Number.isInteger(a.durationMs) ? a.durationMs : null,
      );
      const n = params.length;
      return `($${n - 7},$${n - 6},$${n - 5},$${n - 4},$${n - 3},$${n - 2},$${n - 1},$${n})`;
    })
    .join(",");

  await query(
    `insert into question_attempts
       (user_id, question_id, concurso_id, categoria_id, disciplina, correct, selected, duration_ms)
     values ${tuples}`,
    params,
  );
  res.json({ ok: true, saved: rows.length });
});

// Shuffle a question's option positions and remap `correta`, so the correct
// answer is never stuck in the same slot (kills the "always option B" bias).
function shuffleOptions(q: any) {
  const opcoes: string[] = Array.isArray(q.opcoes) ? q.opcoes : JSON.parse(q.opcoes);
  const order = opcoes.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id: q.id,
    disciplina: q.disciplina,
    enunciado: q.enunciado,
    opcoes: order.map((i) => opcoes[i]),
    correta: order.indexOf(q.correta),
    comentario: q.comentario,
    source: q.source,
  };
}

// Smart question set: mixes old (seed = real-exam, weighted higher) and new
// (ai) questions, personalizes by the user's weaknesses (unseen / previously
// wrong first), and shuffles answer positions. The single source the quiz UI
// should use going forward.
contentRouter.post("/questions", requireAuth, async (req: AuthedRequest, res) => {
  const { concursoId, categoriaId, limit } = req.body || {};
  if (!concursoId || !categoriaId)
    return res.status(400).json({ error: "missing_params" });
  if (!(await hasCategoryAccess(req.userId!, concursoId, categoriaId)))
    return res.status(403).json({ error: "Forbidden" });

  const cap = Math.min(Math.max(1, Number(limit) || 20), 100);

  const all = (
    await query(
      `select id, disciplina, enunciado, opcoes, correta, comentario, source
         from questions
        where concurso_id = $1 and categoria_id = $2 and active`,
      [concursoId, categoriaId],
    )
  ).rows;
  if (all.length === 0) return res.json({ questions: [] });

  // The user's history for this category → drives personalization.
  const att = (
    await query(
      `select question_id, correct from question_attempts
        where user_id = $1 and concurso_id = $2 and categoria_id = $3`,
      [req.userId, concursoId, categoriaId],
    )
  ).rows;
  const seen = new Set<string>();
  const wrong = new Set<string>();
  for (const a of att) {
    seen.add(a.question_id);
    if (!a.correct) wrong.add(a.question_id);
  }

  // Score each question: unseen > previously-wrong > mastered; real-exam
  // (seed) questions get a boost so they appear more often than AI ones.
  const scored = all
    .map((q: any) => {
      let s = Math.random();
      if (!seen.has(q.id)) s += 2;
      else if (wrong.has(q.id)) s += 1.5;
      if (q.source === "seed") s += 1;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s);

  const questions = scored.slice(0, cap).map(({ q }) => shuffleOptions(q));
  res.json({ questions });
});
