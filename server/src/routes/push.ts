import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const pushRouter = Router();

// Public VAPID key (safe to expose).
pushRouter.get("/key", (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || "" });
});

pushRouter.post("/subscribe", requireAuth, async (req: AuthedRequest, res) => {
  const { endpoint, p256dh, auth } = req.body || {};
  if (!endpoint || !p256dh || !auth)
    return res.status(400).json({ error: "invalid_input" });
  await query(
    `insert into push_subscriptions (user_id, endpoint, p256dh, auth)
     values ($1,$2,$3,$4)
     on conflict (user_id, endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, updated_at = now()`,
    [req.userId, endpoint, p256dh, auth],
  );
  res.json({ ok: true });
});

pushRouter.post("/unsubscribe", requireAuth, async (req: AuthedRequest, res) => {
  await query("delete from push_subscriptions where user_id = $1 and endpoint = $2", [
    req.userId,
    req.body?.endpoint,
  ]);
  res.json({ ok: true });
});
