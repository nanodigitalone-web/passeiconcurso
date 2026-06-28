import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const rankingRouter = Router();

// Overall ranking (optionally filtered by category).
rankingRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const categoria = (req.query.categoria as string) || null;
  const r = await query(
    `select id, nome, avatar_url, pontos, categoria_nome
       from profiles
      where (hidden = false or id = $1)
        and ($2::text is null or categoria_id = $2)
      order by pontos desc
      limit 100`,
    [req.userId, categoria],
  );
  res.json(r.rows);
});

// Weekly ranking (points earned since the start of the week).
rankingRouter.get("/weekly", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select p.id, p.nome, p.avatar_url, coalesce(sum(l.delta),0)::int as pontos, p.categoria_nome
       from profiles p
       join points_log l on l.user_id = p.id
      where l.created_at >= date_trunc('week', now())
        and (p.hidden = false or p.id = $1)
      group by p.id, p.nome, p.avatar_url, p.categoria_nome
     having coalesce(sum(l.delta),0) > 0
      order by pontos desc
      limit 50`,
    [req.userId],
  );
  res.json(r.rows);
});
