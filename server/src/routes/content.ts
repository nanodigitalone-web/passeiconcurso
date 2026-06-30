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

  // The user's history per question → drives spaced repetition.
  const statsRows = (
    await query(
      `select question_id,
              sum(case when not correct then 1 else 0 end)::int as wrong_count,
              max(answered_at) as last_at,
              (array_agg(correct order by answered_at desc))[1] as last_correct
         from question_attempts
        where user_id = $1 and concurso_id = $2 and categoria_id = $3
        group by question_id`,
      [req.userId, concursoId, categoriaId],
    )
  ).rows;
  const stats = new Map<string, any>();
  for (const s of statsRows) stats.set(s.question_id, s);

  // Spaced-repetition rules:
  //  - unseen questions → top priority.
  //  - a question is on a 5h cooldown after each attempt (no quick repeats).
  //  - answered correctly (mastered) → not repeated.
  //  - answered wrong → reappears (after 5h) up to 3 wrong attempts, then never.
  //  - real-exam (seed) questions are weighted higher than AI ones.
  const COOLDOWN_MS = 5 * 60 * 60 * 1000;
  const MAX_WRONG_REPEATS = 3;
  const now = Date.now();
  const eligible: { q: any; s: number }[] = [];
  const fallback: { q: any; s: number }[] = [];

  for (const q of all) {
    const st = stats.get(q.id);
    let s = Math.random();
    if (q.source === "seed") s += 1;
    if (!st) {
      eligible.push({ q, s: s + 2 }); // unseen
      continue;
    }
    const lastAt = new Date(st.last_at).getTime();
    const cooling = now - lastAt < COOLDOWN_MS;
    const mastered = st.last_correct === true;
    const exhausted = st.wrong_count >= MAX_WRONG_REPEATS;
    if (!cooling && !mastered && !exhausted) {
      eligible.push({ q, s: s + 1.5 }); // wrong, retryable, cooldown passed
    } else {
      fallback.push({ q, s: -(now - lastAt) }); // not eligible now; oldest first
    }
  }

  eligible.sort((a, b) => b.s - a.s);
  let chosen = eligible.slice(0, cap);
  if (chosen.length < cap) {
    // Not enough eligible (rare once the bank is large) → top up so the quiz
    // is never empty, oldest-seen first.
    fallback.sort((a, b) => b.s - a.s);
    chosen = chosen.concat(fallback.slice(0, cap - chosen.length));
  }

  const questions = chosen.map(({ q }) => shuffleOptions(q));
  res.json({ questions });
});
