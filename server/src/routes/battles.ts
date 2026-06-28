import { Router } from "express";
import { one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const battlesRouter = Router();

// List my battles (with opponent info).
battlesRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select b.id,
            case when b.challenger_id = $1 then b.opponent_id else b.challenger_id end as opponent_id,
            op.nome as opponent_nome, op.avatar_url as opponent_avatar,
            b.concurso_id, b.categoria_id, b.question_ids, b.status,
            b.challenger_id, b.challenger_score, b.opponent_score,
            b.challenger_done, b.opponent_done, b.winner_id, b.created_at
       from battles b
       join profiles op on op.id = (case when b.challenger_id = $1 then b.opponent_id else b.challenger_id end)
      where b.challenger_id = $1 or b.opponent_id = $1
      order by b.created_at desc`,
    [req.userId],
  );
  res.json(r.rows);
});

// Create a battle.
battlesRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { opponentId, concursoId, categoriaId, questionIds } = req.body || {};
  if (!opponentId || !concursoId || !categoriaId || !Array.isArray(questionIds) || questionIds.length === 0)
    return res.status(400).json({ ok: false, error: "invalid_input" });
  const row = await one<{ id: string }>(
    `insert into battles (challenger_id, opponent_id, concurso_id, categoria_id, question_ids)
     values ($1,$2,$3,$4,$5) returning id`,
    [req.userId, opponentId, concursoId, categoriaId, JSON.stringify(questionIds)],
  );
  res.json({ ok: true, id: row!.id });
});

// Submit my score for a battle (mirrors submit_battle_result).
battlesRouter.post("/:id/result", requireAuth, async (req: AuthedRequest, res) => {
  const score = Number(req.body?.score) || 0;
  const b = await one<any>("select * from battles where id = $1", [req.params.id]);
  if (!b) return res.status(404).json({ ok: false, error: "not_found" });

  if (req.userId === b.challenger_id) {
    await query(
      "update battles set challenger_score = $2, challenger_done = true, status = 'active' where id = $1",
      [b.id, score],
    );
  } else if (req.userId === b.opponent_id) {
    await query(
      "update battles set opponent_score = $2, opponent_done = true, status = 'active' where id = $1",
      [b.id, score],
    );
  } else {
    return res.status(403).json({ ok: false, error: "not_participant" });
  }

  await query(
    `update battles set status = 'finished',
        winner_id = case when challenger_score > opponent_score then challenger_id
                         when opponent_score > challenger_score then opponent_id else null end
      where id = $1 and challenger_done and opponent_done`,
    [b.id],
  );
  res.json({ ok: true });
});
