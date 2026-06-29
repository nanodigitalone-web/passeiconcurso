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
