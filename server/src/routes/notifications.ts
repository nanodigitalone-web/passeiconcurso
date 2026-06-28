import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const notificationsRouter = Router();

// My notifications (personal + broadcasts).
notificationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const r = await query(
    `select id, user_id, title, body, read, created_at
       from notifications
      where user_id = $1 or user_id is null
      order by created_at desc
      limit 100`,
    [req.userId],
  );
  res.json(r.rows);
});

// Create a personal notification (e.g. "welcome back").
notificationsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { title, body, userId } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "invalid_input" });
  await query(
    "insert into notifications (user_id, title, body, created_by) values ($1,$2,$3,$4)",
    [userId || req.userId, title, body, req.userId],
  );
  res.json({ ok: true });
});

notificationsRouter.post("/read", requireAuth, async (req: AuthedRequest, res) => {
  await query("update notifications set read = true where id = $1 and user_id = $2", [
    req.body?.id,
    req.userId,
  ]);
  res.json({ ok: true });
});

notificationsRouter.post("/read-all", requireAuth, async (req: AuthedRequest, res) => {
  await query("update notifications set read = true where user_id = $1 and read = false", [
    req.userId,
  ]);
  res.json({ ok: true });
});
