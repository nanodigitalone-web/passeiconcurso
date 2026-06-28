import { Router } from "express";
import { createRequire } from "module";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { hasCategoryAccess } from "../lib/access.js";
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
