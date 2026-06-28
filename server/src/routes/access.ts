import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const accessRouter = Router();

// My active paid plans.
accessRouter.get("/plans", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select concurso_id, categoria_id, expires_at from category_access where user_id = $1`,
    [req.userId],
  );
  const now = Date.now();
  const plans = r.rows
    .map((row) => ({
      concursoId: row.concurso_id,
      categoriaId: row.categoria_id,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    }))
    .filter((p) => p.expiresAt === null || p.expiresAt > now)
    .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
  res.json({ plans });
});

// Access for a specific category.
accessRouter.get("/check", requireAuth, async (req: AuthedRequest, res) => {
  const { conc, cat } = req.query as { conc?: string; cat?: string };
  const r = await query(
    `select expires_at from category_access
       where user_id = $1 and concurso_id = $2 and categoria_id = $3 limit 1`,
    [req.userId, conc, cat],
  );
  const row = r.rows[0];
  const expiresAt = row
    ? row.expires_at
      ? new Date(row.expires_at).getTime()
      : Infinity
    : null;
  res.json({
    hasPaidAccess: expiresAt !== null && expiresAt > Date.now(),
    expiresAt,
  });
});
