import { Router } from "express";
import { one, query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const friendsRouter = Router();

// Search users by name / email / friend code.
friendsRouter.get("/search", requireAuth, async (req: AuthedRequest, res) => {
  const q = ((req.query.q as string) || "").trim();
  if (q.length < 2) return res.json([]);
  const r = await query(
    `select id, nome, avatar_url, categoria_nome, friend_code
       from profiles
      where id <> $1 and blocked is not true
        and (nome ilike '%'||$2||'%' or email ilike '%'||$2||'%' or friend_code = upper($2))
      limit 20`,
    [req.userId, q],
  );
  res.json(r.rows);
});

// List my friendships.
friendsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select f.id as friendship_id,
            case when f.requester_id = $1 then f.addressee_id else f.requester_id end as friend_id,
            p.nome, p.avatar_url, p.categoria_nome, p.pontos, f.status,
            case when f.requester_id = $1 then 'outgoing' else 'incoming' end as direction
       from friendships f
       join profiles p on p.id = (case when f.requester_id = $1 then f.addressee_id else f.requester_id end)
      where f.requester_id = $1 or f.addressee_id = $1
      order by f.status, p.nome`,
    [req.userId],
  );
  res.json(r.rows);
});

async function sendRequest(me: string, to: string) {
  if (to === me) return { ok: false, error: "self" };
  const target = await one("select id from profiles where id = $1", [to]);
  if (!target) return { ok: false, error: "not_found" };
  // Reverse pending request => accept.
  const reverse = await one(
    "select id from friendships where requester_id = $1 and addressee_id = $2",
    [to, me],
  );
  if (reverse) {
    await query("update friendships set status = 'accepted' where requester_id = $1 and addressee_id = $2", [to, me]);
    return { ok: true, status: "accepted" };
  }
  await query(
    "insert into friendships (requester_id, addressee_id, status) values ($1,$2,'pending') on conflict (requester_id, addressee_id) do nothing",
    [me, to],
  );
  return { ok: true, status: "pending" };
}

friendsRouter.post("/request", requireAuth, async (req: AuthedRequest, res) => {
  res.json(await sendRequest(req.userId!, req.body?.to));
});

friendsRouter.post("/code", requireAuth, async (req: AuthedRequest, res) => {
  const code = (req.body?.code || "").trim().toUpperCase();
  const target = await one<{ id: string }>("select id from profiles where friend_code = $1", [code]);
  if (!target) return res.json({ ok: false, error: "not_found" });
  res.json(await sendRequest(req.userId!, target.id));
});

friendsRouter.post("/respond", requireAuth, async (req: AuthedRequest, res) => {
  const { id, accept } = req.body || {};
  if (accept) {
    await query(
      "update friendships set status = 'accepted' where id = $1 and addressee_id = $2 and status = 'pending'",
      [id, req.userId],
    );
  } else {
    await query(
      "delete from friendships where id = $1 and (addressee_id = $2 or requester_id = $2)",
      [id, req.userId],
    );
  }
  res.json({ ok: true });
});
