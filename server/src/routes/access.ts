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
// Special case: conc=interesses → grant access if user has any active paid plan.
accessRouter.get("/check", requireAuth, async (req: AuthedRequest, res) => {
  const { conc, cat } = req.query as { conc?: string; cat?: string };

  if (conc === "interesses") {
    const r = await query(
      `select 1 from category_access
         where user_id = $1 and (expires_at is null or expires_at > now()) limit 1`,
      [req.userId],
    );
    const hasPaid = !!r.rows[0];
    return res.json({ hasPaidAccess: hasPaid, expiresAt: hasPaid ? Infinity : null });
  }

  // Virtual "plano" category: grant access if user has an active subscription with at least 1 discipline.
  if (conc === "plano") {
    const r = await query(
      `SELECT 1 FROM user_subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > now()
         AND disciplines IS NOT NULL AND jsonb_array_length(disciplines) > 0
       UNION ALL
       SELECT 1 FROM subscription_members sm
       JOIN user_subscriptions us ON us.id = sm.subscription_id
       WHERE sm.member_user_id = $1 AND us.status = 'active' AND us.expires_at > now()
         AND sm.disciplines IS NOT NULL AND jsonb_array_length(sm.disciplines) > 0
       LIMIT 1`,
      [req.userId],
    );
    const hasPaid = !!r.rows[0];
    return res.json({ hasPaidAccess: hasPaid, expiresAt: hasPaid ? Infinity : null });
  }

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
